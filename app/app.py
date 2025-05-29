import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file # Added send_file
from werkzeug.utils import secure_filename
from email.parser import BytesParser
from email.policy import default as email_policy # Renamed to avoid conflict
from email.utils import parsedate_to_datetime
from datetime import datetime
import io # To handle the PDF in memory
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch


app = Flask(__name__)
# Correct UPLOAD_FOLDER path assuming app.py is in 'app' and 'uploads' is at the root
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../uploads'))
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'eml', 'mbox'} # Example allowed extensions

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global data store for parsed emails
parsed_emails = []
email_id_counter = 0

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def parse_email_file(filepath):
    global email_id_counter
    try:
        with open(filepath, 'rb') as fp:
            msg = BytesParser(policy=email_policy).parse(fp)

        email_id_counter += 1
        email_id = email_id_counter

        raw_date = msg.get('Date')
        parsed_date = None
        if raw_date:
            try:
                parsed_date = parsedate_to_datetime(raw_date)
            except Exception:
                parsed_date = raw_date

        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                if content_type == 'text/plain' and 'attachment' not in content_disposition:
                    try:
                        payload = part.get_payload(decode=True)
                        charset = part.get_content_charset() or 'utf-8'
                        body = payload.decode(charset, 'ignore')
                        break 
                    except Exception as e:
                        print(f"Error decoding part: {e}")
                        body = "Error decoding body part."
        else:
            if msg.get_content_type() == 'text/plain':
                try:
                    payload = msg.get_payload(decode=True)
                    charset = msg.get_content_charset() or 'utf-8'
                    body = payload.decode(charset, 'ignore')
                except Exception as e:
                    print(f"Error decoding message: {e}")
                    body = "Error decoding body."
        
        if not body:
            body = "No plain text content found."

        # Generate summary
        summary = body[:150]
        if len(body) > 150:
            summary += "..."

        return {
            'id': email_id,
            'from': msg.get('From'),
            'to': msg.get('To'),
            'cc': msg.get('Cc'),
            'subject': msg.get('Subject'),
            'date': parsed_date,
            'body': body,
            'summary': summary, # Add the generated summary here
            'relevant_parties': "" # Keep as empty string for now
        }
    except Exception as e:
        print(f"Error parsing email file {filepath}: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'email_file' not in request.files:
        return redirect(request.url)
    file = request.files['email_file']
    if file.filename == '':
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        parsed_email_data = parse_email_file(filepath)
        if parsed_email_data:
            parsed_emails.append(parsed_email_data)
            print(f"Parsed emails: {parsed_emails}") # For debugging

        return redirect(url_for('index'))
    else:
        return redirect(request.url)

@app.route('/timeline_data')
def timeline_data():
    emails_for_json = []
    for email_item in parsed_emails:
        item_copy = email_item.copy()
        # Ensure date is serializable
        if hasattr(item_copy.get('date'), 'isoformat'):
            item_copy['date'] = item_copy['date'].isoformat()
        elif item_copy.get('date') is not None and not isinstance(item_copy.get('date'), str):
            # If it's not a datetime object but also not a string, convert to string
            item_copy['date'] = str(item_copy['date'])
        emails_for_json.append(item_copy)
    
    # Sort by date. Assuming date is now an ISO string or a string that sorts chronologically.
    # Handle cases where 'date' might be None or not present for some emails.
    try:
        # Sort by date, newest first. Put items with no date at the end.
        sorted_emails = sorted(
            emails_for_json, 
            key=lambda x: x.get('date', '') if x.get('date') is not None else '', 
            reverse=True
        )
    except TypeError as e:
        print(f"Could not sort emails: {e}")
        # Fallback if sorting fails (e.g. unexpected data types)
        sorted_emails = emails_for_json

    return jsonify(sorted_emails)

@app.route('/update_email/<int:email_id>', methods=['POST'])
def update_email(email_id):
    global parsed_emails
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400

    updated_summary = data.get('summary')
    updated_parties = data.get('relevant_parties')

    email_to_update = None
    for email_item in parsed_emails:
        if email_item['id'] == email_id:
            email_to_update = email_item
            break
    
    if email_to_update:
        if updated_summary is not None:
            email_to_update['summary'] = updated_summary
        if updated_parties is not None:
            email_to_update['relevant_parties'] = updated_parties
        
        # For debugging, you can print the updated list
        # print(f"Updated email {email_id}: {email_to_update}")
        # print(parsed_emails)
        return jsonify({'status': 'success', 'message': 'Email updated successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Email not found'}), 404

@app.route('/download_pdf')
def download_pdf():
    global parsed_emails 
    
    emails_for_pdf = []
    for email_item in parsed_emails:
        item_copy = email_item.copy()
        if hasattr(item_copy.get('date'), 'isoformat'): 
            item_copy['date_str'] = item_copy['date'].strftime('%Y-%m-%d %H:%M:%S') if item_copy['date'] else 'N/A'
        elif isinstance(item_copy.get('date'), str):
            item_copy['date_str'] = item_copy['date'] 
        else:
            item_copy['date_str'] = 'N/A' 
        emails_for_pdf.append(item_copy)

    try:
        # Sort by date, newest first. Using the original 'date' field for sorting.
        sorted_emails = sorted(
            emails_for_pdf, 
            key=lambda x: x.get('date') if x.get('date') is not None else (datetime.min if hasattr(datetime, 'min') else ''), 
            reverse=True
        )
    except Exception as e: 
        print(f"Could not sort emails for PDF: {e}")
        sorted_emails = emails_for_pdf # Fallback to unsorted if specific date objects cause issues

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Email Timeline", styles['h1']))
    story.append(Spacer(1, 0.2*inch))

    for email in sorted_emails:
        # Date (as a prominent entry start)
        story.append(Paragraph(f"Date: {email.get('date_str', 'N/A')}", styles['h2']))
        story.append(Spacer(1, 0.1*inch)) # Small spacer after date

        # From, To, Subject
        story.append(Paragraph(f"From: {email.get('from', 'N/A')}", styles['Normal']))
        if email.get('to'): # Only show To if it exists
            story.append(Paragraph(f"To: {email.get('to', 'N/A')}", styles['Normal']))
        if email.get('cc'): # Only show Cc if it exists
            story.append(Paragraph(f"Cc: {email.get('cc')}", styles['Normal']))
        story.append(Paragraph(f"Subject: {email.get('subject', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))

        # User-edited fields
        story.append(Paragraph(f"<b>Relevant Parties:</b> {email.get('relevant_parties', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"<b>Summary:</b> {email.get('summary', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 0.15*inch)) # Spacer before body

        # Full Email Body
        story.append(Paragraph("<b>Full Email Body:</b>", styles['Normal']))
        body_text = email.get('body', 'N/A').replace('\n', '<br/>') # Ensure this replace is effective
        story.append(Paragraph(body_text, styles['BodyText']))

        story.append(Spacer(1, 0.4*inch)) # Larger spacer between email entries
        # story.append(PageBreak()) # Uncomment if you prefer each email on a new page
        
    doc.build(story)
    pdf_buffer.seek(0)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name='email_timeline.pdf',
        mimetype='application/pdf'
    )

@app.route('/delete_email/<int:email_id>', methods=['POST'])
def delete_email(email_id):
    global parsed_emails
    
    initial_length = len(parsed_emails)
    # List comprehension to create a new list excluding the item to delete
    parsed_emails[:] = [email for email in parsed_emails if email.get('id') != email_id]
    
    if len(parsed_emails) < initial_length:
        # For debugging
        # print(f"Deleted email with ID: {email_id}")
        # print(parsed_emails)
        return jsonify({'status': 'success', 'message': 'Email deleted successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Email not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
