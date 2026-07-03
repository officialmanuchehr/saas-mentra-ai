-- Онбординг после регистрации: profiles.onboarded_at отмечает момент
-- прохождения /onboarding ("Я хочу учиться" / "Я создаю сообщество").
-- Бэкфилл существующих профилей значением created_at — иначе все уже
-- зарегистрированные пользователи (включая seed) при следующем входе
-- без параметра next неожиданно попали бы на /onboarding.

alter table public.profiles add column onboarded_at timestamptz;

update public.profiles set onboarded_at = created_at where onboarded_at is null;
