document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let currentSortOrder = 'newest_first'; // Global state for sort order

    async function fetchAndDisplayEmails() {
        const timelineContainer = document.getElementById('timeline-container');
        if (!timelineContainer) {
            console.error('Timeline container not found!');
            return;
        }
        timelineContainer.innerHTML = '<p>Loading emails...</p>'; // Set initial message

        let emailsToDisplay = [];
        let operationStatus = 'success'; // To track if any error occurred before rendering

        try {
            if (window.EMBEDDED_EMAILS) {
                console.log("Using embedded email data.");
                emailsToDisplay = [...window.EMBEDDED_EMAILS]; 

                const sortKey = 'date'; 
                emailsToDisplay.sort((a, b) => {
                    const valA = a[sortKey] || '';
                    const valB = b[sortKey] || '';
                    if (valA === '' && valB === '') return 0;
                    if (valA === '') return 1;
                    if (valB === '') return -1;
                    if (currentSortOrder === 'oldest_first') {
                        return valA.localeCompare(valB);
                    } else {
                        return valB.localeCompare(valA);
                    }
                });
                
                const toggleSortBtn = document.getElementById('toggle-sort-btn');
                if (toggleSortBtn) {
                    toggleSortBtn.textContent = currentSortOrder === 'newest_first' ? 'Sort: Newest First' : 'Sort: Oldest First';
                }

                timelineContainer.innerHTML = ''; 
                if (emailsToDisplay.length === 0) {
                    timelineContainer.innerHTML = '<p>No emails in this export.</p>';
                    return; 
                }
            } else {
                console.log("Fetching email data from server with sort order:", currentSortOrder);
                try {
                    const response = await fetch(`/timeline_data?sort_order=${currentSortOrder}`);
                    if (!response.ok) {
                        let errorMsgFromServer = `HTTP error! status: ${response.status}`;
                        try {
                            const errData = await response.json();
                            errorMsgFromServer = errData.message || errorMsgFromServer;
                        } catch (jsonError) { /* Ignore */ }
                        throw new Error(errorMsgFromServer);
                    }
                    const data = await response.json();
                    
                    timelineContainer.innerHTML = ''; 
                    
                    if (!data || data.length === 0) {
                        timelineContainer.innerHTML = '<p>No emails to display. Upload an email file first.</p>';
                        return; 
                    }
                    emailsToDisplay = data; 
                } catch (error) {
                    console.error('Error fetching live email data:', error);
                    timelineContainer.innerHTML = `<p>Error loading emails: ${error.message}. Please check server connection or try again.</p>`;
                    operationStatus = 'error'; 
                    return; 
                }
            }

            if (emailsToDisplay.length === 0 && operationStatus === 'success') {
                timelineContainer.innerHTML = '<p>No email content to display.</p>';
                return;
            }
            
            // Common rendering logic
            emailsToDisplay.forEach(email => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'email-entry';

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

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'email-details';
                detailsDiv.style.display = 'none';

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

                const summaryEditableP = document.createElement('p');
                summaryEditableP.innerHTML = `<strong>Summary (edit):</strong> `;
                const summaryEditableSpan = document.createElement('span');
                summaryEditableSpan.id = `summary-${email.id}`;
                summaryEditableSpan.className = 'editable-summary';
                summaryEditableSpan.contentEditable = true;
                summaryEditableSpan.textContent = email.summary || 'N/A';
                summaryEditableP.appendChild(summaryEditableSpan);
                detailsDiv.appendChild(summaryEditableP);

                const relevantPartiesP = document.createElement('p');
                relevantPartiesP.innerHTML = `<strong>Relevant Parties:</strong> `;
                const relevantPartiesSpan = document.createElement('span');
                relevantPartiesSpan.id = `relevant-parties-${email.id}`;
                relevantPartiesSpan.className = 'editable-parties';
                relevantPartiesSpan.contentEditable = true;
                relevantPartiesSpan.textContent = email.relevant_parties || 'None specified';
                relevantPartiesP.appendChild(relevantPartiesSpan);
                detailsDiv.appendChild(relevantPartiesP);

                const saveButton = document.createElement('button');
                saveButton.id = `save-btn-${email.id}`;
                saveButton.textContent = 'Save Changes';
                saveButton.style.marginTop = '5px';
                saveButton.addEventListener('click', () => {
                    const currentEmailId = email.id;
                    const updatedSummaryElement = document.getElementById(`summary-${currentEmailId}`);
                    const updatedPartiesElement = document.getElementById(`relevant-parties-${currentEmailId}`);
                    if (!updatedSummaryElement || !updatedPartiesElement) {
                        alert('Error: Could not find fields to save.'); return;
                    }
                    const updatedSummary = updatedSummaryElement.textContent;
                    const updatedParties = updatedPartiesElement.textContent;

                    if (window.EMBEDDED_EMAILS) {
                        const emailToUpdate = window.EMBEDDED_EMAILS.find(e => e.id === currentEmailId);
                        if (emailToUpdate) {
                            emailToUpdate.summary = updatedSummary;
                            emailToUpdate.relevant_parties = updatedParties;
                            if(summaryPreviewSpan) summaryPreviewSpan.textContent = updatedSummary;
                            alert('Changes saved in this exported file. Note: These changes are not persisted to any server and will be lost if you reload the file from its original source.');
                        } else { alert('Error: Could not find email to update in embedded data.'); }
                    } else {
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
                            } else { alert('Error saving changes: ' + data.message); }
                        })
                        .catch(error => { console.error('Error saving changes:', error); alert('Error saving changes. See console for details.'); });
                    }
                });
                detailsDiv.appendChild(saveButton);

                const deleteButton = document.createElement('button');
                deleteButton.id = `delete-btn-${email.id}`;
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '5px';
                deleteButton.style.marginTop = '5px';
                deleteButton.addEventListener('click', () => {
                    const currentEmailId = email.id;
                    if (confirm('Are you sure you want to delete this email?')) {
                        if (window.EMBEDDED_EMAILS) {
                            window.EMBEDDED_EMAILS = window.EMBEDDED_EMAILS.filter(e => e.id !== currentEmailId);
                            fetchAndDisplayEmails(); 
                            alert('Email deleted from this exported file. Note: This change is not persisted to any server.');
                        } else {
                            fetch(`/delete_email/${currentEmailId}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                            })
                            .then(response => {
                                if (!response.ok) {
                                    return response.json().then(errData => { throw new Error(errData.message || `Server error: ${response.status}`);
                                    }).catch(() => { throw new Error(`Server error: ${response.status}`); });
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data.status === 'success') {
                                    alert('Email deleted successfully!');
                                    fetchAndDisplayEmails();
                                } else { alert('Error deleting email: ' + (data.message || 'Unknown error')); }
                            })
                            .catch(error => { console.error('Error deleting email:', error); alert('Failed to delete email: ' + error.message); });
                        }
                    }
                });
                detailsDiv.appendChild(deleteButton);

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'email-body';
                const preformattedBody = document.createElement('pre');
                preformattedBody.textContent = email.body || 'No body content.';
                bodyDiv.appendChild(preformattedBody);
                detailsDiv.appendChild(bodyDiv);

                headerDiv.addEventListener('click', () => {
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
            console.error('A critical error occurred in fetchAndDisplayEmails:', error);
            if (operationStatus === 'success') { 
                timelineContainer.innerHTML = `<p>An unexpected error occurred while displaying emails: ${error.message}.</p>`;
            }
        }
    }
    
    if (window.EMBEDDED_EMAILS) {
        const pdfBtn = document.getElementById('download-pdf-btn');
        if (pdfBtn) pdfBtn.style.display = 'none';
        
        const htmlBtn = document.getElementById('download-html-btn');
        if (htmlBtn) htmlBtn.style.display = 'none';
        
        const toggleSortBtn = document.getElementById('toggle-sort-btn'); // Get reference to sort button
        if (toggleSortBtn) toggleSortBtn.style.display = 'none'; // Hide it
        
        const mainTitle = document.querySelector('h1'); 
        if (mainTitle) mainTitle.textContent = 'Email Timeline (Exported View)';

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
        toggleSortButton.addEventListener('click', function() { 
            if (currentSortOrder === 'newest_first') {
                currentSortOrder = 'oldest_first';
            } else {
                currentSortOrder = 'newest_first';
            }
            // Button text will be updated by fetchAndDisplayEmails in embedded mode
            // For live mode, this.textContent might be preferable here if not done in fetchAndDisplayEmails
            if (!window.EMBEDDED_EMAILS) {
                 this.textContent = currentSortOrder === 'newest_first' ? 'Sort: Newest First' : 'Sort: Oldest First';
            }
            console.log("Current sort order:", currentSortOrder); 
            fetchAndDisplayEmails(); 
        });
    }

    const downloadHtmlButton = document.getElementById('download-html-btn');
    if (downloadHtmlButton) {
        downloadHtmlButton.addEventListener('click', () => {
            console.log('Requesting HTML download with sort order:', currentSortOrder); 
            window.location.href = `/download_html?sort_order=${currentSortOrder}`;
        });
    }
});
