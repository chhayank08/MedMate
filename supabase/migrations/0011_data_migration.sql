-- ============================================================================
-- Data Migration - Backwards Compatibility
-- Task 27.1, 27.2: Migrate existing users to Medical domain
-- Requirements: 16.1, 16.2, 16.4, 16.5, 16.6
-- ============================================================================

-- ─── Assign Medical domain to all existing users ────────────────────────────
do $$
declare
  medical_domain_id uuid;
  general_medicine_subject_id uuid;
  user_record record;
begin
  -- Get Medical domain ID
  select domain_id into medical_domain_id 
  from public.domains 
  where name = 'Medical' and is_predefined = true;
  
  -- Get General Medicine subject ID
  select subject_id into general_medicine_subject_id 
  from public.subjects 
  where domain_id = medical_domain_id and name = 'General Medicine';

  -- Assign Medical domain to all users
  for user_record in select id from auth.users loop
    insert into public.user_domains (user_id, domain_id)
    values (user_record.id, medical_domain_id)
    on conflict do nothing;
    
    -- Enable General Medicine subject by default
    insert into public.user_subjects (user_id, subject_id)
    values (user_record.id, general_medicine_subject_id)
    on conflict do nothing;
  end loop;

  raise notice 'Migrated % users to Medical domain', (select count(*) from auth.users);
end $$;

-- ─── Tag existing quizzes with Medical domain ───────────────────────────────
do $$
declare
  medical_domain_id uuid;
  subject_mapping record;
  matched_subject_id uuid;
  general_medicine_id uuid;
begin
  select domain_id into medical_domain_id from public.domains where name = 'Medical' and is_predefined = true;
  select subject_id into general_medicine_id from public.subjects where domain_id = medical_domain_id and name = 'General Medicine';

  -- Update all quizzes with Medical domain
  update public.quizzes set domain_id = medical_domain_id where domain_id is null;

  -- Map quizzes to subjects based on existing subject field
  for subject_mapping in select distinct subject from public.quizzes where subject is not null loop
    select subject_id into matched_subject_id 
    from public.subjects 
    where domain_id = medical_domain_id and lower(name) = lower(subject_mapping.subject)
    limit 1;
    
    if matched_subject_id is null then
      matched_subject_id := general_medicine_id;
    end if;
    
    update public.quizzes 
    set subject_id = matched_subject_id 
    where subject = subject_mapping.subject and subject_id is null;
  end loop;

  raise notice 'Tagged % quizzes', (select count(*) from public.quizzes);
end $$;

-- ─── Tag existing summaries with Medical domain ─────────────────────────────
do $$
declare
  medical_domain_id uuid;
  subject_mapping record;
  matched_subject_id uuid;
  general_medicine_id uuid;
begin
  select domain_id into medical_domain_id from public.domains where name = 'Medical' and is_predefined = true;
  select subject_id into general_medicine_id from public.subjects where domain_id = medical_domain_id and name = 'General Medicine';

  update public.summaries set domain_id = medical_domain_id where domain_id is null;

  for subject_mapping in select distinct subject from public.summaries where subject is not null loop
    select subject_id into matched_subject_id 
    from public.subjects 
    where domain_id = medical_domain_id and lower(name) = lower(subject_mapping.subject)
    limit 1;
    
    if matched_subject_id is null then
      matched_subject_id := general_medicine_id;
    end if;
    
    update public.summaries 
    set subject_id = matched_subject_id 
    where subject = subject_mapping.subject and subject_id is null;
  end loop;

  raise notice 'Tagged % summaries', (select count(*) from public.summaries);
end $$;

-- ─── Tag existing tasks with Medical domain ─────────────────────────────────
do $$
declare
  medical_domain_id uuid;
  general_medicine_id uuid;
begin
  select domain_id into medical_domain_id from public.domains where name = 'Medical' and is_predefined = true;
  select subject_id into general_medicine_id from public.subjects where domain_id = medical_domain_id and name = 'General Medicine';

  update public.tasks set domain_id = medical_domain_id where domain_id is null;
  update public.tasks set subject_id = general_medicine_id where subject_id is null and domain_id = medical_domain_id;

  raise notice 'Tagged % tasks', (select count(*) from public.tasks);
end $$;
