document.addEventListener('DOMContentLoaded', async () => {
    const runBtn = document.getElementById('runQueryBtn');
    const resultOutput = document.getElementById('resultOutput');
    const statusIndicator = document.getElementById('statusIndicator');
    const collectionSelect = document.getElementById('collectionName');
    const dbNameInput = document.getElementById('dbName');

    // Initialize Ace Editor
    const editor = ace.edit("queryEditor");
    editor.setTheme("ace/theme/tomorrow_night_eighties");
    editor.session.setMode("ace/mode/json");
    editor.setOptions({
        fontSize: "14px",
        showPrintMargin: false,
        showGutter: true,
        highlightActiveLine: false,
        wrap: true,
        useWorker: false
    });
    editor.setValue('{\n  \n}', -1);

    // Fetch collections for the fixed database
    try {
        const res = await fetch(`http://localhost:8000/api/mongodb/collections/${encodeURIComponent(dbNameInput.value)}`);
        if (res.ok) {
            const data = await res.json();
            collectionSelect.innerHTML = '';
            if (data.collections && data.collections.length > 0) {
                data.collections.forEach(col => {
                    const opt = document.createElement('option');
                    opt.value = col;
                    opt.textContent = col;
                    collectionSelect.appendChild(opt);
                });
            } else {
                collectionSelect.innerHTML = '<option value="" disabled selected>No collections found</option>';
            }
        } else {
            collectionSelect.innerHTML = '<option value="" disabled selected>Failed to load collections</option>';
        }
    } catch (err) {
        console.error("Error fetching collections:", err);
        collectionSelect.innerHTML = '<option value="" disabled selected>Error connecting to API</option>';
    }

    runBtn.addEventListener('click', async () => {
        const dbName = document.getElementById('dbName').value.trim();
        const collectionName = document.getElementById('collectionName').value.trim();
        const queryType = document.getElementById('queryType').value;
        const queryEditor = editor.getValue().trim();

        if (!dbName || !collectionName) {
            updateStatus('error', 'Database and Collection names are required');
            return;
        }

        let parsedQuery = {};
        if (queryEditor) {
            try {
                parsedQuery = JSON.parse(queryEditor);
            } catch (e) {
                updateStatus('error', 'Invalid JSON syntax in Query Body');
                return;
            }
        }

        updateStatus('loading', 'Executing...');
        runBtn.disabled = true;
        
        const payload = {
            database: dbName,
            collection: collectionName,
            type: queryType,
            query: parsedQuery
        };

        try {
            // Call FastAPI Backend
            const response = await fetch('http://localhost:8000/api/mongodb/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            let mockResponse;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server Error: ${response.status}`);
            }
            mockResponse = await response.json();

            displayResult(mockResponse);
            updateStatus('success', 'Success');

        } catch (error) {
            console.error('Error executing query:', error);
            updateStatus('error', 'Execution Failed');
            displayResult({ error: error.message });
        } finally {
            runBtn.disabled = false;
        }
    });

    function updateStatus(state, message) {
        statusIndicator.textContent = message;
        statusIndicator.className = 'status-indicator';
        statusIndicator.classList.add(state);
    }

    function displayResult(data) {
        let jsonStr = typeof data !== 'string' ? JSON.stringify(data, null, 2) : data;
        jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlighted = jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                    // Separate the quotes from the colon and spacing
                    const keyMatch = match.match(/^"(\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"/)[0];
                    const colonPart = match.substring(keyMatch.length);
                    return '<span class="' + cls + '">' + keyMatch + '</span>' + colonPart;
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
        resultOutput.innerHTML = highlighted;
    }
});
