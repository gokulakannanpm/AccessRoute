-- ==========================================================
-- AccessRoute: Chennai Seed Data (Supabase PostgreSQL)
-- Primary Demo: Chennai Central -> Guindy Metro
-- Note: Seeded data for hackathon demonstration. Clearly labeled.
-- ==========================================================

-- Clear existing data
TRUNCATE TABLE issues, accessibility_data, transport_segments, routes, user_profile, locations CASCADE;

-- Insert Chennai Locations
INSERT INTO locations (id, name, type, latitude, longitude, description, created_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'Chennai Central', 'station', 13.0827, 80.2707, 'Chennai Central Railway & Metro Hub (Puratchi Thalaivar Dr. M.G. Ramachandran Central)', NOW()),
('a0000001-0000-0000-0000-000000000002', 'Guindy Metro', 'station', 13.0001, 80.2408, 'Guindy Metro Station & MTC Transit Interchange', NOW()),
('a0000001-0000-0000-0000-000000000003', 'Egmore Station', 'station', 13.0792, 80.2610, 'Chennai Egmore Railway & Metro Station', NOW()),
('a0000001-0000-0000-0000-000000000004', 'T. Nagar', 'stop', 13.0418, 80.2341, 'T. Nagar Bus Terminus & Commercial Hub', NOW()),
('a0000001-0000-0000-0000-000000000005', 'Apollo Hospital', 'landmark', 13.0604, 80.2520, 'Apollo Hospital Greams Road, Thousand Lights', NOW()),
('a0000001-0000-0000-0000-000000000006', 'Saidapet Metro', 'station', 13.0232, 80.2281, 'Saidapet Metro Station (Blue Line)', NOW()),
('a0000001-0000-0000-0000-000000000007', 'Alandur Metro', 'station', 13.0039, 80.2014, 'Alandur Elevated Metro Interchange (Blue & Green Line)', NOW()),
('a0000001-0000-0000-0000-000000000008', 'Chennai Airport', 'station', 12.9815, 80.1636, 'Chennai International Airport Metro Terminal', NOW());

