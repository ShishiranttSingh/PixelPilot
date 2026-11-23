"""
Unit tests for app.services.workflow_state.

Pure Python (unittest style) so they run with plain ``python -m unittest`` as
well as under pytest, with no database, Redis or Celery required.
"""

import unittest

from app.services.workflow_state import (
    ACTIVE_STATUSES,
    ALL_STATUSES,
    TERMINAL_STATUSES,
    compute_progress,
    current_stage_index,
    failure_message,
    is_active,
    is_terminal,
)


class StatusVocabularyTests(unittest.TestCase):
    def test_every_status_is_active_xor_terminal(self):
        for status in ALL_STATUSES:
            self.assertNotEqual(is_active(status), is_terminal(status), status)

    def test_lifecycle_membership(self):
        self.assertEqual(set(ACTIVE_STATUSES), {"pending", "processing"})
        self.assertEqual(set(TERMINAL_STATUSES), {"completed", "failed", "cancelled"})

    def test_unknown_or_missing_status_is_neither(self):
        for status in (None, "", "queued", "COMPLETED"):
            self.assertFalse(is_active(status))
            self.assertFalse(is_terminal(status))


class ComputeProgressTests(unittest.TestCase):
    def test_completed_is_always_100_even_without_meta(self):
        self.assertEqual(compute_progress("completed", None), 100)
        self.assertEqual(compute_progress("completed", {}), 100)
        self.assertEqual(compute_progress("completed", {"progress": 40}), 100)

    def test_pending_is_zero_even_if_meta_has_stale_progress(self):
        self.assertEqual(compute_progress("pending", None), 0)
        self.assertEqual(compute_progress("pending", {"progress": 60}), 0)

    def test_processing_reports_what_the_worker_persisted(self):
        self.assertEqual(compute_progress("processing", {"progress": 0}), 0)
        self.assertEqual(compute_progress("processing", {"progress": 50}), 50)

    def test_processing_without_persisted_progress_is_zero_not_invented(self):
        self.assertEqual(compute_progress("processing", None), 0)
        self.assertEqual(compute_progress("processing", {}), 0)

    def test_hundred_is_reserved_for_completed(self):
        # All stages done but the result is still uploading: never show 100.
        self.assertEqual(compute_progress("processing", {"progress": 100}), 99)
        self.assertEqual(compute_progress("cancelled", {"progress": 100}), 99)
        self.assertEqual(compute_progress("failed", {"progress": 100}), 99)

    def test_failed_and_cancelled_keep_last_known_progress(self):
        self.assertEqual(compute_progress("failed", {"progress": 50}), 50)
        self.assertEqual(compute_progress("cancelled", {"progress": 25}), 25)

    def test_garbage_values_are_clamped_or_zeroed(self):
        self.assertEqual(compute_progress("processing", {"progress": -5}), 0)
        self.assertEqual(compute_progress("processing", {"progress": 1000}), 99)
        self.assertEqual(compute_progress("processing", {"progress": "abc"}), 0)
        self.assertEqual(compute_progress("processing", {"progress": None}), 0)


class CurrentStageTests(unittest.TestCase):
    def test_defaults_to_zero(self):
        self.assertEqual(current_stage_index(None), 0)
        self.assertEqual(current_stage_index({}), 0)
        self.assertEqual(current_stage_index({"current_stage": "x"}), 0)
        self.assertEqual(current_stage_index({"current_stage": -3}), 0)

    def test_reads_persisted_value(self):
        self.assertEqual(current_stage_index({"current_stage": 2}), 2)


class FailureMessageTests(unittest.TestCase):
    def test_only_failed_workflows_have_an_error(self):
        meta = {"error": "RuntimeError: boom"}
        for status in ("pending", "processing", "completed", "cancelled"):
            self.assertIsNone(failure_message(status, meta), status)

    def test_failed_returns_the_stored_error(self):
        self.assertEqual(
            failure_message("failed", {"error": "RuntimeError: boom"}),
            "RuntimeError: boom",
        )

    def test_failed_without_stored_error_still_has_a_meaningful_message(self):
        for meta in (None, {}, {"error": ""}, {"error": "   "}, {"error": 5}):
            message = failure_message("failed", meta)
            self.assertIsInstance(message, str)
            self.assertTrue(message.strip())


if __name__ == "__main__":
    unittest.main()
