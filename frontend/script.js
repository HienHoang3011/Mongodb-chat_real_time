document.addEventListener('DOMContentLoaded', async () => {
    // ========== Setup ==========
    const dbName = 'ChatRealtimeDB';
    const resultOutput = document.getElementById('resultOutput');
    const statusIndicator = document.getElementById('statusIndicator');
    const collectionSelect = document.getElementById('collectionName');

    // Buttons
    const runQueryBtn = document.getElementById('runQueryBtn');

    // ========== Initialize Ace Editors ==========
    const editor = ace.edit("queryEditor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/json");
    editor.setOptions({
        fontSize: "13px",
        showPrintMargin: false,
        showGutter: true,
        highlightActiveLine: true,
        wrap: true,
        tabSize: 2,
        useSoftTabs: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableEmmet: true,
        behavioursEnabled: true
    });
    editor.setValue('{\n  \n}', -1);

    // ========== Mode Switching ==========

    // ========== Load Collections ==========
    async function loadCollections() {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/mongodb/collections/${encodeURIComponent(dbName)}`);
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
                    collectionSelect.innerHTML = '<option value="" disabled selected>No collections</option>';
                }
            } else {
                collectionSelect.innerHTML = '<option value="" disabled selected>Failed to load</option>';
            }
        } catch (err) {
            console.error("Error fetching collections:", err);
            collectionSelect.innerHTML = '<option value="" disabled selected>Connection error</option>';
        }
    }

    await loadCollections();

    // ========== Update Status ==========
    function updateStatus(state, message) {
        statusIndicator.textContent = message;
        statusIndicator.className = 'status-indicator';
        statusIndicator.classList.add(state);
    }

    // ========== Display Result ==========
    function displayResult(data) {
        let jsonStr = typeof data !== 'string' ? JSON.stringify(data, null, 2) : data;
        jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const highlighted = jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
        
        resultOutput.innerHTML = highlighted;
    }

    // ========== UI Mode: Execute Query ==========
    runQueryBtn.addEventListener('click', async () => {
        const collectionName = collectionSelect.value.trim();
        const queryType = document.getElementById('queryType').value;
        const queryBody = editor.getValue().trim();

        if (!collectionName) {
            updateStatus('error', 'Collection required');
            return;
        }

        let parsedQuery = {};
        if (queryBody) {
            try {
                parsedQuery = JSON.parse(queryBody);
            } catch (e) {
                updateStatus('error', `Invalid JSON: ${e.message}`);
                return;
            }
        }

        updateStatus('loading', 'Executing...');
        runQueryBtn.disabled = true;

        const payload = {
            database: dbName,
            collection: collectionName,
            type: queryType,
            query: parsedQuery
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/mongodb/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error: ${response.status}`);
            }

            const result = await response.json();
            displayResult(result);
            updateStatus('success', 'Success');
        } catch (error) {
            console.error('Error:', error);
            updateStatus('error', error.message);
            displayResult({ error: error.message });
        } finally {
            runQueryBtn.disabled = false;
        }
    });

    // Allow Ctrl+Enter to execute
    editor.commands.addCommand({
        name: 'executeQuery',
        bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
        exec: () => runQueryBtn.click()
    });
});

