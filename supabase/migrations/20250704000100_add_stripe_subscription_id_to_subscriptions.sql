-- Add stripe_subscription_id to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text; 