-- ==========================================================
-- AccessRoute: Supabase PostgreSQL Database Schema
-- Project: HackNova S3 — AccessRoute (Chennai Accessibility Transit)
-- ==========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations Table (Stations, Stops, Landmarks)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('station', 'stop', 'landmark')),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transport Segments Table (Bus routes, Metro lines, Transfers, Walks)
CREATE TABLE IF NOT EXISTS transport_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  destination_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  transport_type VARCHAR(50) NOT NULL CHECK (transport_type IN ('bus', 'metro', 'rail', 'walk', 'elevator', 'transfer')),
  line_name VARCHAR(100),
  duration_minutes INT NOT NULL DEFAULT 0,
  fare INT NOT NULL DEFAULT 0,
  accessibility JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Accessibility Data Table (Granular audit & verification per station/location)
CREATE TABLE IF NOT EXISTS accessibility_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  attribute VARCHAR(100) NOT NULL, -- "elevator", "stairs", "ramp", "step_free_entrance", "accessible_toilet", "low_floor_vehicles"
  status VARCHAR(50) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'unknown', 'temporarily_unavailable', 'working', 'broken')),
  count INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Routes Table (Pre-computed / Ranked Journeys)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  destination_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL,
  fare INT NOT NULL DEFAULT 0,
  walking_distance INT NOT NULL DEFAULT 0,
  transfers INT NOT NULL DEFAULT 0,
  accessibility_level VARCHAR(50) NOT NULL CHECK (accessibility_level IN ('highly_accessible', 'limited', 'good')),
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Issues Table (User & Field Accessibility Problem Reports)
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  issue_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  user_contact VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. User Profile Table (Impact & Mobility Preferences)
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name VARCHAR(255) DEFAULT 'Chennai Commuter',
  preferences JSONB DEFAULT '{"wheelchair": true, "avoidStairs": true, "minimizeWalking": false, "voiceGuidance": false}'::jsonb,
  total_journeys INT DEFAULT 14,
  accessible_journeys INT DEFAULT 9,
  estimated_savings INT DEFAULT 1240,
  co2_avoided DECIMAL(6, 2) DEFAULT 18.40,
  issues_reported INT DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_transport_segments_origin ON transport_segments(origin_location_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_data_location ON accessibility_data(location_id);
CREATE INDEX IF NOT EXISTS idx_issues_station ON issues(station_id);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_location_id, destination_location_id);
