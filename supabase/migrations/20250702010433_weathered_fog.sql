-- Add payment tracking columns to businesses table
DO $$
BEGIN
  -- Check if columns don't exist before adding them
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'nmi_subscription_id') THEN
    ALTER TABLE businesses ADD COLUMN nmi_subscription_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'nmi_customer_vault_id') THEN
    ALTER TABLE businesses ADD COLUMN nmi_customer_vault_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'subscription_status') THEN
    ALTER TABLE businesses ADD COLUMN subscription_status text DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'next_billing_date') THEN
    ALTER TABLE businesses ADD COLUMN next_billing_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'last_payment_date') THEN
    ALTER TABLE businesses ADD COLUMN last_payment_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'payment_method_last_four') THEN
    ALTER TABLE businesses ADD COLUMN payment_method_last_four text;
  END IF;
END $$;

-- Create payment_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  nmi_transaction_id text,
  amount numeric NOT NULL,
  status text NOT NULL,
  type text NOT NULL,
  response_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'payment_history' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create admin access policy for payment_history if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_history' 
    AND policyname = 'Admins can view all payment history'
  ) THEN
    CREATE POLICY "Admins can view all payment history"
      ON payment_history
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'payment_history_business_id_idx') THEN
    CREATE INDEX payment_history_business_id_idx ON payment_history(business_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'businesses_nmi_subscription_id_idx') THEN
    CREATE INDEX businesses_nmi_subscription_id_idx ON businesses(nmi_subscription_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'businesses_subscription_status_idx') THEN
    CREATE INDEX businesses_subscription_status_idx ON businesses(subscription_status);
  END IF;
END $$;