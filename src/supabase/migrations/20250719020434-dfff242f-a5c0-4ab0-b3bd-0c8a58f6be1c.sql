-- Add feature flag for payment provider switching
INSERT INTO feature_flags (name, description, is_enabled) 
VALUES ('payment_provider_switching', 'Allow switching between NMI and Stripe payment providers', true)
ON CONFLICT (name) DO NOTHING;