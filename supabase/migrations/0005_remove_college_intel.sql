-- Remove College Intelligence feature: tables, function, and index
drop function if exists public.match_college_documents;
drop table if exists public.college_documents;
drop table if exists public.college_intel;
