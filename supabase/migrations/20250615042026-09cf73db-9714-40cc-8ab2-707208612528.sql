
-- Update ALL existing profiles to be subscribed users
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'yearly',
  subscription_end = now() + interval '1 year',
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles
);

-- Also ensure any users without subscriber records get them
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
SELECT 
  p.id,
  p.email,
  true,
  'yearly',
  now() + interval '1 year',
  now()
FROM public.profiles p
LEFT JOIN public.subscribers s ON p.id = s.user_id
WHERE s.user_id IS NULL;
