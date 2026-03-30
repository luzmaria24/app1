/*
  # Price Scanner App Schema

  1. New Tables
    - `scanned_items`
      - `id` (uuid, primary key) - Unique identifier for each scanned item
      - `price_original` (numeric) - The original scanned price value
      - `currency` (text) - The currency type (USD or VES for bolívares)
      - `price_bolivares` (numeric) - Converted price in bolívares
      - `exchange_rate` (numeric) - The exchange rate used for conversion
      - `image_uri` (text, nullable) - Optional URI to the captured image
      - `scanned_at` (timestamptz) - Timestamp when the item was scanned
      
  2. Security
    - Enable RLS on `scanned_items` table
    - Add policies for public access (for demo purposes)
    
  3. Notes
    - All prices stored with 2 decimal precision
    - Exchange rate stored for historical tracking
    - Supports both USD and VES (Venezuelan Bolívar) currencies
*/

CREATE TABLE IF NOT EXISTS scanned_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_original numeric(10, 2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('USD', 'VES')),
  price_bolivares numeric(10, 2) NOT NULL,
  exchange_rate numeric(10, 4) NOT NULL,
  image_uri text,
  scanned_at timestamptz DEFAULT now()
);

ALTER TABLE scanned_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scanned items
CREATE POLICY "Anyone can view scanned items"
  ON scanned_items
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to insert scanned items
CREATE POLICY "Anyone can insert scanned items"
  ON scanned_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to delete scanned items
CREATE POLICY "Anyone can delete scanned items"
  ON scanned_items
  FOR DELETE
  TO anon
  USING (true);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS scanned_items_scanned_at_idx ON scanned_items(scanned_at DESC);