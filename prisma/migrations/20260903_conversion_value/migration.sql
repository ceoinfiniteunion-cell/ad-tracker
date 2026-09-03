-- Add conversionValue to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "conversionValue" DOUBLE PRECISION;
