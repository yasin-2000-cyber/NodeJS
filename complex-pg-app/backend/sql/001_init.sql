BEGIN;

CREATE TABLE IF NOT EXISTS app_user (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE task_status AS ENUM ('todo','doing','done','blocked');
CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent');

CREATE TABLE IF NOT EXISTS task (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_project_user_created ON project(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_user_project ON task(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_task_user_status ON task(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_user_priority ON task(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(due_date);

COMMIT;

