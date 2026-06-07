-- Primetime: AI Execution Tracker & Accountability Agent
-- Single-user application — no users table required

-- Enums
CREATE TYPE goal_priority AS ENUM ('P0', 'P1', 'P2');
CREATE TYPE goal_status AS ENUM ('active', 'met', 'partially_met', 'missed', 'cancelled');
CREATE TYPE target_type AS ENUM ('count', 'hours', 'sessions', 'boolean');
CREATE TYPE task_status AS ENUM (
  'planned', 'scheduled', 'in_progress', 'completed',
  'partially_completed', 'missed', 'skipped', 'rescheduled'
);
CREATE TYPE task_source AS ENUM ('goal', 'one_time', 'agent');
CREATE TYPE task_event_type AS ENUM (
  'created', 'scheduled', 'started', 'paused', 'resumed',
  'completed', 'missed', 'rescheduled', 'edited', 'skipped'
);
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system', 'tool');
CREATE TYPE insight_category AS ENUM (
  'productivity_window', 'miss_pattern', 'estimation_accuracy',
  'priority_reliability', 'scheduling_habit', 'general'
);

-- Weekly Goals
CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority goal_priority NOT NULL DEFAULT 'P1',
  target_type target_type NOT NULL DEFAULT 'count',
  target_value NUMERIC NOT NULL DEFAULT 1,
  current_value NUMERIC NOT NULL DEFAULT 0,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT week_dates_valid CHECK (week_end_date >= week_start_date),
  CONSTRAINT target_value_positive CHECK (target_value > 0),
  CONSTRAINT current_value_non_negative CHECK (current_value >= 0)
);

-- Action Tasks
CREATE TABLE action_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_goal_id UUID REFERENCES weekly_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority goal_priority NOT NULL DEFAULT 'P1',
  task_date DATE NOT NULL,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  target_value NUMERIC,
  completed_value NUMERIC DEFAULT 0,
  status task_status NOT NULL DEFAULT 'planned',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  source task_source NOT NULL DEFAULT 'goal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT estimated_minutes_positive CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
  CONSTRAINT actual_minutes_non_negative CHECK (actual_minutes IS NULL OR actual_minutes >= 0),
  CONSTRAINT scheduled_times_valid CHECK (
    scheduled_start IS NULL OR scheduled_end IS NULL OR scheduled_end > scheduled_start
  )
);

-- Task Event History (audit trail)
CREATE TABLE task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_task_id UUID NOT NULL REFERENCES action_tasks(id) ON DELETE CASCADE,
  event_type task_event_type NOT NULL,
  old_status task_status,
  new_status task_status,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily Summaries
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL UNIQUE,
  planned JSONB NOT NULL DEFAULT '[]',
  completed JSONB NOT NULL DEFAULT '[]',
  missed JSONB NOT NULL DEFAULT '[]',
  execution_rate NUMERIC,
  time_analysis JSONB DEFAULT '{}',
  reflection JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly Summaries
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  goal_completion JSONB NOT NULL DEFAULT '[]',
  completion_percentages JSONB DEFAULT '{}',
  priority_analysis JSONB DEFAULT '{}',
  best_day DATE,
  worst_day DATE,
  repeated_misses JSONB DEFAULT '[]',
  time_management_insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weekly_summary_dates_valid CHECK (week_end_date >= week_start_date),
  UNIQUE (week_start_date, week_end_date)
);

-- Behavioral Insights
CREATE TABLE behavior_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category insight_category NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  confidence NUMERIC DEFAULT 0.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT confidence_range CHECK (confidence >= 0 AND confidence <= 1)
);

-- Agent Conversations
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent Messages
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_weekly_goals_week ON weekly_goals(week_start_date, week_end_date);
CREATE INDEX idx_weekly_goals_status ON weekly_goals(status);
CREATE INDEX idx_weekly_goals_priority ON weekly_goals(priority);

CREATE INDEX idx_action_tasks_date ON action_tasks(task_date);
CREATE INDEX idx_action_tasks_status ON action_tasks(status);
CREATE INDEX idx_action_tasks_priority ON action_tasks(priority);
CREATE INDEX idx_action_tasks_goal ON action_tasks(weekly_goal_id);
CREATE INDEX idx_action_tasks_scheduled ON action_tasks(scheduled_start, scheduled_end);

CREATE INDEX idx_task_events_task ON task_events(action_task_id);
CREATE INDEX idx_task_events_created ON task_events(created_at);

CREATE INDEX idx_daily_summaries_date ON daily_summaries(summary_date);

CREATE INDEX idx_weekly_summaries_week ON weekly_summaries(week_start_date);

CREATE INDEX idx_behavior_insights_active ON behavior_insights(is_active);
CREATE INDEX idx_behavior_insights_category ON behavior_insights(category);

CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_goals_updated_at
  BEFORE UPDATE ON weekly_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER action_tasks_updated_at
  BEFORE UPDATE ON action_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agent_conversations_updated_at
  BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
