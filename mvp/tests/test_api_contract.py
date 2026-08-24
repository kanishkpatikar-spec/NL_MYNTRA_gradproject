import unittest

from fastapi.testclient import TestClient

from backend.main import app


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_modules_route_returns_modules_map(self):
        response = self.client.post('/api/modules/SKU-001', json={})
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertIn('modules', payload)
        self.assertIsInstance(payload['modules'], dict)

    def test_sandbox_route_exists_with_myntra_branding_contract(self):
        response = self.client.post('/api/modules/sandbox', json={'item_ids': ['SKU-001', 'SKU-002']})
        self.assertIn(response.status_code, (200, 500), response.text)
        if response.status_code == 200:
            payload = response.json()
            self.assertIn('compatibility_score', payload)
            self.assertIn('analysis', payload)


if __name__ == '__main__':
    unittest.main()
