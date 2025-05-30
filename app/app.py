import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file, Response # Added Response
from werkzeug.utils import secure_filename
from email.parser import BytesParser
from email.policy import default as email_policy # Renamed to avoid conflict
from email.utils import parsedate_to_datetime
from datetime import datetime
import io # To handle the PDF in memory
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


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
    global parsed_emails # Ensure this is accessible
    # global email_id_counter # parse_email_file handles this internally

    # Check if the post request has the file part for 'email_files'
    if 'email_files' not in request.files:
        # Consider adding a flash message here if you implement them
        return redirect(request.url) # Or url_for('index')

    uploaded_files = request.files.getlist("email_files")
    
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if not uploaded_files or all(f.filename == '' for f in uploaded_files):
        # Consider adding a flash message here
        return redirect(request.url) # Or url_for('index')

    processed_count = 0
    error_count = 0

    for file in uploaded_files:
        # If the user selects an empty file part without filename
        if file.filename == '':
            continue # Skip this empty part

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                file.save(filepath)
                # parse_email_file uses global email_id_counter and increments it
                parsed_data = parse_email_file(filepath) 
                if parsed_data:
                    parsed_emails.append(parsed_data) # Appending to global list
                    processed_count += 1
                    # print(f"Successfully parsed: {filename}") # For debugging
                else:
                    # File was saved, but parsing failed
                    print(f"Parsing failed for: {filename}")
                    error_count +=1 
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                error_count += 1
        elif file.filename != '': # File was provided but not of allowed type
            print(f"File type not allowed for {file.filename}")
            error_count += 1
            
    # Optional: Add flash messages for processed_count and error_count
    # if processed_count > 0:
    #     flash(f"Successfully processed {processed_count} email(s).", "success")
    # if error_count > 0:
    #     flash(f"Failed to process {error_count} file(s). Check server logs for details.", "danger")
    # if processed_count == 0 and error_count == 0 and not any(f.filename for f in uploaded_files if f): # Should not happen if initial checks are fine
    #     flash("No valid files were found to process.", "warning")


    return redirect(url_for('index')) # Redirect to index page to show updated timeline

