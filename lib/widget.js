// Minimal widget for claude-frontend
class ClaudeFrontendWidget {
  constructor(options = {}) {
    this.serverPort = options.serverPort || 3002;
    this.position = options.position || 'bottom-right';
    this.serverAvailable = false;
    this.selectedElements = [];
    this.isSelecting = false;
    this.widget = null;
    this.isOpen = false;
    this.waitingForResponse = false;
    this.showSettings = false;
    
    // Load settings from localStorage
    this.settings = this.loadSettings();

    if (this.isDevelopment()) {
      this.init();
    }
  }
  
  loadSettings() {
    const saved = localStorage.getItem('claude-frontend-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      bypassPermissions: true,
      continueChat: true,
      subagent: ''  // Empty means use default
    };
  }
  
  saveSettings() {
    localStorage.setItem('claude-frontend-settings', JSON.stringify(this.settings));
  }

  isDevelopment() {
    return (
      process?.env?.NODE_ENV === 'development' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.create());
    } else {
      this.create();
    }
    this.connectToServer();
    // Don't start polling here - only when sending a request
  }

  connectToServer() {
    fetch(`http://localhost:${this.serverPort}/health`)
      .then(response => {
        if (response.ok) {
          console.log('[Claude Frontend] Server detected');
          this.serverAvailable = true;
        }
      })
      .catch(() => {
        console.log('[Claude Frontend] No server - will copy to clipboard');
        this.serverAvailable = false;
      });
  }

  startPollingForResponse() {
    let pollCount = 0;
    
    // Adaptive polling - faster at start, slower over time
    const poll = () => {
      if (!this.waitingForResponse) {
        return;
      }
      
      fetch(`http://localhost:${this.serverPort}/status`)
        .then(r => r.json())
        .then(data => {
          if (data.completed) {
            this.waitingForResponse = false;
            this.hideWorkingAnimation();
            this.showNotification('✓ Claude completed', 'success');
            // Re-enable element selection if widget is still open
            if (this.isOpen) {
              this.isSelecting = true;
            }
          } else {
            pollCount++;
            // Adaptive delay: 500ms for first 5 polls, then 1s, then 2s
            const delay = pollCount < 5 ? 500 : pollCount < 10 ? 1000 : 2000;
            setTimeout(poll, delay);
          }
        })
        .catch((error) => {
          // On error, retry with longer delay
          if (this.waitingForResponse) {
            setTimeout(poll, 3000);
          }
        });
    };
    
    // Start first poll quickly
    setTimeout(poll, 500);
  }

  create() {
    if (document.getElementById('claude-frontend-widget')) return;

    // Create widget first (minimal DOM)
    const container = document.createElement('div');
    container.id = 'claude-frontend-widget';
    container.className = `claude-widget-${this.position}`;
    container.innerHTML = this.getHTML();
    document.body.appendChild(container);

    this.widget = container;
    
    // Load styles async after widget is in DOM
    requestAnimationFrame(() => {
      const style = document.createElement('style');
      style.textContent = this.getStyles();
      document.head.appendChild(style);
    });
    
    this.attachEventListeners();
  }

  getStyles() {
    return `
      #claude-frontend-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      .claude-widget-bottom-right { bottom: 20px; right: 20px; }
      .claude-widget-bottom-left { bottom: 20px; left: 20px; }
      
      .claude-expanded-content {
        display: none;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      
      .claude-container.expanded .claude-expanded-content {
        display: flex;
      }
      
      .claude-working-content {
        display: none;
        align-items: center;
        justify-content: center;
        padding: 12px;
        min-height: 40px;
      }
      
      .claude-container.working .claude-expanded-content {
        display: none !important;
      }
      
      .claude-container.working .claude-working-content {
        display: flex !important;
      }
      
      .claude-selected-elements {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .claude-settings-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        border: none;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
      }
      
      .claude-container.expanded:not(.working) .claude-settings-btn {
        display: flex;
      }
      
      .claude-settings-btn:hover {
        background: rgba(255, 255, 255, 0.95);
        transform: rotate(90deg);
      }
      
      .claude-settings-btn svg {
        fill: #6b7280;
      }
      
      .claude-settings-btn.active {
        background: rgba(239, 68, 68, 0.1);
      }
      
      .claude-settings-btn.active svg {
        fill: #ef4444;
      }
      
      .claude-settings-panel {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid rgba(0,0,0,0.06);
      }
      
      .claude-setting {
        margin-bottom: 10px;
      }
      
      .claude-setting:last-child {
        margin-bottom: 0;
      }
      
      .claude-setting label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #4b5563;
      }
      
      .claude-setting input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #ef4444;
      }
      
      .claude-setting span {
        flex: 1;
        user-select: none;
      }
      
      .claude-element-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 14px;
        padding: 5px 10px 5px 12px;
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        transition: all 0.15s ease;
        animation: tagSlideIn 0.2s ease;
      }
      
      @keyframes tagSlideIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .claude-element-tag:hover {
        background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .claude-element-tag button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        border-radius: 50%;
        font-size: 14px;
        line-height: 1;
        transition: all 0.15s ease;
      }
      
      .claude-element-tag button:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        transform: rotate(90deg);
      }
      
      .claude-container {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: transparent;
        border-radius: 24px;
        padding: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 44px;
        overflow: hidden;
      }
      
      .claude-container.expanded {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%);
        backdrop-filter: blur(20px);
        max-width: 420px;
        padding: 14px;
        box-shadow: 
          0 10px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04),
          0 0 0 1px rgba(0, 0, 0, 0.05);
      }
      
      .claude-toggle {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
        position: relative;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      
      .claude-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
      
      .claude-toggle:active {
        transform: scale(0.98);
      }
      
      .claude-toggle svg {
        width: 22px;
        height: 22px;
        fill: white;
      }
      
      .claude-container.expanded .claude-toggle {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
      }
      
      .claude-container.expanded .claude-toggle svg {
        width: 18px;
        height: 18px;
      }
      
      .claude-input-area {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      
      .claude-input {
        border: none;
        background: rgba(255, 255, 255, 0.5);
        outline: none;
        font-size: 14px;
        color: #1f2937;
        flex: 1;
        min-width: 150px;
        font-family: inherit;
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.2s ease;
        resize: none;
        min-height: 52px;  /* Default to ~2 lines */
        height: 52px;      /* Set initial height */
        max-height: 120px;
        overflow-y: auto;
        line-height: 1.4;
      }
      
      .claude-input:focus {
        background: white;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
      }
      
      .claude-input::placeholder {
        color: #9ca3af;
      }
      
      .claude-send {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .claude-send:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      
      .claude-send:active {
        transform: translateY(0) scale(0.98);
      }
      
      .claude-send:disabled {
        background: #e5e7eb;
        cursor: not-allowed;
        box-shadow: none;
      }
      
      .claude-send.processing {
        background: linear-gradient(135deg, #fbbf24 0%, #fb923c 100%);
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
      
      .claude-working-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid transparent;
        border-top-color: #ef4444;
        border-right-color: #f97316;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .claude-send svg {
        width: 12px;
        height: 12px;
        fill: white;
      }
      
      .claude-highlight {
        position: relative;
        outline: 2px solid #ef4444 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
        animation: highlightPulse 2s ease-in-out infinite;
      }
      
      @keyframes highlightPulse {
        0%, 100% { 
          outline-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }
        50% { 
          outline-color: #f97316;
          box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.15);
        }
      }
      
      .claude-hover {
        outline: 2px dashed #ef4444 !important;
        outline-offset: 3px !important;
        background: rgba(239, 68, 68, 0.05) !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
      }
      
      .claude-notification {
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 
          0 10px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: notificationSlide 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(10px);
      }
      
      .claude-notification.success {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(67, 160, 71, 0.95) 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .claude-notification.processing {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.95) 0%, rgba(30, 136, 229, 0.95) 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .claude-notification.error {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      @keyframes notificationSlide {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
  }

  getHTML() {
    return `
      <div class="claude-container" id="claude-container">
        <button class="claude-toggle" id="claude-toggle" title="Claude Frontend (Alt+C)">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </button>
        <button class="claude-settings-btn" id="claude-settings-btn" title="Settings">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
        <div class="claude-expanded-content" id="claude-expanded-content">
          <div class="claude-selected-elements" id="claude-selected-elements"></div>
          <div class="claude-settings-panel" id="claude-settings-panel" style="display: none;">
            <div class="claude-setting">
              <label>
                <input type="checkbox" id="claude-bypass-permissions" ${this.settings.bypassPermissions ? 'checked' : ''}>
                <span>Bypass permissions (--dangerously-skip-permissions)</span>
              </label>
            </div>
            <div class="claude-setting">
              <label>
                <input type="checkbox" id="claude-continue-chat" ${this.settings.continueChat ? 'checked' : ''}>
                <span>Continue existing chat (-c)</span>
              </label>
            </div>
            <div class="claude-setting">
              <label style="flex-direction: column; align-items: flex-start;">
                <span style="margin-bottom: 4px;">Subagent (optional):</span>
                <input 
                  type="text" 
                  id="claude-subagent" 
                  placeholder="e.g., code-reviewer, general-purpose"
                  value="${this.settings.subagent || ''}"
                  title="Request a specific subagent like 'code-reviewer' or 'general-purpose'"
                  style="width: 100%; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; background: white; font-size: 13px; box-sizing: border-box;">
              </label>
            </div>
          </div>
          <div class="claude-input-area">
            <textarea 
              class="claude-input" 
              id="claude-input" 
              placeholder="Describe your change..."
              autocomplete="off"
              rows="2"
            ></textarea>
            <button class="claude-send" id="claude-send" title="Send (Enter)">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="claude-working-content" id="claude-working-content" style="display: none;">
          <div class="claude-working-spinner"></div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const toggle = document.getElementById('claude-toggle');
    const container = document.getElementById('claude-container');
    const input = document.getElementById('claude-input');
    const send = document.getElementById('claude-send');
    const settingsBtn = document.getElementById('claude-settings-btn');
    const bypassCheckbox = document.getElementById('claude-bypass-permissions');
    const continueCheckbox = document.getElementById('claude-continue-chat');
    const subagentInput = document.getElementById('claude-subagent');

    // Toggle widget
    toggle.addEventListener('click', () => this.toggle());
    
    // Settings button
    settingsBtn?.addEventListener('click', () => this.toggleSettings());
    
    // Settings checkboxes
    bypassCheckbox?.addEventListener('change', (e) => {
      this.settings.bypassPermissions = e.target.checked;
      this.saveSettings();
    });
    
    continueCheckbox?.addEventListener('change', (e) => {
      this.settings.continueChat = e.target.checked;
      this.saveSettings();
    });
    
    // Subagent input - save on blur or Enter
    subagentInput?.addEventListener('blur', (e) => {
      this.settings.subagent = e.target.value.trim();
      this.saveSettings();
    });
    
    subagentInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.settings.subagent = e.target.value.trim();
        this.saveSettings();
        e.target.blur();
      }
    });

    // Auto-resize textarea and send on Enter
    input?.addEventListener('input', (e) => {
      this.autoResizeTextarea(e.target);
    });
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Send button
    send?.addEventListener('click', () => this.send());

    // Global keyboard shortcut (Alt+C)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        this.toggle();
      }
      // Debug: Alt+W to test working animation
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        console.log('[Claude Frontend] Testing working animation');
        this.showWorkingAnimation();
        setTimeout(() => this.hideWorkingAnimation(), 5000);
      }
    });

    // Element selection handlers
    document.addEventListener('mouseover', (e) => this.handleMouseOver(e));
    document.addEventListener('mouseout', (e) => this.handleMouseOut(e));
    document.addEventListener('click', (e) => this.handleClick(e), true);
  }

  toggle() {
    const container = document.getElementById('claude-container');
    const input = document.getElementById('claude-input');
    
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      container.classList.add('expanded');
      this.isSelecting = true;
      setTimeout(() => {
        input?.focus();
        this.autoResizeTextarea(input);
      }, 100);
    } else {
      container.classList.remove('expanded');
      this.isSelecting = false;
      this.clearHighlights();
    }
  }
  
  autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.max(52, Math.min(textarea.scrollHeight, 120));  // Min 52px (2 lines), max 120px
    textarea.style.height = newHeight + 'px';
  }
  
  toggleSettings() {
    const panel = document.getElementById('claude-settings-panel');
    const btn = document.getElementById('claude-settings-btn');
    
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      btn.classList.add('active');
    } else {
      panel.style.display = 'none';
      btn.classList.remove('active');
    }
  }

  close() {
    const container = document.getElementById('claude-container');
    container.classList.remove('expanded');
    this.isOpen = false;
    this.isSelecting = false;
    this.clearHighlights();
  }

  handleMouseOver(e) {
    if (!this.isSelecting || this.widget.contains(e.target)) return;
    e.target.classList.add('claude-hover');
  }

  handleMouseOut(e) {
    if (!this.isSelecting) return;
    e.target.classList.remove('claude-hover');
  }

  handleClick(e) {
    if (!this.isSelecting || this.widget.contains(e.target)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    element.classList.remove('claude-hover');
    
    const elementId = this.getElementId(element);
    const existingIndex = this.selectedElements.findIndex(el => el.id === elementId);
    
    if (existingIndex !== -1) {
      element.classList.remove('claude-highlight');
      element.removeAttribute('data-claude-id');
      this.selectedElements.splice(existingIndex, 1);
    } else {
      element.classList.add('claude-highlight');
      element.setAttribute('data-claude-id', elementId);
      
      this.selectedElements.push({
        id: elementId,
        selector: this.getSelector(element),
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        text: (element.textContent || '').substring(0, 100),
        reactComponent: this.getReactComponentName(element)
      });
    }
    
    this.updateSelectedElements();
  }
  
  updateSelectedElements() {
    const container = document.getElementById('claude-selected-elements');
    if (this.selectedElements.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
    } else {
      container.style.display = 'flex';
      container.innerHTML = this.selectedElements.map((el, i) => {
        // Get a friendly name for the element
        let elementName = el.tagName;
        
        // Priority order for naming:
        // 1. Semantic HTML tags (most descriptive)
        if (el.tagName === 'img') {
          elementName = 'image';
        } else if (el.tagName === 'svg') {
          elementName = 'icon';
        } else if (el.tagName === 'video') {
          elementName = 'video';
        } else if (el.tagName === 'h1' || el.tagName === 'h2' || el.tagName === 'h3' || 
                   el.tagName === 'h4' || el.tagName === 'h5' || el.tagName === 'h6') {
          elementName = 'heading';
        } else if (el.tagName === 'p') {
          elementName = 'text';
        } else if (el.tagName === 'button') {
          elementName = 'button';
        } else if (el.tagName === 'a') {
          elementName = 'link';
        } else if (el.tagName === 'input' || el.tagName === 'textarea' || el.tagName === 'select') {
          elementName = el.tagName;
        } else if (el.tagName === 'ul' || el.tagName === 'ol') {
          elementName = 'list';
        } else if (el.tagName === 'li') {
          elementName = 'list-item';
        } else if (el.tagName === 'nav') {
          elementName = 'navigation';
        } else if (el.tagName === 'header') {
          elementName = 'header';
        } else if (el.tagName === 'footer') {
          elementName = 'footer';
        } else if (el.tagName === 'section') {
          elementName = 'section';
        } else if (el.tagName === 'article') {
          elementName = 'article';
        } else if (el.tagName === 'form') {
          elementName = 'form';
        } 
        // 2. Element ID (if available)
        else if (el.selector && el.selector.startsWith('#')) {
          elementName = el.selector.substring(1);
        }
        // 3. React component (if not a Next.js internal)
        else if (el.reactComponent) {
          elementName = el.reactComponent;
        }
        // 4. Meaningful class name
        else if (el.className && typeof el.className === 'string') {
          const classes = el.className.split(' ').filter(c => 
            c && 
            !c.startsWith('claude-') && 
            !c.includes('_') &&  // Skip minified classes
            c.length > 2  // Skip very short classes
          );
          if (classes.length > 0) {
            // Prefer classes that look like component names
            const componentClass = classes.find(c => /^[A-Z]/.test(c)) || classes[0];
            elementName = componentClass;
          }
        }
        // 5. For divs/spans with text content
        else if ((el.tagName === 'div' || el.tagName === 'span') && el.text && el.text.length > 0) {
          // Try to use first few words of text
          const firstWords = el.text.trim().split(' ').slice(0, 2).join(' ');
          if (firstWords.length <= 20) {
            elementName = firstWords;
          } else {
            elementName = el.tagName === 'div' ? 'block' : 'text';
          }
        }
        
        return `
          <div class="claude-element-tag">
            <span>${elementName}</span>
            <button data-index="${i}" class="claude-remove-btn">×</button>
          </div>
        `;
      }).join('');
      
      // Attach click handlers to remove buttons
      container.querySelectorAll('.claude-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          this.removeElement(index);
        });
      });
    }
  }

  removeElement(index) {
    const element = this.selectedElements[index];
    const domElement = document.querySelector(`[data-claude-id="${element.id}"]`);
    if (domElement) {
      domElement.classList.remove('claude-highlight');
      domElement.removeAttribute('data-claude-id');
    }
    this.selectedElements.splice(index, 1);
    this.updateSelectedElements();
  }

  getReactComponentName(element) {
    const reactKey = Object.keys(element).find(key => 
      key.startsWith('__reactInternalInstance') || 
      key.startsWith('__reactFiber')
    );
    
    if (reactKey) {
      try {
        const fiber = element[reactKey];
        let current = fiber;
        const foundComponents = [];
        
        // Traverse up the fiber tree and collect all component names
        while (current) {
          if (current.elementType && typeof current.elementType === 'function') {
            const name = current.elementType.name;
            const displayName = current.elementType.displayName;
            
            if (name || displayName) {
              // Check if component has a source location (user code)
              const hasSource = current._debugSource || 
                               (current.elementType && current.elementType.__source);
              
              // Check if it looks like user code based on the name
              const looksLikeUserCode = name && (
                // Starts with uppercase (React convention for user components)
                /^[A-Z]/.test(name) &&
                // Not a known framework pattern
                !name.includes('Provider') &&
                !name.includes('Consumer') &&
                !name.includes('Context') &&
                !name.includes('Fragment') &&
                // Not anonymous or generated
                name !== 'Component' &&
                name !== 'Anonymous' &&
                // Has reasonable length (not minified)
                name.length > 1 &&
                name.length < 50 &&
                // No underscores or dollar signs (internal markers)
                !name.includes('_') &&
                !name.includes('$')
              );
              
              foundComponents.push({
                name: displayName || name,
                hasSource,
                looksLikeUserCode,
                depth: foundComponents.length
              });
            }
          }
          current = current.return;
        }
        
        // Strategy 1: Find first component that has source info (most reliable)
        const withSource = foundComponents.find(c => c.hasSource && c.looksLikeUserCode);
        if (withSource) return withSource.name;
        
        // Strategy 2: Find first component that looks like user code
        const userComponent = foundComponents.find(c => c.looksLikeUserCode);
        if (userComponent) return userComponent.name;
        
        // Strategy 3: If no user components found, return the first non-framework component
        // but filter out obvious Next.js internals
        for (const comp of foundComponents) {
          const name = comp.name;
          const isDefinitelyInternal = 
            name.includes('Router') ||
            name.includes('Boundary') ||
            name.includes('Handler') ||
            name.includes('Template') ||
            name.includes('Segment') ||
            name.includes('Layout') ||
            name.includes('Inner') ||
            name.includes('Scroll') ||
            name.includes('Focus') ||
            name.includes('Fallback') ||
            name.includes('HTTP');
            
          if (!isDefinitelyInternal) {
            return name;
          }
        }
      } catch (e) {}
    }
    return null;
  }
  getElementId(element) {
    if (element.hasAttribute('data-claude-id')) {
      return element.getAttribute('data-claude-id');
    }
    return `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className
        .split(' ')
        .filter(c => c && !c.startsWith('claude-'))
        .join('.');
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  }

  clearHighlights() {
    document.querySelectorAll('.claude-highlight, .claude-hover').forEach(el => {
      el.classList.remove('claude-highlight', 'claude-hover');
      el.removeAttribute('data-claude-id');
    });
  }

  async send() {
    const input = document.getElementById('claude-input');
    const sendBtn = document.getElementById('claude-send');
    const comment = input?.value || '';
    
    if (!this.selectedElements.length && !comment) return;
    
    // Show working animation IMMEDIATELY and disable selection
    this.showWorkingAnimation();
    this.waitingForResponse = true;
    this.isSelecting = false;  // Disable element selection
    
    // Start polling for response
    this.startPollingForResponse();
    
    const data = {
      elements: this.selectedElements,
      comment,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      appendToChat: true,
      settings: this.settings  // Include settings
    };
    
    // Clear inputs right away
    this.selectedElements = [];
    if (input) {
      input.value = '';
      input.style.height = '52px';  // Reset to default 2-line height
    }
    this.clearHighlights();
    this.updateSelectedElements();
    
    if (this.serverAvailable) {
      try {
        const response = await fetch(`http://localhost:${this.serverPort}/send-to-claude`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          console.log('[Claude Frontend] Request sent successfully');
          // Animation is already showing, just wait for completion
        } else {
          console.error('[Claude Frontend] Server response not ok:', response.status);
          this.hideWorkingAnimation();
          this.showNotification('Failed to send', 'error');
        }
      } catch (error) {
        console.error('Failed to send:', error);
        this.hideWorkingAnimation();
        await this.copyToClipboard(data);
      }
    } else {
      this.hideWorkingAnimation();
      await this.copyToClipboard(data);
    }
  }
  async copyToClipboard(data) {
    const message = `Selected: ${data.elements.map(el => el.selector).join(', ')}\n${data.comment}`;
    await navigator.clipboard.writeText(message);
    this.showNotification('Copied to clipboard', 'success');
  }

  showNotification(message, type = 'success') {
    const existing = document.querySelector('.claude-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `claude-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
  }
  
  showWorkingAnimation() {
    const container = document.getElementById('claude-container');
    if (container) {
      container.classList.add('working');
      // Keep the widget expanded while working
      if (!container.classList.contains('expanded')) {
        container.classList.add('expanded');
      }
    }
  }
  
  hideWorkingAnimation() {
    const container = document.getElementById('claude-container');
    if (container) {
      container.classList.remove('working');
    }
  }
}

// Auto-initialize if imported as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeFrontendWidget;
}

// Also make available globally
if (typeof window !== 'undefined') {
  window.ClaudeFrontendWidget = ClaudeFrontendWidget;
  
  // Auto-initialize with default settings
  window.claudeFrontend = new ClaudeFrontendWidget();
}