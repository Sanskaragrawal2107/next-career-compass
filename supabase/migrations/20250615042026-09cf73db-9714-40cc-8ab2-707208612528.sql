
-- Update existing profiles to be subscribed users
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'yearly',
  subscription_end = now() + interval '1 year',
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles 
  ORDER BY created_at 
  LIMIT 2
);
