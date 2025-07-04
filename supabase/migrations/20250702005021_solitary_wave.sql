/*
  # Add Payment Tracking Schema
  
  1. New Columns
    - Add payment tracking columns to businesses table
    - Add fields for NMI subscription management
    
  2. New Table
    - Create payment_history table for transaction logging
    
  3. Security
    - Enable RLS on payment_history table
    - Add policies for business owners to view their payment history
*/

-- Add payment tracking columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS nmi_subscription_id text,
ADD COLUMN IF NOT EXISTS nmi_customer_vault_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS payment_method_last_four text;

-- Create payment_history table
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

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_history
CREATE POLICY "Business owners can view their payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS payment_history_business_id_idx ON payment_history(business_id);
CREATE INDEX IF NOT EXISTS businesses_nmi_subscription_id_idx ON businesses(nmi_subscription_id);
CREATE INDEX IF NOT EXISTS businesses_subscription_status_idx ON businesses(subscription_status);