-- Current Tasks: mind dump / Eisenhower matrix
-- Separate from action_tasks (daily execution units)

CREATE TYPE current_task_status AS ENUM (
  'inbox', 'in_progress', 'completed', 'deferred', 'cancelled'
);

CREATE TYPE current_task_source AS ENUM ('manual', 'voice');

CREATE TABLE current_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status current_task_status NOT NULL DEFAULT 'inbox',
  is_urgent BOOLEAN,
  is_important BOOLEAN,
  weekly_goal_id UUID REFERENCES weekly_goals(id) ON DELETE SET NULL,
  source current_task_source NOT NULL DEFAULT 'manual',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT priority_pair CHECK (
    (is_urgent IS NULL AND is_important IS NULL)
    OR (is_urgent IS NOT NULL AND is_important IS NOT NULL)
  )
);

CREATE INDEX idx_current_tasks_status ON current_tasks(status);
CREATE INDEX idx_current_tasks_priority ON current_tasks(is_urgent, is_important);
CREATE INDEX idx_current_tasks_goal ON current_tasks(weekly_goal_id);
CREATE INDEX idx_current_tasks_created ON current_tasks(created_at DESC);

CREATE TRIGGER current_tasks_updated_at
  BEFORE UPDATE ON current_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
