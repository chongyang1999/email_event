document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');

    async function fetchAndDisplayEmails() {
        if (!timelineContainer) {
            console.error('Timeline container not found!');
            return;
        }
        timelineContainer.innerHTML = '<p>Loading emails...</p>'; // Initial message

        try {
            const response = await fetch('/timeline_data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const emails = await response.json();

            timelineContainer.innerHTML = ''; // Clear loading message

            if (emails.length === 0) {
                timelineContainer.innerHTML = '<p>No emails to display. Upload an email file first.</p>';
                return;
            }

            emails.forEach(email => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'email-entry';

                const dateH = document.createElement('h3');
                try {
                    // Attempt to format the date, provide fallback for invalid dates
                    dateH.textContent = email.date ? new Date(email.date).toLocaleString() : 'Date N/A';
                } catch (e) {
                    dateH.textContent = email.date || 'Date N/A (invalid format)'; // Show raw date if parsing fails
                }
                entryDiv.appendChild(dateH);

                const fromP = document.createElement('p');
                fromP.innerHTML = `<strong>From:</strong> ${email.from || 'N/A'}`;
                entryDiv.appendChild(fromP);

                const toP = document.createElement('p');
                toP.innerHTML = `<strong>To:</strong> ${email.to || 'N/A'}`;
                entryDiv.appendChild(toP);
                
                const ccP = document.createElement('p');
                ccP.innerHTML = `<strong>Cc:</strong> ${email.cc || 'N/A'}`;
                entryDiv.appendChild(ccP);

                const subjectP = document.createElement('p');
                subjectP.innerHTML = `<strong>Subject:</strong> ${email.subject || 'N/A'}`;
                entryDiv.appendChild(subjectP);

                // Editable Summary
                const summaryP = document.createElement('p');
                summaryP.innerHTML = `<strong>Summary:</strong> `;
                const summarySpan = document.createElement('span');
                summarySpan.id = `summary-${email.id}`;
                summarySpan.className = 'editable-summary';
                summarySpan.contentEditable = true;
                summarySpan.textContent = email.summary || 'N/A';
                summaryP.appendChild(summarySpan);
                entryDiv.appendChild(summaryP);

                // Editable Relevant Parties
                const relevantPartiesP = document.createElement('p');
                relevantPartiesP.innerHTML = `<strong>Relevant Parties:</strong> `;
                const relevantPartiesSpan = document.createElement('span');
                relevantPartiesSpan.id = `relevant-parties-${email.id}`; // ID on the span
                relevantPartiesSpan.className = 'editable-parties';
                relevantPartiesSpan.contentEditable = true;
                relevantPartiesSpan.textContent = email.relevant_parties || 'None specified';
                relevantPartiesP.appendChild(relevantPartiesSpan);
                entryDiv.appendChild(relevantPartiesP);

                // Save Button
                const saveButton = document.createElement('button');
                saveButton.id = `save-btn-${email.id}`;
                saveButton.textContent = 'Save Changes';
                saveButton.style.marginTop = '5px'; // Basic styling
                saveButton.addEventListener('click', () => {
                    const currentEmailId = email.id; // 'email.id' is in scope from the loop

                    const updatedSummaryElement = document.getElementById(`summary-${currentEmailId}`);
                    const updatedPartiesElement = document.getElementById(`relevant-parties-${currentEmailId}`);

                    if (!updatedSummaryElement || !updatedPartiesElement) {
                        console.error('Editable elements not found for email ID:', currentEmailId);
                        alert('Error: Could not find fields to save.');
                        return;
                    }

                    const updatedSummary = updatedSummaryElement.textContent;
                    const updatedParties = updatedPartiesElement.textContent;

                    fetch(`/update_email/${currentEmailId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            summary: updatedSummary,
                            relevant_parties: updatedParties,
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Save response:', data);
                        if (data.status === 'success') {
                            alert('Changes saved successfully!');
                        } else {
                            alert('Error saving changes: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error saving changes:', error);
                        alert('Error saving changes. See console for details.');
                    });
                });
                entryDiv.appendChild(saveButton);

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'email-body';
                bodyDiv.style.display = 'none'; // Initially hidden
                
                const preformattedBody = document.createElement('pre');
                preformattedBody.textContent = email.body || 'No body content.';
                bodyDiv.appendChild(preformattedBody);
                entryDiv.appendChild(bodyDiv);

                entryDiv.addEventListener('click', (event) => {
                    // Prevent click on links inside body from toggling
                    if (event.target.tagName === 'A' && bodyDiv.contains(event.target)) {
                        return;
                    }
                    bodyDiv.style.display = bodyDiv.style.display === 'none' ? 'block' : 'none';
                });

                timelineContainer.appendChild(entryDiv);
            });

        } catch (error) {
            console.error('Error fetching or displaying emails:', error);
            if (timelineContainer) { // Check again in case it became null
                timelineContainer.innerHTML = `<p>Error loading emails: ${error.message}. Please try again later.</p>`;
            }
        }
    }

    fetchAndDisplayEmails();

    const downloadPdfButton = document.getElementById('download-pdf-btn');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', () => {
            console.log('Requesting PDF download...');
            window.location.href = '/download_pdf'; // Navigate to the PDF download route
        });
    }
});
