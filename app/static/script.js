document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let currentSortOrder = 'newest_first'; // Global state for sort order

    async function fetchAndDisplayEmails() {
        if (!timelineContainer) {
            console.error('Timeline container not found!');
            return;
        }
        timelineContainer.innerHTML = '<p>Loading emails...</p>'; // Initial message

        let emailsToDisplay = [];

        if (window.EMBEDDED_EMAILS) {
            // --- Embedded Mode ---
            console.log("Using embedded email data.");
            emailsToDisplay = [...window.EMBEDDED_EMAILS]; // Create a mutable copy

            // Client-side sort for embedded data
            // 'date' field in EMBEDDED_EMAILS is expected to be ISO string from backend processing
            const sortKey = 'date'; 
            emailsToDisplay.sort((a, b) => {
                const valA = a[sortKey] || '';
                const valB = b[sortKey] || '';
                // Ensure consistent comparison, especially if dates can be empty strings
                if (valA === '' && valB === '') return 0;
                if (valA === '') return 1; // Empty strings sort last
                if (valB === '') return -1;

                if (currentSortOrder === 'oldest_first') {
                    return valA.localeCompare(valB);
                } else { // newest_first
                    return valB.localeCompare(valA);
                }
            });
            
            // Update sort button text to reflect the current client-side sort order
            const toggleSortBtn = document.getElementById('toggle-sort-btn');
            if (toggleSortBtn) {
                toggleSortBtn.textContent = currentSortOrder === 'newest_first' ? 'Sort: Newest First' : 'Sort: Oldest First';
            }


            timelineContainer.innerHTML = ''; // Clear loading message
            if (emailsToDisplay.length === 0) {
                timelineContainer.innerHTML = '<p>No emails in this export.</p>';
                return; // Exit if no emails to display
            }
            // UI adjustments for embedded mode will be done once after this function
            // or can be triggered here.
        } else {
            // --- Live Mode ---
            console.log("Fetching email data from server.");
            try {
                const response = await fetch(`/timeline_data?sort_order=${currentSortOrder}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                emailsToDisplay = await response.json();
                timelineContainer.innerHTML = ''; // Clear loading message

                if (emailsToDisplay.length === 0) {
                    timelineContainer.innerHTML = '<p>No emails to display. Upload an email file first.</p>';
                    return; // Exit if no emails from server
                }
            } catch (error) {
                console.error('Error fetching or displaying emails:', error);
                if (timelineContainer) {
                    timelineContainer.innerHTML = `<p>Error loading emails: ${error.message}. Please try again later.</p>`;
                }
                return; // Exit on fetch error
            }
        }

        // Common rendering logic for both modes
        emailsToDisplay.forEach(email => {
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

                    if (window.EMBEDDED_EMAILS) {
                        // --- Embedded Mode Save ---
                        const emailToUpdate = window.EMBEDDED_EMAILS.find(e => e.id === currentEmailId);
                        if (emailToUpdate) {
                            emailToUpdate.summary = updatedSummary;
                            emailToUpdate.relevant_parties = updatedParties;
                            
                            // Update the UI directly
                            if(summaryPreviewSpan) summaryPreviewSpan.textContent = updatedSummary;
                            // updatedSummaryElement.textContent = updatedSummary; // Already done by contentEditable
                            // updatedPartiesElement.textContent = updatedParties; // Already done by contentEditable
                            alert('Changes saved in this exported file. Note: These changes are not persisted to any server and will be lost if you reload the file from its original source.');
                        } else {
                            alert('Error: Could not find email to update in embedded data.');
                        }
                    } else {
                        // --- Live Mode Save ---
                        fetch(`/update_email/${currentEmailId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ summary: updatedSummary, relevant_parties: updatedParties }),
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                alert('Changes saved successfully!');
                                if(summaryPreviewSpan) summaryPreviewSpan.textContent = updatedSummary;
                            } else {
                                alert('Error saving changes: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error saving changes:', error);
                            alert('Error saving changes. See console for details.');
                        });
                    }
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
                        if (window.EMBEDDED_EMAILS) {
                            // --- Embedded Mode Delete ---
                            window.EMBEDDED_EMAILS = window.EMBEDDED_EMAILS.filter(e => e.id !== currentEmailId);
                            fetchAndDisplayEmails(); // Re-render from the modified embedded list
                            alert('Email deleted from this exported file. Note: This change is not persisted to any server.');
                        } else {
                            // --- Live Mode Delete ---
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

    
    // Initial setup based on mode
    if (window.EMBEDDED_EMAILS) {
        const pdfBtn = document.getElementById('download-pdf-btn');
        if (pdfBtn) pdfBtn.style.display = 'none';
        const htmlBtn = document.getElementById('download-html-btn');
        if (htmlBtn) htmlBtn.style.display = 'none';
        
        const mainTitle = document.querySelector('h1'); // Assuming there's only one H1 for the main title
        if (mainTitle) mainTitle.textContent = 'Email Timeline (Exported View)';

        // Set currentSortOrder based on embedded value for initial load in embedded mode
        if (window.EMBEDDED_SORT_ORDER) {
            currentSortOrder = window.EMBEDDED_SORT_ORDER;
        }
    }
    
    fetchAndDisplayEmails(); // Initial call

    const downloadPdfButton = document.getElementById('download-pdf-btn');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', () => {
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

    const downloadHtmlButton = document.getElementById('download-html-btn');
    if (downloadHtmlButton) {
        downloadHtmlButton.addEventListener('click', () => {
            // currentSortOrder should be the variable holding the current sort state
            console.log('Requesting HTML download with sort order:', currentSortOrder); 
            window.location.href = `/download_html?sort_order=${currentSortOrder}`;
        });
    }
});
