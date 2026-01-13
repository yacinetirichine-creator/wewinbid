-- Migration: Add Stripe subscription fields to profiles table
-- Run this in Supabase SQL Editor if table already exists

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Create tables for tracking usage
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memoires_techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_generated_images_user_created ON generated_images(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_presentations_user_created ON presentations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_memoires_techniques_user_created ON memoires_techniques(user_id, created_at);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoires_techniques ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generated images" ON generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated images" ON generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own presentations" ON presentations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own presentations" ON presentations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own memoires" ON memoires_techniques FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memoires" ON memoires_techniques FOR INSERT WITH CHECK (auth.uid() = user_id);
