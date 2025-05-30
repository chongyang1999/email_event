document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let currentSortOrder = 'newest_first'; // Global state for sort order

    async function fetchAndDisplayEmails() {
        if (!timelineContainer) {
            console.error('Timeline container not found!');
            return;
        }
        timelineContainer.innerHTML = '<p>Loading emails...</p>'; // Initial message

        try {
            // Use currentSortOrder (defined in the same DOMContentLoaded scope)
            const response = await fetch(`/timeline_data?sort_order=${currentSortOrder}`);
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

                // --- Create Header ---
                const headerDiv = document.createElement('div');
                headerDiv.className = 'email-header';

                const dotSpan = document.createElement('span');
                dotSpan.className = 'email-dot';
                headerDiv.appendChild(dotSpan);

                const dateSpan = document.createElement('span');
                dateSpan.className = 'email-date';
                try {
                    dateSpan.textContent = email.date ? new Date(email.date).toLocaleString() : 'Date N/A';
                } catch (e) {
                    dateSpan.textContent = email.date || 'Date N/A (invalid format)';
                }
                headerDiv.appendChild(dateSpan);

                const summaryPreviewSpan = document.createElement('span');
                summaryPreviewSpan.className = 'email-summary-preview';
                summaryPreviewSpan.textContent = email.summary || 'N/A';
                headerDiv.appendChild(summaryPreviewSpan);
                
                entryDiv.appendChild(headerDiv);

                // --- Create Details (collapsible) ---
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'email-details';
                detailsDiv.style.display = 'none'; // Initially hidden

                // Move existing content generation logic here:
                const fromP = document.createElement('p');
                fromP.innerHTML = `<strong>From:</strong> ${email.from || 'N/A'}`;
                detailsDiv.appendChild(fromP);

                const toP = document.createElement('p');
                toP.innerHTML = `<strong>To:</strong> ${email.to || 'N/A'}`;
                detailsDiv.appendChild(toP);
                
                const ccP = document.createElement('p');
                ccP.innerHTML = `<strong>Cc:</strong> ${email.cc || 'N/A'}`;
                detailsDiv.appendChild(ccP);

                const subjectP = document.createElement('p');
                subjectP.innerHTML = `<strong>Subject:</strong> ${email.subject || 'N/A'}`;
                detailsDiv.appendChild(subjectP);

                // Editable Summary (label + span) - for editing, distinct from preview
                const summaryEditableP = document.createElement('p');
                summaryEditableP.innerHTML = `<strong>Summary (edit):</strong> `; // Changed label slightly for clarity
                const summaryEditableSpan = document.createElement('span');
                summaryEditableSpan.id = `summary-${email.id}`;
                summaryEditableSpan.className = 'editable-summary';
                summaryEditableSpan.contentEditable = true;
                summaryEditableSpan.textContent = email.summary || 'N/A';
                summaryEditableP.appendChild(summaryEditableSpan);
                detailsDiv.appendChild(summaryEditableP);

                // Editable Relevant Parties (label + span)
                const relevantPartiesP = document.createElement('p');
                relevantPartiesP.innerHTML = `<strong>Relevant Parties:</strong> `;
                const relevantPartiesSpan = document.createElement('span');
                relevantPartiesSpan.id = `relevant-parties-${email.id}`;
                relevantPartiesSpan.className = 'editable-parties';
                relevantPartiesSpan.contentEditable = true;
                relevantPartiesSpan.textContent = email.relevant_parties || 'None specified';
                relevantPartiesP.appendChild(relevantPartiesSpan);
                detailsDiv.appendChild(relevantPartiesP);

                // Save Button
                const saveButton = document.createElement('button');
                saveButton.id = `save-btn-${email.id}`;
                saveButton.textContent = 'Save Changes';
                saveButton.style.marginTop = '5px';
                saveButton.addEventListener('click', () => {
                    const currentEmailId = email.id;
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
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ summary: updatedSummary, relevant_parties: updatedParties }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            alert('Changes saved successfully!');
                            // Update the summary preview in the header if save is successful
                            if(summaryPreviewSpan) summaryPreviewSpan.textContent = updatedSummary;
                        } else {
                            alert('Error saving changes: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error saving changes:', error);
                        alert('Error saving changes. See console for details.');
                    });
                });
                detailsDiv.appendChild(saveButton);

                // Delete Button
                const deleteButton = document.createElement('button');
                deleteButton.id = `delete-btn-${email.id}`;
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '5px';
                deleteButton.style.marginTop = '5px';
                deleteButton.addEventListener('click', () => {
                    const currentEmailId = email.id;
                    if (confirm('Are you sure you want to delete this email?')) {
                        fetch(`/delete_email/${currentEmailId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        })
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(errData => {
                                    throw new Error(errData.message || `Server error: ${response.status}`);
                                }).catch(() => { throw new Error(`Server error: ${response.status}`); });
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.status === 'success') {
                                alert('Email deleted successfully!');
                                fetchAndDisplayEmails(); // Refresh timeline
                            } else {
                                alert('Error deleting email: ' + (data.message || 'Unknown error'));
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting email:', error);
                            alert('Failed to delete email: ' + error.message);
                        });
                    }
                });
                detailsDiv.appendChild(deleteButton);

                // Full Email Body
                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'email-body'; // This was the previous container for <pre>
                const preformattedBody = document.createElement('pre');
                preformattedBody.textContent = email.body || 'No body content.';
                bodyDiv.appendChild(preformattedBody);
                detailsDiv.appendChild(bodyDiv); // Append the full body to detailsDiv

                // The old click listener on entryDiv that toggled the body directly should be removed
                // as the header will handle this in the next step.

                // Add click listener to headerDiv to toggle detailsDiv
                headerDiv.addEventListener('click', () => {
                    // detailsDiv is in scope here from the forEach loop
                    if (detailsDiv.style.display === 'none' || detailsDiv.style.display === '') {
                        detailsDiv.style.display = 'block';
                    } else {
                        detailsDiv.style.display = 'none';
                    }
                });

                entryDiv.appendChild(detailsDiv);
                timelineContainer.appendChild(entryDiv);
            });

        } catch (error) {
            console.error('Error fetching or displaying emails:', error);
            if (timelineContainer) {
                timelineContainer.innerHTML = `<p>Error loading emails: ${error.message}. Please try again later.</p>`;
            }
        }
    }

    fetchAndDisplayEmails();

    const downloadPdfButton = document.getElementById('download-pdf-btn');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', () => {
            // currentSortOrder is defined in the same DOMContentLoaded scope
            console.log('Requesting PDF download with sort order:', currentSortOrder);
            window.location.href = `/download_pdf?sort_order=${currentSortOrder}`; 
        });
    }

    const toggleSortButton = document.getElementById('toggle-sort-btn');
    if (toggleSortButton) {
        toggleSortButton.addEventListener('click', function() { // Use 'function' to get 'this' as button
            if (currentSortOrder === 'newest_first') {
                currentSortOrder = 'oldest_first';
                this.textContent = 'Sort: Oldest First';
            } else {
                currentSortOrder = 'newest_first';
                this.textContent = 'Sort: Newest First';
            }
            console.log("Current sort order:", currentSortOrder); // For debugging
            fetchAndDisplayEmails(); // Will be updated later to pass sort order
        });
    }
});
