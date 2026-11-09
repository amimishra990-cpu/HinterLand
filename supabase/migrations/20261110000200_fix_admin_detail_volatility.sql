-- Stable functions may not write. Both detail RPCs record an audit entry, so
-- they must be declared volatile or Postgres rejects the INSERT at runtime.
alter function public.admin_user_detail(uuid) volatile;
alter function public.admin_get_issue(uuid) volatile;