@app.route('/timeline_data')
def timeline_data():
    global parsed_emails # Ensure this is accessible
    
    # Create a new list with dates converted to ISO format strings if they are datetime objects
    emails_for_json = []
    for email_item in parsed_emails: # Use global parsed_emails
        item_copy = email_item.copy() 
        if hasattr(item_copy.get('date'), 'isoformat'):
            item_copy['date'] = item_copy['date'].isoformat()
        elif item_copy.get('date') is not None and not isinstance(item_copy.get('date'), str):
             # If it's not a datetime object but also not a string, convert to string
            item_copy['date'] = str(item_copy['date'])
        emails_for_json.append(item_copy)

    sort_order_param = request.args.get('sort_order', 'newest_first') # Default to newest_first
    
    reverse_order = True # Default for newest_first
    if sort_order_param == 'oldest_first':
        reverse_order = False
        
    try:
        # Assuming 'date' is a string that allows chronological sorting (like ISO format)
        # Handle cases where 'date' might be None or not present for some emails.
        sorted_emails = sorted(
            emails_for_json, 
            key=lambda x: x.get('date', '') if x.get('date') is not None else '', 
            reverse=reverse_order
        )
    except TypeError as e:
        print(f"Could not sort emails: {e}")
        # Fallback if sorting fails
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
    global parsed_emails # Access the global list
    
    sort_order_param = request.args.get('sort_order', 'newest_first') # Default to newest_first

    # Prepare emails for PDF, including a sortable/displayable date string
    emails_for_pdf = []
    for email_item in parsed_emails: # Use global parsed_emails
        item_copy = email_item.copy()
        # Ensure 'date' exists and handle its type for reliable sorting and display
        raw_date = item_copy.get('date') # This is the original date object or string
        
        if hasattr(raw_date, 'isoformat'): # Check if it's a datetime object
            item_copy['sortable_date'] = raw_date.isoformat() # Use ISO format for robust sorting
            item_copy['date_str'] = raw_date.strftime('%Y-%m-%d %H:%M:%S') # Formatted for display
        elif isinstance(raw_date, str) and raw_date: # If it's already a non-empty string
            # Attempt to parse it into a datetime object to standardize, then reformat
            # This handles cases where it might be a date string in a parsable format but not datetime
            try:
                dt_obj = parsedate_to_datetime(raw_date) # Or use dateutil.parser if more flexible parsing needed
                item_copy['sortable_date'] = dt_obj.isoformat()
                item_copy['date_str'] = dt_obj.strftime('%Y-%m-%d %H:%M:%S')
            except Exception: # If parsing fails, use the string as is for sorting and display
                item_copy['sortable_date'] = raw_date 
                item_copy['date_str'] = raw_date
        else: # Fallback for unexpected types or None/empty string
            item_copy['sortable_date'] = '' # Ensure it's sortable (empty string sorts consistently)
            item_copy['date_str'] = 'N/A'
        emails_for_pdf.append(item_copy)

    reverse_order = True # Default for newest_first
    if sort_order_param == 'oldest_first':
        reverse_order = False
            
    try:
        # Sort by the 'sortable_date' field.
        sorted_emails = sorted(
            emails_for_pdf, 
            key=lambda x: x.get('sortable_date', '') if x.get('sortable_date') is not None else '', 
            reverse=reverse_order
        )
    except TypeError as e: # Catch type errors during sorting
        print(f"Could not sort emails for PDF due to TypeError: {e}")
        sorted_emails = emails_for_pdf # Fallback to unsorted
    except Exception as e: # Catch any other unexpected errors
        print(f"An unexpected error occurred during PDF email sorting: {e}")
        sorted_emails = emails_for_pdf


    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet() # Base styles

    # Register CJK Font and Create CJK-compatible Styles
    try:
        # Path assumes app.py is in 'app' directory, and 'static' is a sub-directory of 'app'
        font_path = os.path.join(app.root_path, 'static', 'fonts', 'NotoSansCJKsc-Regular.otf')
        pdfmetrics.registerFont(TTFont('NotoSansCJK', font_path))
        
        styles_cjk = {
            'Normal_CJK': ParagraphStyle('Normal_CJK', parent=styles['Normal'], fontName='NotoSansCJK', leading=styles['Normal'].leading * 1.2),
            'BodyText_CJK': ParagraphStyle('BodyText_CJK', parent=styles['BodyText'], fontName='NotoSansCJK', leading=styles['BodyText'].leading * 1.2),
            'h1_CJK': ParagraphStyle('h1_CJK', parent=styles['h1'], fontName='NotoSansCJK', leading=styles['h1'].leading * 1.2),
            'h2_CJK': ParagraphStyle('h2_CJK', parent=styles['h2'], fontName='NotoSansCJK', leading=styles['h2'].leading * 1.2),
        }
        # Fallback to default styles if font registration fails or styles are not created
        # This might happen if the font file is missing or corrupted.
        if not os.path.exists(font_path): # Check if font file exists
             print(f"Font file not found at {font_path}. PDF may not render CJK characters correctly.")
             styles_cjk = styles # Use default styles as fallback
    except Exception as e:
        print(f"Error registering CJK font or creating styles: {e}. Using default styles.")
        styles_cjk = styles # Use default styles as fallback

    story = []
    story.append(Paragraph("Email Timeline", styles_cjk.get('h1_CJK', styles['h1']))) # Use CJK style, fallback to default
    story.append(Spacer(1, 0.2*inch))

    for email in sorted_emails:
        story.append(Paragraph(f"Date: {email.get('date_str', 'N/A')}", styles_cjk.get('h2_CJK', styles['h2'])))
        story.append(Spacer(1, 0.1*inch))

        story.append(Paragraph(f"From: {email.get('from', 'N/A')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        if email.get('to'):
            story.append(Paragraph(f"To: {email.get('to', 'N/A')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        if email.get('cc'):
            story.append(Paragraph(f"Cc: {email.get('cc')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        story.append(Paragraph(f"Subject: {email.get('subject', 'N/A')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        story.append(Spacer(1, 0.1*inch))

        story.append(Paragraph(f"<b>Relevant Parties:</b> {email.get('relevant_parties', 'N/A')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        story.append(Paragraph(f"<b>Summary:</b> {email.get('summary', 'N/A')}", styles_cjk.get('Normal_CJK', styles['Normal'])))
        story.append(Spacer(1, 0.15*inch))

        story.append(Paragraph("<b>Full Email Body:</b>", styles_cjk.get('Normal_CJK', styles['Normal'])))
        body_text = email.get('body', 'N/A').replace('\n', '<br/>')
        story.append(Paragraph(body_text, styles_cjk.get('BodyText_CJK', styles['BodyText'])))
        
        story.append(Spacer(1, 0.4*inch))
        
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

@app.route('/download_markdown')
def download_markdown():
    global parsed_emails
    sort_order_param = request.args.get('sort_order', 'newest_first')

    emails_for_markdown = []
    for email_item in parsed_emails:
        item_copy = email_item.copy()
        raw_date = item_copy.get('date')
        if hasattr(raw_date, 'isoformat'):
            item_copy['sortable_date'] = raw_date.isoformat()
            item_copy['date_str'] = raw_date.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(raw_date, str) and raw_date:
            try:
                dt_obj = parsedate_to_datetime(raw_date)
                item_copy['sortable_date'] = dt_obj.isoformat()
                item_copy['date_str'] = dt_obj.strftime('%Y-%m-%d %H:%M:%S')
            except Exception:
                item_copy['sortable_date'] = raw_date
                item_copy['date_str'] = raw_date
        else:
            item_copy['sortable_date'] = ''
            item_copy['date_str'] = 'N/A'
        emails_for_markdown.append(item_copy)

    reverse_order = True if sort_order_param == 'newest_first' else False
    try:
        sorted_emails = sorted(
            emails_for_markdown,
            key=lambda x: x.get('sortable_date', '') if x.get('sortable_date') is not None else '',
            reverse=reverse_order
        )
    except Exception as e:
        print(f"Error sorting emails for Markdown: {e}")
        sorted_emails = emails_for_markdown # Fallback to unsorted

    markdown_lines = ["# Email Timeline", ""]
    for email in sorted_emails:
        from_val = email.get('from', 'N/A')
        subject_val = email.get('subject', 'N/A')
        date_str_val = email.get('date_str', 'N/A')
        
        summary_line = f"<summary>Date: {date_str_val} | From: {from_val} | Subject: {subject_val}</summary>"
        markdown_lines.append(f"<details>")
        markdown_lines.append(summary_line)
        markdown_lines.append("") 

        to_val = email.get('to')
        if to_val:
            markdown_lines.append(f"**To:** {to_val}")
        cc_val = email.get('cc')
        if cc_val:
            markdown_lines.append(f"**Cc:** {cc_val}")
        
        markdown_lines.append(f"**Relevant Parties:** {email.get('relevant_parties', 'N/A')}")
        markdown_lines.append(f"**Summary (Edited):** {email.get('summary', 'N/A')}")
        markdown_lines.append("") 
        markdown_lines.append("---") 
        markdown_lines.append("**Full Email Body:**")
        markdown_lines.append("```text")
        markdown_lines.append(email.get('body', 'N/A'))
        markdown_lines.append("```")
        markdown_lines.append("---")
        markdown_lines.append(f"</details>")
        markdown_lines.append("") 

    markdown_content = "\n".join(markdown_lines)
    
    response = Response(markdown_content, mimetype='text/markdown; charset=utf-8')
    response.headers['Content-Disposition'] = 'attachment; filename=email_timeline.md'
    return response

if __name__ == '__main__':
    app.run(debug=True)
