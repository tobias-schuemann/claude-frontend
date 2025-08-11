// TypeScript definitions for claude-frontend

export interface ClaudeFrontendSettings {
  bypassPermissions?: boolean;
  continueChat?: boolean;
}

export interface ClaudeFrontendOptions {
  serverPort?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoStart?: boolean;
}

export interface SelectedElement {
  id: string;
  selector: string;
  tagName: string;
  className?: string;
  text?: string;
  reactComponent?: string | null;
}

export declare class ClaudeFrontendWidget {
  constructor(options?: ClaudeFrontendOptions);
  
  serverPort: number;
  position: string;
  serverAvailable: boolean;
  selectedElements: SelectedElement[];
  isSelecting: boolean;
  widget: HTMLElement | null;
  isOpen: boolean;
  waitingForResponse: boolean;
  showSettings: boolean;
  settings: ClaudeFrontendSettings;
  
  init(): void;
  toggle(): void;
  open(): void;
  close(): void;
  send(): Promise<void>;
  clearHighlights(): void;
  removeElement(index: number): void;
  showNotification(message: string, type?: 'success' | 'error' | 'processing'): void;
}

export declare class ClaudeCodeServer {
  constructor(options?: {
    projectDirectory?: string;
  });
  
  start(): void;
  handleRequest(req: any, res: any): Promise<void>;
  sendToClaudeCode(prompt: string, useExistingChat?: boolean, settings?: ClaudeFrontendSettings): Promise<void>;
}

// Named exports
export { ClaudeFrontendWidget, ClaudeCodeServer };

// Default export (for compatibility)
export default ClaudeFrontendWidget;

// Auto-inject module (kept for backwards compatibility)
declare module 'claude-frontend/auto' {
  // This module auto-initializes when imported
}