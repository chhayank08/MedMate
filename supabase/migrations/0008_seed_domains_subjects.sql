-- ============================================================================
-- Multi-Domain Learning Platform — Seed Predefined Domains and Subjects
-- Task 1.4: Seed predefined domains and subjects
-- Requirements: 1.1, 2.1
-- ============================================================================

-- ─── Insert predefined domains ──────────────────────────────────────────────
insert into public.domains (name, description, icon_name, is_predefined) values
  ('Medical', 'Medical education and clinical studies', 'Stethoscope', true),
  ('Engineering', 'Engineering principles and problem-solving', 'Wrench', true),
  ('Business', 'Business strategy and management', 'Briefcase', true),
  ('Law', 'Legal studies and case law', 'Scale', true),
  ('Science', 'Natural sciences and research', 'Flask', true),
  ('Technology', 'Computer science and technology', 'Laptop', true),
  ('Humanities', 'Literature, history, and arts', 'Book', true)
on conflict (name, created_by) do nothing;

-- ─── Insert Medical domain subjects ─────────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Anatomy', 'Study of body structure'),
    ('Physiology', 'Study of body function'),
    ('Pharmacology', 'Study of drugs and their effects'),
    ('Pathology', 'Study of disease'),
    ('Biochemistry', 'Chemical processes in living organisms'),
    ('Microbiology', 'Study of microorganisms'),
    ('Immunology', 'Study of immune system'),
    ('Genetics', 'Study of genes and heredity'),
    ('Embryology', 'Study of embryonic development'),
    ('Histology', 'Study of tissue structure'),
    ('General Medicine', 'General medical knowledge')
) as s(name, description)
where d.name = 'Medical' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Engineering domain subjects ─────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Calculus', 'Mathematical analysis and optimization'),
    ('Linear Algebra', 'Vector spaces and linear transformations'),
    ('Physics', 'Laws of nature and physical phenomena'),
    ('Circuit Analysis', 'Analysis of electrical circuits'),
    ('Thermodynamics', 'Energy and heat transfer'),
    ('Statics', 'Forces and equilibrium'),
    ('Dynamics', 'Motion and kinematics'),
    ('Materials Science', 'Properties of engineering materials'),
    ('Fluid Mechanics', 'Behavior of fluids'),
    ('Control Systems', 'Automatic control theory')
) as s(name, description)
where d.name = 'Engineering' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Business domain subjects ────────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Accounting', 'Financial reporting and analysis'),
    ('Finance', 'Corporate finance and investments'),
    ('Marketing', 'Market strategy and consumer behavior'),
    ('Operations', 'Operations management and supply chain'),
    ('Strategy', 'Business strategy and competitive advantage'),
    ('Economics', 'Microeconomics and macroeconomics'),
    ('Business Law', 'Legal aspects of business'),
    ('Organizational Behavior', 'Human behavior in organizations'),
    ('Supply Chain', 'Supply chain management'),
    ('Entrepreneurship', 'Starting and growing businesses')
) as s(name, description)
where d.name = 'Business' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Law domain subjects ─────────────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Constitutional Law', 'Constitutional principles and rights'),
    ('Contract Law', 'Formation and enforcement of contracts'),
    ('Criminal Law', 'Criminal offenses and defenses'),
    ('Torts', 'Civil wrongs and liability'),
    ('Civil Procedure', 'Rules of civil litigation'),
    ('Property Law', 'Rights in real and personal property'),
    ('Evidence', 'Rules of evidence in legal proceedings'),
    ('Legal Writing', 'Legal research and writing'),
    ('Criminal Procedure', 'Criminal process and constitutional rights'),
    ('Administrative Law', 'Government agencies and regulations')
) as s(name, description)
where d.name = 'Law' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Science domain subjects ─────────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Chemistry', 'Chemical reactions and compounds'),
    ('Biology', 'Living organisms and life processes'),
    ('Physics', 'Matter, energy, and their interactions'),
    ('Geology', 'Earth structure and processes'),
    ('Astronomy', 'Celestial objects and phenomena'),
    ('Meteorology', 'Atmospheric science and weather'),
    ('Oceanography', 'Ocean systems and marine life'),
    ('Environmental Science', 'Environmental systems and conservation'),
    ('Ecology', 'Ecosystems and biodiversity'),
    ('Botany', 'Plant biology')
) as s(name, description)
where d.name = 'Science' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Technology domain subjects ──────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('Programming', 'Software development fundamentals'),
    ('Data Structures', 'Algorithms and data organization'),
    ('Algorithms', 'Problem-solving techniques'),
    ('Databases', 'Database design and management'),
    ('Networks', 'Computer networking'),
    ('Security', 'Cybersecurity and cryptography'),
    ('Web Development', 'Web technologies and frameworks'),
    ('Mobile Development', 'Mobile app development'),
    ('Cloud Computing', 'Cloud infrastructure and services'),
    ('Machine Learning', 'AI and machine learning')
) as s(name, description)
where d.name = 'Technology' and d.is_predefined = true
on conflict (domain_id, name) do nothing;

-- ─── Insert Humanities domain subjects ──────────────────────────────────────
insert into public.subjects (domain_id, name, description)
select 
  d.domain_id,
  s.name,
  s.description
from public.domains d
cross join (
  values
    ('History', 'Historical events and contexts'),
    ('Philosophy', 'Philosophical thought and ethics'),
    ('Literature', 'Literary analysis and criticism'),
    ('Languages', 'Language learning and linguistics'),
    ('Art', 'Art history and appreciation'),
    ('Music', 'Music theory and history'),
    ('Sociology', 'Social structures and behavior'),
    ('Anthropology', 'Human cultures and societies'),
    ('Political Science', 'Political systems and theory'),
    ('Psychology', 'Human behavior and mental processes')
) as s(name, description)
where d.name = 'Humanities' and d.is_predefined = true
on conflict (domain_id, name) do nothing;
