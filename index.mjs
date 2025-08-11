// ESM wrapper for claude-frontend
import ClaudeFrontendWidget from './index.js';

export default ClaudeFrontendWidget;
export { ClaudeFrontendWidget };

// Auto-inject in development
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const isDev = 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.includes('.local');
  
  if (isDev && !window.claudeFrontend) {
    window.claudeFrontend = new ClaudeFrontendWidget();
  }
}