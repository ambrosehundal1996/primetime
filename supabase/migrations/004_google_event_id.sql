-- Link scheduled tasks to Google Calendar events for sync on reschedule
ALTER TABLE action_tasks
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_action_tasks_google_event
  ON action_tasks(google_event_id)
  WHERE google_event_id IS NOT NULL;
