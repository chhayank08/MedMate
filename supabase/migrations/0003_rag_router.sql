-- ============================================================================
-- MedMate AI — RAG + AI Router (Phase 3/4 backend)
-- Adds pgvector, document/chunk storage, crawled college documents, an
-- embedding cache, and AI usage/cost tracking. Follows 0001 conventions:
-- `if not exists`, owner-only RLS (auth.uid() = user_id), explicit indexes.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- ============================================================================

create extension if not exists vector;

-- ============================================================================
-- documents  (one row per indexed source: upload, pasted notes, or crawl)
-- ============================================================================
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  note_id      uuid references public.notes(id) on delete set null,
  title        text not null,
  source_type  text not null default 'upload' check (source_type in ('upload', 'paste', 'crawl')),
  file_path    text,
  file_type    text,
  char_count   integer not null default 0,
  status       text not null default 'ready' check (status in ('pending', 'ready', 'failed')),
  content_hash text,
  created_at   timestamptz not null default now()
);
create index if not exists documents_user_idx on public.documents (user_id, created_at desc);
-- Idempotent indexing: skip re-embedding identical content for the same user.
create unique index if not exists documents_user_hash_uidx
  on public.documents (user_id, content_hash)
  where content_hash is not null;

-- ============================================================================
-- document_chunks  (RAG chunks; embedding stored inline — the standard pgvector
-- pattern. This is the concrete form of the spec's separate "embeddings" table.)
-- ============================================================================
create table if not exists public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  token_count integer not null default 0,
  embedding   vector(768),
  created_at  timestamptz not null default now()
);
create index if not exists document_chunks_doc_idx on public.document_chunks (document_id, chunk_index);
create index if not exists document_chunks_user_idx on public.document_chunks (user_id);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================================
-- college_documents  (crawled official college/university pages → vector store)
-- ============================================================================
create table if not exists public.college_documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  college_name text,
  source_url   text not null,
  title        text,
  content      text not null,
  content_hash text,
  embedding    vector(768),
  crawled_at   timestamptz not null default now()
);
create index if not exists college_documents_user_idx on public.college_documents (user_id, crawled_at desc);
create unique index if not exists college_documents_user_hash_uidx
  on public.college_documents (user_id, content_hash)
  where content_hash is not null;
create index if not exists college_documents_embedding_idx
  on public.college_documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================================
-- embedding_cache  (generate once / reuse; keyed by sha256 of the text)
-- Shared across users — keyed by content hash, so identical text is embedded
-- exactly once. Values are derived vectors, not user data.
-- ============================================================================
create table if not exists public.embedding_cache (
  content_hash text primary key,
  embedding    vector(768) not null,
  model        text not null,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- ai_usage  (per-call token + cost tracking, provider/model analytics)
-- ============================================================================
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  task          text not null,
  provider      text not null,
  model         text not null,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd      numeric(12, 6) not null default 0,
  cache_hit     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at desc);
create index if not exists ai_usage_model_idx on public.ai_usage (user_id, model);

-- ============================================================================
-- ai_response_cache  (short-TTL dedupe of identical generation requests; guards
-- accidental double-submits / retries from re-billing the same tokens)
-- ============================================================================
create table if not exists public.ai_response_cache (
  cache_key  text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  task       text not null,
  response   jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_response_cache_user_idx on public.ai_response_cache (user_id, created_at desc);

-- ============================================================================
-- Row Level Security — owner-only, mirroring 0001.
-- ============================================================================
alter table public.documents          enable row level security;
alter table public.document_chunks    enable row level security;
alter table public.college_documents  enable row level security;
alter table public.embedding_cache    enable row level security;
alter table public.ai_usage           enable row level security;
alter table public.ai_response_cache  enable row level security;

do $$ begin
  -- documents
  create policy "documents_owner" on public.documents
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- document_chunks
  create policy "document_chunks_owner" on public.document_chunks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- college_documents
  create policy "college_documents_owner" on public.college_documents
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- ai_usage
  create policy "ai_usage_owner" on public.ai_usage
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- ai_response_cache
  create policy "ai_response_cache_owner" on public.ai_response_cache
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- embedding_cache: shared, hash-keyed. Authenticated users may read & add.
  create policy "embedding_cache_read" on public.embedding_cache
    for select to authenticated using (true);
  create policy "embedding_cache_write" on public.embedding_cache
    for insert to authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

-- ============================================================================
-- Similarity search RPCs (security definer; filter by the passed user id since
-- definer bypasses RLS). Cosine distance via the <=> operator.
-- ============================================================================
create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_user uuid,
  match_count int default 6,
  doc_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql stable security definer
set search_path = public
as $$
  select dc.id, dc.document_id, dc.chunk_index, dc.content,
         1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.user_id = match_user
    and dc.embedding is not null
    and (doc_id is null or dc.document_id = doc_id)
  order by dc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.match_college_documents(
  query_embedding vector(768),
  match_user uuid,
  match_count int default 6
)
returns table (
  id uuid,
  source_url text,
  title text,
  content text,
  similarity float
)
language sql stable security definer
set search_path = public
as $$
  select cd.id, cd.source_url, cd.title, cd.content,
         1 - (cd.embedding <=> query_embedding) as similarity
  from public.college_documents cd
  where cd.user_id = match_user
    and cd.embedding is not null
  order by cd.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_document_chunks(vector, uuid, int, uuid) to authenticated;
grant execute on function public.match_college_documents(vector, uuid, int) to authenticated;
