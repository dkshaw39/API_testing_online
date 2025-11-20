// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
    currentTheme = theme;
    localStorage.setItem('theme', theme);
}

// Initialize theme
setTheme(currentTheme);

// Theme toggle event
document.getElementById('themeToggle').addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

// Tab switching functionality
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Show corresponding tab pane
        const tabName = tab.getAttribute('data-tab');
        document.getElementById(`${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    });
});

// Add parameter functionality
document.getElementById('addParam').addEventListener('click', () => {
    const paramsContainer = document.querySelector('.params-container');
    const paramRow = document.createElement('div');
    paramRow.className = 'param-row';
    paramRow.innerHTML = `
        <input type="text" class="param-key" placeholder="Key">
        <input type="text" class="param-value" placeholder="Value">
        <button class="remove-param"><i class="fas fa-times"></i></button>
    `;
    paramsContainer.appendChild(paramRow);
    
    // Add event to new remove button
    paramRow.querySelector('.remove-param').addEventListener('click', () => {
        paramsContainer.removeChild(paramRow);
    });
});

// Add header functionality
document.getElementById('addHeader').addEventListener('click', () => {
    const headersContainer = document.querySelector('.headers-container');
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    headerRow.innerHTML = `
        <input type="text" class="header-key" placeholder="Header">
        <input type="text" class="header-value" placeholder="Value">
        <button class="remove-header"><i class="fas fa-times"></i></button>
    `;
    headersContainer.appendChild(headerRow);
    
    // Add event to new remove button
    headerRow.querySelector('.remove-header').addEventListener('click', () => {
        headersContainer.removeChild(headerRow);
    });
});

// Remove parameter event delegation
document.querySelector('.params-container').addEventListener('click', (e) => {
    if (e.target.closest('.remove-param')) {
        const paramRow = e.target.closest('.param-row');
        if (document.querySelectorAll('.param-row').length > 1) {
            paramRow.remove();
        }
    }
});

// Remove header event delegation
document.querySelector('.headers-container').addEventListener('click', (e) => {
    if (e.target.closest('.remove-header')) {
        const headerRow = e.target.closest('.header-row');
        if (document.querySelectorAll('.header-row').length > 1) {
            headerRow.remove();
        }
    }
});

// Body type selection
document.querySelectorAll('input[name="bodyType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const bodyType = radio.value;
        const bodyContent = document.getElementById('bodyContent');
        const jsonEditor = document.getElementById('jsonEditor');
        
        // Hide all
        bodyContent.style.display = 'none';
        jsonEditor.style.display = 'none';
        
        if (bodyType === 'json') {
            jsonEditor.style.display = 'block';
        } else if (bodyType !== 'none') {
            bodyContent.style.display = 'block';
        }
    });
});

// Auth type selection
document.querySelectorAll('input[name="authType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const authType = radio.value;
        const authFields = document.getElementById('authFields');
        
        if (authType !== 'none') {
            authFields.style.display = 'block';
        } else {
            authFields.style.display = 'none';
        }
    });
});

// Format URL with parameters
function buildUrlWithParams(baseUrl, params) {
    if (!params || params.length === 0) return baseUrl;
    
    const url = new URL(baseUrl);
    params.forEach(param => {
        if (param.key && param.value) {
            url.searchParams.set(param.key, param.value);
        }
    });
    
    return url.toString();
}

// Get headers from UI
function getHeaders() {
    const headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        const keyInput = row.querySelector('.header-key');
        const valueInput = row.querySelector('.header-value');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key && value) {
            headers[key] = value;
        }
    });
    
    // Add auth header if needed
    const authType = document.querySelector('input[name="authType"]:checked').value;
    if (authType !== 'none') {
        const authValue = document.getElementById('authValue').value.trim();
        if (authValue) {
            switch(authType) {
                case 'bearer':
                    headers['Authorization'] = `Bearer ${authValue}`;
                    break;
                case 'api-key':
                    headers['X-API-Key'] = authValue; // Common header for API keys
                    break;
                case 'basic':
                    headers['Authorization'] = `Basic ${btoa(authValue)}`;
                    break;
            }
        }
    }
    
    return headers;
}

// Get request body
function getBody() {
    const bodyType = document.querySelector('input[name="bodyType"]:checked').value;
    
    if (bodyType === 'none') return null;
    if (bodyType === 'json') {
        return document.querySelector('#jsonEditor code').textContent;
    }
    if (bodyType === 'form') {
        const formData = new FormData();
        // For form data, we'd need to add fields
        // Simplified implementation
        return document.getElementById('bodyContent').value;
    }
    return document.getElementById('bodyContent').value;
}

// Format response size
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Send API request
document.getElementById('sendRequest').addEventListener('click', async () => {
    const method = document.getElementById('methodSelect').value;
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    // Get parameters
    const params = [];
    document.querySelectorAll('.param-row').forEach(row => {
        const keyInput = row.querySelector('.param-key');
        const valueInput = row.querySelector('.param-value');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key && value) {
            params.push({ key, value });
        }
    });
    
    // Build final URL with parameters
    const finalUrl = buildUrlWithParams(url, params);
    
    // Get headers
    const headers = getHeaders();
    
    // Get body
    const body = getBody();
    
    // Show loading state
    const sendBtn = document.getElementById('sendRequest');
    const originalBtnText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<span class="loading"></span> Sending...';
    sendBtn.disabled = true;
    
    // Record start time for response time calculation
    const startTime = Date.now();
    
    try {
        // Prepare fetch options
        const fetchOptions = {
            method: method,
            headers: headers,
        };
        
        // Add body if applicable
        if (body && method !== 'GET' && method !== 'HEAD') {
            if (document.querySelector('input[name="bodyType"]:checked').value === 'json') {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = body;
            } else {
                fetchOptions.body = body;
            }
        }
        
        // Make the request
        const response = await fetch(finalUrl, fetchOptions);
        const responseTime = Date.now() - startTime;
        const responseSize = new Blob([JSON.stringify(await response.clone().json())]).size;
        
        // Get response data
        let responseData;
        try {
            responseData = await response.json();
        } catch {
            responseData = await response.text();
        }
        
        // Update response UI
        document.getElementById('responseStatus').textContent = `Status: ${response.status}`;
        document.getElementById('responseTime').textContent = `Time: ${responseTime}ms`;
        document.getElementById('responseSize').textContent = `Size: ${formatBytes(responseSize)}`;
        
        // Add status class for color coding
        document.getElementById('responseStatus').className = `status-${Math.floor(response.status / 100) * 100}`;
        
        // Format and display response
        if (typeof responseData === 'object') {
            document.getElementById('responseBody').textContent = JSON.stringify(responseData, null, 2);
        } else {
            document.getElementById('responseBody').textContent = responseData;
        }
        
    } catch (error) {
        console.error('Request failed:', error);
        document.getElementById('responseStatus').textContent = 'Status: Error';
        document.getElementById('responseStatus').className = 'status-500';
        document.getElementById('responseTime').textContent = 'Time: -';
        document.getElementById('responseSize').textContent = 'Size: -';
        document.getElementById('responseBody').textContent = `Error: ${error.message}`;
    } finally {
        // Restore button state
        sendBtn.innerHTML = originalBtnText;
        sendBtn.disabled = false;
    }
});

// Add keyboard shortcut for sending request (Ctrl/Cmd + Enter)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('sendRequest').click();
    }
});

// Initialize with a sample request if using default URL
window.addEventListener('load', () => {
    if (document.getElementById('urlInput').value === 'https://jsonplaceholder.typicode.com/posts/1') {
        // Auto-send the sample request after a short delay to allow UI to load
        setTimeout(() => {
            document.getElementById('sendRequest').click();
        }, 1000);
    }
});

// Add animation for new elements
function animateElement(element) {
    element.style.animation = 'fadeIn 0.3s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 300);
}