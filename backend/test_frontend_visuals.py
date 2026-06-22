import unittest
import os

class TestFrontendVisuals(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.task_form_path = os.path.join(self.base_dir, "app", "..", "..", "frontend", "src", "components", "TaskForm.jsx")
        self.admin_dashboard_path = os.path.join(self.base_dir, "app", "..", "..", "frontend", "src", "pages", "AdminDashboard.jsx")

    def test_task_form_visual_indicators(self):
        self.assertTrue(os.path.exists(self.task_form_path), f"TaskForm.jsx not found at {self.task_form_path}")
        with open(self.task_form_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Legend: "* Required Fields"
        self.assertIn("* Required Fields", content, "Legend '* Required Fields' not found in TaskForm.jsx")

        # Assign Trainee label with asterisk
        self.assertTrue("Assign Trainee" in content and "required-asterisk" in content,
                        "Assign Trainee label does not have visual asterisk indicator")

        # Task Title label with asterisk
        self.assertTrue("Task Title" in content and "required-asterisk" in content,
                        "Task Title label does not have visual asterisk indicator")

        # Optional fields marked clearly
        self.assertIn("ETA (Target completion date/time) (Optional)", content,
                      "ETA label is not marked as Optional")
        self.assertIn("Task Update URL (Optional)", content,
                      "Task Update URL label is not marked as Optional")

        # Accessibility attributes
        # select must have required and aria-required="true"
        self.assertTrue("required" in content and "aria-required=\"true\"" in content,
                        "Accessibility attributes missing in TaskForm.jsx")

    def test_modal_form_visual_indicators(self):
        self.assertTrue(os.path.exists(self.admin_dashboard_path), f"AdminDashboard.jsx not found at {self.admin_dashboard_path}")
        with open(self.admin_dashboard_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Legend: "* Required Fields"
        self.assertIn("* Required Fields", content, "Legend '* Required Fields' not found in AdminDashboard.jsx modal")

        # Title label with asterisk
        self.assertTrue("Title" in content and "required-asterisk" in content,
                        "Title label in modal does not have visual asterisk indicator")

        # Assign Trainee label with asterisk
        self.assertTrue("Assign Trainee" in content and "required-asterisk" in content,
                        "Assign Trainee label in modal does not have visual asterisk indicator")

        # Optional fields marked clearly in modal
        self.assertIn("Description (Optional)", content,
                      "Description label is not marked as Optional in modal")
        self.assertIn("ETA (Completion Date & Time) (Optional)", content,
                      "ETA label is not marked as Optional in modal")
        self.assertIn("Task Update URL (Optional)", content,
                      "Task Update URL label is not marked as Optional in modal")

        # Accessibility attributes
        self.assertTrue("required" in content and "aria-required=\"true\"" in content,
                        "Accessibility attributes missing in AdminDashboard.jsx modal")

if __name__ == "__main__":
    unittest.main()
