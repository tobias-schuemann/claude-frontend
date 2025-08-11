// Auto-inject version - just import this file and it works!
// import 'claude-frontend/auto';

(function() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Only run in development
  const isDev = 
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.includes('.local');

  if (!isDev) {
    console.log('[Claude Frontend] Skipping initialization (not in development)');
    return;
  }

  // Dynamically load the widget code
  function loadWidget() {
    // Check if already loaded
    if (window.claudeFrontend) {
      console.log('[Claude Frontend] Already initialized');
      return;
    }

    // For bundlers that support require
    if (typeof require !== 'undefined') {
      try {
        const ClaudeFrontendWidget = require('./lib/widget');
        window.claudeFrontend = new ClaudeFrontendWidget();
        console.log('[Claude Frontend] Widget loaded via require');
        return;
      } catch (e) {
        // Fall through to dynamic import
      }
    }

    // For modern bundlers with dynamic import
    if (typeof import !== 'undefined') {
      import('./lib/widget.js')
        .then(module => {
          const ClaudeFrontendWidget = module.default || module.ClaudeFrontendWidget || module;
          window.claudeFrontend = new ClaudeFrontendWidget();
          console.log('[Claude Frontend] Widget loaded via dynamic import');
        })
        .catch(err => {
          console.error('[Claude Frontend] Failed to load widget:', err);
          // Fallback: inject script tag
          injectScript();
        });
    } else {
      // Fallback: inject script tag
      injectScript();
    }
  }

  function injectScript() {
    // Create inline script with the widget code
    const script = document.createElement('script');
    script.textContent = `
      // Check if server is available
      fetch('http://localhost:3002/health')
        .then(r => r.json())
        .then(data => {
          if (data.status === 'ok') {
            // Server is running, inject the widget
            const widgetScript = document.createElement('script');
            widgetScript.src = 'http://localhost:3002/widget.js';
            document.head.appendChild(widgetScript);
            console.log('[Claude Frontend] Widget loaded from server');
          }
        })
        .catch(() => {
          console.log('[Claude Frontend] Server not running. Start it with: npx claude-frontend');
        });
    `;
    document.head.appendChild(script);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget);
  } else {
    loadWidget();
  }
})();