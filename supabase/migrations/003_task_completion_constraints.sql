-- Optional integrity constraints for task completion tracking
-- No new columns required: target_value + completed_value already exist

ALTER TABLE action_tasks
  ADD CONSTRAINT completed_value_non_negative
  CHECK (completed_value IS NULL OR completed_value >= 0);

ALTER TABLE action_tasks
  ADD CONSTRAINT completed_lte_target
  CHECK (
    target_value IS NULL
    OR completed_value IS NULL
    OR completed_value <= target_value
  );
