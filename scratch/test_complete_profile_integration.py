import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app

class TestProfileIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_profile_switching(self):
        # Switch to dc_motor_12v
        res = self.client.post("/api/motor-profile", json={"profile_name": "dc_motor_12v"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["active_profile"], "dc_motor_12v")
        self.assertEqual(data["asset_id"], "MOTOR-12V-001")

        # Get profile
        res_get = self.client.get("/api/motor-profile")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["active_profile"], "dc_motor_12v")

    def test_02_dc_conditions_and_ai(self):
        # Ensure profile is DC
        self.client.post("/api/motor-profile", json={"profile_name": "dc_motor_12v"})

        # Check conditions endpoint
        res = self.client.get("/api/sensor/conditions")
        self.assertEqual(res.status_code, 200)
        conds = res.json().get("conditions", [])
        cond_ids = [c["id"] for c in conds]
        self.assertIn("Normal Operation", cond_ids)
        self.assertIn("Loose Foundation", cond_ids)
        self.assertEqual(len(conds), 4)

        # Check AI Status
        res_ai = self.client.get("/api/ai/status?profile=dc_motor_12v")
        self.assertEqual(res_ai.status_code, 200)
        ai_data = res_ai.json()
        self.assertIn("RandomForest", ai_data.get("best_model", ""))
        self.assertEqual(len(ai_data.get("feature_columns", [])), 8)

        # AI Predict test
        sample_features = {
            "curr_mean": 1.5,
            "curr_rms": 1.6,
            "curr_std": 0.2,
            "curr_peak": 2.1,
            "curr_p2p": 1.2,
            "curr_crest_factor": 1.3,
            "curr_fft_peak": 0.5,
            "curr_fft_mean": 0.1
        }
        res_pred = self.client.post("/api/ai/predict", json={"features": sample_features})
        self.assertEqual(res_pred.status_code, 200)
        pred_data = res_pred.json()
        self.assertIn("predicted_class", pred_data)
        self.assertEqual(pred_data.get("model_version"), "v1.0-dc_motor_12v")

    def test_03_cwru_profile_switching(self):
        # Switch back to cwru_2hp
        res = self.client.post("/api/motor-profile", json={"profile_name": "cwru_2hp"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["active_profile"], "cwru_2hp")
        self.assertEqual(data["asset_id"], "MOTOR-2HP-001")

        # Check conditions
        res_conds = self.client.get("/api/sensor/conditions")
        self.assertEqual(res_conds.status_code, 200)
        conds = res_conds.json().get("conditions", [])
        cond_ids = [c["id"] for c in conds]
        self.assertIn("Normal_1", cond_ids)
        self.assertIn("Ball_007_1", cond_ids)
        self.assertEqual(len(conds), 10)

        # Check AI Status
        res_ai = self.client.get("/api/ai/status?profile=cwru_2hp")
        self.assertEqual(res_ai.status_code, 200)
        ai_data = res_ai.json()
        self.assertIn("MLP", ai_data.get("best_model", ""))
        self.assertEqual(len(ai_data.get("feature_columns", [])), 7)

if __name__ == "__main__":
    unittest.main()