-- Insert Accessibility Data for Stations
-- Guindy Metro
INSERT INTO accessibility_data (id, location_id, attribute, status, count, verified, verification_date, details, created_at) VALUES
('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'elevator', 'working', 2, true, '2024-08-15', 'Gate B: operational, Gate C: operational with braille buttons', NOW()),
('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'ramp', 'present', 1, true, '2024-08-15', 'Main entrance has accessible gradient ramp with handrails', NOW()),
('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'stairs', 'present', 2, true, '2024-08-15', 'Present but bypass available via elevator', NOW()),
('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'step_free_entrance', 'present', 1, true, '2024-08-15', 'Step-free access through Gate 2 with wide automated fare gate', NOW()),
('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'accessible_toilet', 'present', 1, true, '2024-08-15', 'Available on platform level with wheelchair turnaround space', NOW()),
('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'low_floor_vehicles', 'present', 1, true, '2024-08-15', 'Metro trains have step-free access and dedicated wheelchair bays', NOW());

-- Chennai Central
INSERT INTO accessibility_data (id, location_id, attribute, status, count, verified, verification_date, details, created_at) VALUES
('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000001', 'elevator', 'working', 4, true, '2024-08-10', 'Subway elevators operational at Wall Tax Rd and Poonamallee High Rd', NOW()),
('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'ramp', 'present', 2, true, '2024-08-10', 'Tactile pathway & ramp at Main Concourse Gate 1', NOW()),
('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000001', 'stairs', 'present', 6, true, '2024-08-10', 'Bypass elevators available to all platforms', NOW()),
('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001', 'step_free_entrance', 'present', 1, true, '2024-08-10', 'Wide automatic doors with level boarding access at Gate 1', NOW()),
('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000001', 'accessible_toilet', 'present', 2, true, '2024-08-10', 'Accessible restroom near waiting hall on ground floor', NOW()),
('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000001', 'low_floor_vehicles', 'present', 1, true, '2024-08-10', 'Blue Line and Green Line metro trains offer level boarding', NOW());

-- Insert Transport Segments
INSERT INTO transport_segments (id, origin_location_id, destination_location_id, transport_type, line_name, duration_minutes, fare, accessibility, created_at) VALUES
('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'bus', 'MTC Bus 21', 18, 10, '{"lowFloor": true, "ramp": true, "wheelchairBay": true}'::jsonb, NOW()),
('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'metro', 'Chennai Metro Line 2 (Blue Line)', 14, 15, '{"stepFreePlatform": true, "audioVisualAnnouncements": true}'::jsonb, NOW()),
('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'metro', 'Chennai Metro Direct', 20, 35, '{"stepFreePlatform": true, "stairsRequiredAtTransfer": true}'::jsonb, NOW()),
('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'bus', 'MTC Bus 18G', 38, 15, '{"lowFloor": false, "ramp": false, "lowStep": true}'::jsonb, NOW());

-- Insert Pre-computed Routes for Chennai Central -> Guindy
INSERT INTO routes (id, origin_location_id, destination_location_id, duration_minutes, fare, walking_distance, transfers, accessibility_level, segments, created_at) VALUES
(
  'd0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  38,
  25,
  180,
  1,
  'highly_accessible',
  '[
    {"type": "walk", "distance": 120, "description": "Walk to bus stop", "accessibility": "step-free", "duration": 2},
    {"type": "bus", "line": "MTC Bus 21", "accessibility": "low-floor, ramp", "duration": 18, "badge": "MTC Bus 21", "routeName": "Bus 21"},
    {"type": "walk", "distance": 80, "description": "Transfer to metro", "accessibility": "smooth", "duration": 2},
    {"type": "elevator", "location": "Guindy Metro Gate B", "accessibility": "step-free to platform", "duration": 1, "elevatorName": "Elevator B"},
    {"type": "metro", "line": "Chennai Metro Line 2", "accessibility": "step-free platform", "duration": 14, "routeName": "Blue Line"}
  ]'::jsonb,
  NOW()
),
(
  'd0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  31,
  35,
  620,
  1,
  'limited',
  '[
    {"type": "walk", "distance": 300, "description": "Walk to metro station (stairs required)", "accessibility": "stairs-only", "duration": 5},
    {"type": "metro", "line": "Chennai Metro Line 2", "accessibility": "step-free platform", "duration": 20, "routeName": "Blue Line"},
    {"type": "walk", "distance": 320, "description": "Overpass stairs to exit", "accessibility": "stairs", "duration": 6}
  ]'::jsonb,
  NOW()
),
(
  'd0000001-0000-0000-0000-000000000003',
  'a0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  44,
  15,
  300,
  1,
  'good',
  '[
    {"type": "walk", "distance": 150, "description": "Walk to bus stop via ramp entrance", "accessibility": "ramp entrance", "duration": 3},
    {"type": "bus", "line": "MTC Bus 18G", "accessibility": "standard bus, low step", "duration": 38, "badge": "MTC Bus 18G", "routeName": "Bus 18G"},
    {"type": "walk", "distance": 150, "description": "Paved sidewalk to destination", "accessibility": "smooth sidewalk", "duration": 3}
  ]'::jsonb,
  NOW()
);

-- Insert Demo Issues
INSERT INTO issues (id, station_id, issue_type, description, user_contact, status, created_at) VALUES
('e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'elevator_broken', 'Elevator B under maintenance, use Gate C elevator for step-free access', 'commuter1@chennai.in', 'open', NOW() - INTERVAL '2 days'),
('e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'ramp_blocked', 'Temporary maintenance barricade near Gate 1 ramp', 'commuter2@chennai.in', 'resolved', NOW() - INTERVAL '5 days');

-- Insert User Profile & Impact Stats
INSERT INTO user_profile (id, user_id, name, preferences, total_journeys, accessible_journeys, estimated_savings, co2_avoided, issues_reported, created_at, updated_at) VALUES
(
  'f0000001-0000-0000-0000-000000000001',
  'f0000001-0000-0000-0000-000000000001',
  'Chennai Commuter',
  '{"wheelchair": true, "avoidStairs": true, "minimizeWalking": false, "voiceGuidance": false}'::jsonb,
  14,
  9,
  1240,
  18.40,
  3,
  NOW(),
  NOW()
);
