-- ============================================================
-- FitHub CRM – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. MEMBERS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('Premium', 'Basic')),
  expiry_date     DATE NOT NULL,
  status          TEXT GENERATED ALWAYS AS (
                    CASE WHEN expiry_date >= CURRENT_DATE THEN 'Active' ELSE 'Expired' END
                  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 2. TRAINERS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  specialization   TEXT NOT NULL,
  phone            TEXT,
  is_available     BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. CLASSES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  schedule     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 4. BOOKINGS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL DEFAULT ('BK-' || nextval('booking_seq')::TEXT),
  member_id      UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  trainer_id     UUID REFERENCES trainers(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Pending')) DEFAULT 'Paid',
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  booked_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence for booking numbers
CREATE SEQUENCE IF NOT EXISTS booking_seq START 1001;

-- ──────────────────────────────────────────────
-- 5. TRIGGER: Auto-assign trainer on booking
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_assign_trainer()
RETURNS TRIGGER AS $$
DECLARE
  available_trainer UUID;
BEGIN
  -- Find first available trainer
  SELECT id INTO available_trainer
  FROM trainers
  WHERE is_available = TRUE
  LIMIT 1;

  IF NEW.trainer_id IS NULL AND available_trainer IS NOT NULL THEN
    NEW.trainer_id := available_trainer;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_assign_trainer ON bookings;
CREATE TRIGGER trg_auto_assign_trainer
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_assign_trainer();

-- ──────────────────────────────────────────────
-- 6. TRIGGER: Auto-calculate amount on booking
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_calculate_amount()
RETURNS TRIGGER AS $$
DECLARE
  member_type TEXT;
BEGIN
  SELECT membership_type INTO member_type
  FROM members WHERE id = NEW.member_id;

  NEW.amount := CASE WHEN member_type = 'Premium' THEN 500 ELSE 300 END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_calculate_amount ON bookings;
CREATE TRIGGER trg_auto_calculate_amount
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_amount();

-- ──────────────────────────────────────────────
-- 7. VIEWS (for reports)
-- ──────────────────────────────────────────────

-- Revenue summary view
CREATE OR REPLACE VIEW vw_revenue_summary AS
SELECT
  COUNT(*) FILTER (WHERE payment_status = 'Paid')    AS paid_count,
  COUNT(*) FILTER (WHERE payment_status = 'Pending') AS pending_count,
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Paid'), 0) AS total_revenue,
  COALESCE(AVG(amount) FILTER (WHERE payment_status = 'Paid'), 0) AS avg_amount
FROM bookings;

-- Membership breakdown view
CREATE OR REPLACE VIEW vw_membership_breakdown AS
SELECT
  COUNT(*) AS total_members,
  COUNT(*) FILTER (WHERE membership_type = 'Premium') AS premium_count,
  COUNT(*) FILTER (WHERE membership_type = 'Basic')   AS basic_count,
  COUNT(*) FILTER (WHERE status = 'Active')           AS active_count,
  COUNT(*) FILTER (WHERE status = 'Expired')          AS expired_count
FROM members;

-- Class popularity view
CREATE OR REPLACE VIEW vw_class_popularity AS
SELECT
  c.id,
  c.name,
  c.capacity,
  COUNT(b.id) AS booking_count,
  CASE WHEN COUNT(b.id) >= c.capacity THEN 'Full' ELSE 'Open' END AS status
FROM classes c
LEFT JOIN bookings b ON b.class_id = c.id
GROUP BY c.id, c.name, c.capacity
ORDER BY booking_count DESC;

-- ──────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (open for prototype)
-- ──────────────────────────────────────────────
ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (prototype mode)
CREATE POLICY "allow_all_members"  ON members  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_trainers" ON trainers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_classes"  ON classes  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bookings" ON bookings FOR ALL TO anon USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 9. SEED DATA (optional – uncomment to use)
-- ──────────────────────────────────────────────
-- SEED DATA
INSERT INTO trainers (name, specialization, phone, is_available) VALUES
  ('Ravi Kumar',   'Yoga & Flexibility',  '+91 98765 43210', true),
  ('Priya Singh',  'Cardio & Zumba',      '+91 87654 32109', true),
  ('Arjun Mehta',  'Strength Training',   '+91 76543 21098', false),
  ('Meera Nair',   'Pilates',             '+91 91234 11111', true),
  ('Sahil Verma',  'CrossFit',            '+91 92345 22222', true),
  ('Aisha Khan',   'HIIT',                '+91 93456 33333', false);

INSERT INTO members (name, email, phone, membership_type, expiry_date) VALUES
  ('Surya Prakash', 'surya@example.com', '+91 91234 56789', 'Premium', CURRENT_DATE + 90),
  ('Kavya Reddy',   'kavya@example.com', '+91 82345 67890', 'Basic',   CURRENT_DATE + 30),
  ('Arun Babu',     'arun@example.com',  '+91 73456 78901', 'Premium', CURRENT_DATE - 10),
  ('Neha Sharma',   'neha@example.com',  '+91 94567 44444', 'Basic',   CURRENT_DATE + 60),
  ('Vikram Patel',  'vikram@example.com','+91 95678 55555', 'Premium', CURRENT_DATE + 120),
  ('Divya Joshi',   'divya@example.com', '+91 96789 66666', 'Basic',   CURRENT_DATE - 5);

INSERT INTO classes (name, capacity, schedule) VALUES
  ('Morning Yoga',      10, NOW() + INTERVAL '1 day'),
  ('Power Cardio',      15, NOW() + INTERVAL '2 days'),
  ('Weight Training',    8, NOW() + INTERVAL '3 days'),
  ('Pilates Fusion',    12, NOW() + INTERVAL '4 days'),
  ('HIIT Blast',        20, NOW() + INTERVAL '5 days'),
  ('CrossFit Challenge',16, NOW() + INTERVAL '6 days');
