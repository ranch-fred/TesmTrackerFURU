-- Add the Build log kind to an existing team database.
-- Existing records and membership policies stay unchanged.
begin;
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check check (
  kind in (
    'announcements','tasks','roster','sessions','meetings','expenses','income',
    'purchases','budgets','parts','packing','robot','subsystems','hardware',
    'inspection','rules','programming','build','designs','matches','events',
    'milestones','risks','outreach','judging','resources','portfolio'
  )
);
commit;
