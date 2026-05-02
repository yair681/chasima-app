-- חסימה ילד · Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR UNIQUE,
  password_hash VARCHAR,
  role        VARCHAR NOT NULL CHECK (role IN ('parent', 'child')),
  name        VARCHAR NOT NULL,
  age         INTEGER,
  parent_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  join_code   VARCHAR(4) UNIQUE,
  points      INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  avatar_emoji VARCHAR DEFAULT '😊',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR NOT NULL,
  category    VARCHAR NOT NULL CHECK (category IN ('study','order','help','health','creative','other')),
  points      INTEGER NOT NULL CHECK (points > 0),
  status      VARCHAR DEFAULT 'active'
              CHECK (status IN ('active','pending_approval','approved','completed','rejected')),
  child_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES users(id),
  proof       TEXT,
  completed_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE screen_time_policies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  daily_quota_minutes   INTEGER DEFAULT 120,
  bedtime_start         TIME DEFAULT '21:00',
  bedtime_end           TIME DEFAULT '07:00',
  weekend_bonus_minutes INTEGER DEFAULT 30,
  is_locked             BOOLEAN DEFAULT FALSE,
  lock_reason           VARCHAR,
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE screen_time_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  date         DATE DEFAULT CURRENT_DATE,
  minutes_used INTEGER DEFAULT 0,
  UNIQUE(child_id, date)
);

CREATE TABLE rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR NOT NULL,
  category    VARCHAR,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  emoji       VARCHAR DEFAULT '🎁',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reward_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id    UUID REFERENCES rewards(id) ON DELETE CASCADE,
  child_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  purchased_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_screen_time_usage_child_date ON screen_time_usage(child_id, date);
