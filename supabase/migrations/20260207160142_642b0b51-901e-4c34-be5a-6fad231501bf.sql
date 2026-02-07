-- Create enum for measurement source types
CREATE TYPE public.measurement_source AS ENUM (
  'scale', 
  'calipers', 
  'bioimpedance', 
  'dexa', 
  'inbody', 
  'bodpod', 
  'navy_method', 
  'visual_estimate',
  'other'
);

-- Create enum for wearable device types
CREATE TYPE public.wearable_device AS ENUM (
  'whoop',
  'garmin', 
  'fitbit',
  'apple_health'
);

-- Create enum for wearable metric types
CREATE TYPE public.wearable_metric AS ENUM (
  'recovery_score',
  'strain_score',
  'hrv',
  'resting_heart_rate',
  'sleep_score',
  'sleep_duration',
  'respiratory_rate',
  'steps',
  'active_minutes',
  'heart_rate_avg',
  'vo2_max',
  'training_load',
  'body_battery',
  'stress_level',
  'cardio_fitness',
  'stand_hours',
  'calories_burned'
);

-- Create user_body_entries table
CREATE TABLE public.user_body_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Basic metrics
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bmi DECIMAL(4,2),
  
  -- Body fat
  body_fat_percent DECIMAL(4,2),
  measurement_source public.measurement_source,
  
  -- Circumference measurements (in cm)
  neck_cm DECIMAL(5,2),
  shoulders_cm DECIMAL(5,2),
  chest_cm DECIMAL(5,2),
  waist_cm DECIMAL(5,2),
  hips_cm DECIMAL(5,2),
  left_bicep_cm DECIMAL(5,2),
  right_bicep_cm DECIMAL(5,2),
  left_forearm_cm DECIMAL(5,2),
  right_forearm_cm DECIMAL(5,2),
  left_thigh_cm DECIMAL(5,2),
  right_thigh_cm DECIMAL(5,2),
  left_calf_cm DECIMAL(5,2),
  right_calf_cm DECIMAL(5,2),
  
  -- Advanced scan data
  lean_mass_kg DECIMAL(5,2),
  fat_mass_kg DECIMAL(5,2),
  bone_density DECIMAL(4,3),
  visceral_fat_rating INTEGER,
  
  -- Regional body fat (DEXA/InBody)
  trunk_fat_percent DECIMAL(4,2),
  left_arm_fat_percent DECIMAL(4,2),
  right_arm_fat_percent DECIMAL(4,2),
  left_leg_fat_percent DECIMAL(4,2),
  right_leg_fat_percent DECIMAL(4,2),
  
  -- Photo reference
  photo_path TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Unit preference for this entry
  uses_imperial BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_wearable_connections table
CREATE TABLE public.user_wearable_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type public.wearable_device NOT NULL,
  
  -- OAuth tokens (encrypted at rest by Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  
  -- Device-specific identifiers
  external_user_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One connection per device type per user
  UNIQUE(user_id, device_type)
);

-- Create user_wearable_data table
CREATE TABLE public.user_wearable_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type public.wearable_device NOT NULL,
  metric_type public.wearable_metric NOT NULL,
  
  -- The actual value
  value DECIMAL(10,3) NOT NULL,
  
  -- When this metric was recorded by the device
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- When we synced it
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate entries
  UNIQUE(user_id, device_type, metric_type, recorded_at)
);

-- Create indexes for efficient queries
CREATE INDEX idx_body_entries_user_date ON public.user_body_entries(user_id, entry_date DESC);
CREATE INDEX idx_wearable_data_user_device_date ON public.user_wearable_data(user_id, device_type, recorded_at DESC);
CREATE INDEX idx_wearable_data_metric ON public.user_wearable_data(user_id, metric_type, recorded_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.user_body_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wearable_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_body_entries
CREATE POLICY "Users can view their own body entries"
  ON public.user_body_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body entries"
  ON public.user_body_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body entries"
  ON public.user_body_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body entries"
  ON public.user_body_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_wearable_connections
CREATE POLICY "Users can view their own wearable connections"
  ON public.user_wearable_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable connections"
  ON public.user_wearable_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable connections"
  ON public.user_wearable_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable connections"
  ON public.user_wearable_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_wearable_data
CREATE POLICY "Users can view their own wearable data"
  ON public.user_wearable_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable data"
  ON public.user_wearable_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable data"
  ON public.user_wearable_data FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger to body entries
CREATE TRIGGER update_body_entries_updated_at
  BEFORE UPDATE ON public.user_body_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to wearable connections
CREATE TRIGGER update_wearable_connections_updated_at
  BEFORE UPDATE ON public.user_wearable_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();