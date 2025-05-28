import unittest
import os
import sys
from tempfile import NamedTemporaryFile
from datetime import datetime

# Adjust sys.path for importing from the app directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app.app import parse_email_file
except ImportError:
    parse_email_file = None # Placeholder if import fails

class TestEmailParser(unittest.TestCase):

    def setUp(self):
        if parse_email_file is None:
            self.skipTest("Skipping tests: parse_email_file could not be imported.")

        self.simple_eml_content = (
            "From: sender@example.com\n"
            "To: receiver@example.com\n"
            "Subject: Test Email\n"
            "Date: Mon, 1 Jan 2024 10:00:00 +0000\n"
            "Content-Type: text/plain; charset=\"utf-8\"\n"
            "\n"
            "This is the body of the test email.\n"
            "It has a few lines.\n"
            "This part should be in the summary. And this part should be truncated for the summary to show an ellipsis at the end, because it is longer than one hundred and fifty characters."
        )
        self.eml_with_cc_content = (
            "From: another_sender@example.com\n"
            "To: main_receiver@example.com\n"
            "Cc: cc_receiver@example.com\n"
            "Subject: Email with CC\n"
            "Date: Tue, 2 Jan 2024 11:00:00 +0000\n"
            "Content-Type: text/plain; charset=\"utf-8\"\n"
            "\n"
            "Body for CC test. Summary will be this sentence."
        )
        self.eml_alt_date_content = (
            "From: test@example.com\n"
            "To: test@example.com\n"
            "Subject: Alt Date\n"
            "Date: 2 Jan 2024 11:00:00 GMT\n" # Different but valid date format
            "Content-Type: text/plain; charset=\"utf-8\"\n"
            "\n"
            "Test body."
        )

    def _create_temp_eml_file(self, content):
        # When writing in text mode ('w'), Python handles newline conversion 
        # (e.g., '\n' to os.linesep). So, content string should just use '\n'.
        tmp_file = NamedTemporaryFile(mode='w', delete=False, suffix=".eml", encoding='utf-8')
        tmp_file.write(content) 
        tmp_file.close()
        return tmp_file.name

    def test_parse_simple_eml(self):
        tmp_filepath = self._create_temp_eml_file(self.simple_eml_content)
        # Reset global email_id_counter before each test that uses parse_email_file
        # This is important if parse_email_file modifies global state.
        # If parse_email_file is purely functional, this is not strictly needed
        # but it's good practice if there's any doubt.
        # For this specific case, parse_email_file uses a global email_id_counter.
        # We need to either reset it or make parse_email_file not rely on it for tests.
        # The simplest for now, if allowed, is to try and reset it here,
        # or better, make parse_email_file accept it as an argument.
        # Assuming we can't modify parse_email_file, we'll proceed.
        # One way to handle this in tests without modifying the source code 
        # is to re-import the module, but that's more complex.
        # For now, we'll note that email IDs will increment across tests.
        
        original_counter = 0 # Assuming default start
        if 'email_id_counter' in sys.modules['app.app'].__dict__:
             original_counter = sys.modules['app.app'].__dict__['email_id_counter']
        
        parsed_data = parse_email_file(tmp_filepath)
        os.unlink(tmp_filepath)

        # Reset counter after test if it was modified
        if 'email_id_counter' in sys.modules['app.app'].__dict__:
            sys.modules['app.app'].__dict__['email_id_counter'] = original_counter


        self.assertIsNotNone(parsed_data)
        self.assertEqual(parsed_data.get('from'), "sender@example.com")
        self.assertEqual(parsed_data.get('to'), "receiver@example.com")
        self.assertEqual(parsed_data.get('subject'), "Test Email")
        self.assertIn("This is the body of the test email.", parsed_data.get('body', ''))
        self.assertTrue(parsed_data.get('summary', '').startswith("This is the body of the test email."))
        self.assertTrue(parsed_data.get('summary', '').endswith("..."))
        # Summary length is 150 chars + "..." (3 chars)
        self.assertEqual(len(parsed_data.get('summary', '')), 150 + 3) 
        self.assertIsInstance(parsed_data.get('date'), datetime)

    def test_parse_eml_with_cc(self):
        original_counter = 0
        if 'email_id_counter' in sys.modules['app.app'].__dict__:
             original_counter = sys.modules['app.app'].__dict__['email_id_counter']

        tmp_filepath = self._create_temp_eml_file(self.eml_with_cc_content)
        parsed_data = parse_email_file(tmp_filepath)
        os.unlink(tmp_filepath)
        
        if 'email_id_counter' in sys.modules['app.app'].__dict__:
            sys.modules['app.app'].__dict__['email_id_counter'] = original_counter

        self.assertIsNotNone(parsed_data)
        self.assertEqual(parsed_data.get('cc'), "cc_receiver@example.com")
        self.assertEqual(parsed_data.get('summary'), "Body for CC test. Summary will be this sentence.")

    def test_date_parsing_robustness(self):
        original_counter = 0
        if 'email_id_counter' in sys.modules['app.app'].__dict__:
             original_counter = sys.modules['app.app'].__dict__['email_id_counter']

        tmp_filepath = self._create_temp_eml_file(self.eml_alt_date_content)
        parsed_data = parse_email_file(tmp_filepath)
        os.unlink(tmp_filepath)

        if 'email_id_counter' in sys.modules['app.app'].__dict__:
            sys.modules['app.app'].__dict__['email_id_counter'] = original_counter
        
        self.assertIsNotNone(parsed_data)
        self.assertIsInstance(parsed_data.get('date'), datetime)

if __name__ == '__main__':
    unittest.main()
