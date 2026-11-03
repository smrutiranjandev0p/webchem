import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
API = "https://webchem-production.up.railway.app"


class WebChemReleaseTests(unittest.TestCase):
    def test_frontend_targets_production_api_not_preview_staging(self):
        self.assertIn(API, HTML)
        self.assertNotIn("beneficial-balance-staging.up.railway.app", HTML)

    def test_frontend_and_backend_auth_routes_are_aligned(self):
        auth = (ROOT / "backend/routes/auth.js").read_text(encoding="utf-8")
        for route in (
            "/api/auth/config", "/api/auth/register", "/api/auth/verify-registration",
            "/api/auth/login", "/api/auth/resend-registration-otp",
            "/api/auth/forgot-password", "/api/auth/reset-password",
            "/api/auth/google", "/api/auth/me",
        ):
            self.assertIn(route, HTML, f"frontend route missing: {route}")
            self.assertIn(route.replace("/api/auth", ""), auth, f"backend auth route missing: {route}")

    def test_cloud_progress_and_ai_tutor_routes_exist(self):
        progress = (ROOT / "backend/routes/progress.js").read_text(encoding="utf-8")
        ai = (ROOT / "backend/routes/ai.js").read_text(encoding="utf-8")
        self.assertIn("/api/progress", HTML)
        self.assertIn("router.get('/', protect", progress)
        self.assertIn("router.put('/', protect", progress)
        self.assertIn("/api/ai/chat", HTML)
        self.assertIn("router.post('/chat'", ai)

    def test_pwa_manifest_icon_and_service_worker_are_present(self):
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest.get("display"), "standalone")
        self.assertTrue(manifest.get("start_url"))
        self.assertTrue(manifest.get("scope"))
        self.assertTrue(manifest.get("icons"))
        for icon in manifest["icons"]:
            self.assertTrue((ROOT / icon["src"]).is_file(), icon["src"])
        self.assertIn('rel="manifest"', HTML)
        self.assertIn("navigator.serviceWorker.register", HTML)
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        for route in ("/api", "/auth", "/progress"):
            self.assertIn(route, sw)
        self.assertIn("manifest.webmanifest", sw)

    def test_no_duplicate_header_settings_button(self):
        self.assertEqual(HTML.count('id="headerSettingsBtn"'), 0)
        self.assertLessEqual(HTML.count("id='webchemSettingsBtn'"), 1)


if __name__ == "__main__":
    unittest.main()
