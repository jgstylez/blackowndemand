-- Add feature flag for black business verification
INSERT INTO feature_flags (name, description, is_enabled) 
VALUES ('black_business_verification_only', 'Ensure only Black-owned businesses can register and be verified on the platform', true)
ON CONFLICT (name) DO NOTHING;