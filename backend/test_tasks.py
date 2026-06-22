from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import unittest
from datetime import datetime

import sys
import os
# Ensure app directory can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.dependencies import get_db
from app.database.db import Base

# Setup a test database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_taskallotment.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency override function
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db

class TestTasksETAValidation(unittest.TestCase):
    def setUp(self):
        # Create the tables in the test database
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)

    def tearDown(self):
        # Drop the tables in the test database
        Base.metadata.drop_all(bind=engine)
        # Clean up test database file if it exists
        if os.path.exists("./test_taskallotment.db"):
            try:
                os.remove("./test_taskallotment.db")
            except Exception:
                pass

    def test_create_task_with_valid_eta_current_year(self):
        current_year = datetime.now().year
        valid_eta = f"{current_year}-12-31T12:00:00"
        
        payload = {
            "title": "Test Task",
            "description": "This is a test task with valid ETA",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": valid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["eta"], valid_eta)

    def test_create_task_with_valid_eta_max_allowed_year(self):
        max_year = datetime.now().year + 5
        valid_eta = f"{max_year}-12-31T23:59:00"
        
        payload = {
            "title": "Test Task Max Year",
            "description": "This is a test task with valid ETA (max year)",
            "assigned_to": 1,
            "priority": "Low",
            "eta": valid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["eta"], valid_eta)

    def test_create_task_with_past_year(self):
        past_year = datetime.now().year - 1
        invalid_eta = f"{past_year}-06-18T12:00:00"
        
        payload = {
            "title": "Test Task Past Year",
            "description": "This task has an ETA in the past year",
            "assigned_to": 1,
            "priority": "High",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("ETA year must be between", response.json()["detail"])

    def test_create_task_with_extremely_old_year_1003(self):
        invalid_eta = "01-08-1003"
        
        payload = {
            "title": "Test Task Extremely Old Year 1003",
            "description": "This task has an extremely old ETA year (1003)",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertTrue("ETA year must be between" in response.json()["detail"] or "Please enter a valid ETA date." in response.json()["detail"])

    def test_create_task_with_extremely_old_year_1800(self):
        invalid_eta = "01-01-1800"
        
        payload = {
            "title": "Test Task 1800 Year",
            "description": "This task has an extremely old ETA year (1800)",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertTrue("ETA year must be between" in response.json()["detail"] or "Please enter a valid ETA date." in response.json()["detail"])

    def test_create_task_with_far_future_year(self):
        future_year = datetime.now().year + 6
        invalid_eta = f"{future_year}-01-01T12:00:00"
        
        payload = {
            "title": "Test Task Far Future Year",
            "description": "This task has an ETA year too far in the future",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("ETA year must be between", response.json()["detail"])

    def test_create_task_with_invalid_text_input(self):
        invalid_eta = "invalid text input"
        
        payload = {
            "title": "Test Task Invalid Format",
            "description": "This task has an invalid ETA format",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Please enter a valid ETA date.", response.json()["detail"])

    def test_create_task_with_invalid_day(self):
        # e.g., Feb 30th
        invalid_eta = f"{datetime.now().year}-02-30T12:00:00"
        
        payload = {
            "title": "Test Task Invalid Day",
            "description": "This task has a day that does not exist in the calendar",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Please enter a valid ETA date.", response.json()["detail"])

    def test_create_task_with_past_date_current_year(self):
        now = datetime.now()
        from datetime import timedelta
        yesterday = now - timedelta(days=1)
        invalid_eta = yesterday.strftime("%Y-%m-%dT%H:%M:%S")
        
        payload = {
            "title": "Test Task Past Date Today",
            "description": "This task has an ETA in the past relative to today",
            "assigned_to": 1,
            "priority": "Medium",
            "eta": invalid_eta,
            "update_url": None
        }
        
        response = self.client.post("/tasks", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertTrue("ETA date cannot be in the past." in response.json()["detail"] or "ETA year must be between" in response.json()["detail"])

if __name__ == "__main__":
    unittest.main()

