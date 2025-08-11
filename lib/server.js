const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3002;

class ClaudeCodeServer {
    constructor(options = {}) {
        this.server = null;
        this.projectDirectory = options.projectDirectory || process.cwd();
        this.sessionFile = path.join(this.projectDirectory, '.claude-frontend-session');
        this.sessionId = this.loadSessionId();
        this.claudeProcess = null;
        this.claudeReady = false;
        this.claudeCompleted = false;
        this.lastRequestTime = null;
    }
    
    loadSessionId() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const content = fs.readFileSync(this.sessionFile, 'utf8').trim();
                if (content) {
                    console.log(`📎 Found existing session: ${content}`);
                    return content;
                }
            }
        } catch (e) {
            // Ignore errors
        }
        return null;
    }
    
    saveSessionId(sessionId) {
        try {
            fs.writeFileSync(this.sessionFile, sessionId, 'utf8');
            this.sessionId = sessionId;
            console.log(`💾 Saved session ID: ${sessionId}`);
        } catch (e) {
            console.error('Failed to save session ID:', e.message);
        }
    }
    
    async getSessionIdFromClaude() {
        // Extract session ID from Claude's output or process
        // This would need to parse Claude's response or check its state files
        // For now, we'll need to ask the user to provide it once
        return null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✨ Claude Frontend is running!`);
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`📂 Working in: ${this.projectDirectory}`);
            console.log(`\n💡 The widget in your app will connect automatically\n`);
        });

        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${PORT} is already in use!`);
                console.log('   Another Claude Frontend server might be running.');
                console.log('   Try stopping it first or use a different project.\n');
            } else {
                console.error('Server error:', error);
            }
            process.exit(1);
        });
    }

    async handleRequest(req, res) {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Serve the client script
        if (req.method === 'GET' && req.url === '/claude-bridge.js') {
            const clientScript = fs.readFileSync(path.join(__dirname, 'client-script.js'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(clientScript);
            return;
        }

        // Health check endpoint
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', service: 'claude-frontend' }));
            return;
        }
        
        // Serve the widget JavaScript
        if (req.method === 'GET' && req.url === '/widget.js') {
            const widgetScript = fs.readFileSync(path.join(__dirname, 'widget.js'), 'utf8');
            res.writeHead(200, { 
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache'
            });
            res.end(widgetScript);
            return;
        }
        
        // Serve the bookmarklet page
        if (req.method === 'GET' && req.url === '/') {
            const html = this.getBookmarkletPage();
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        }
        
        // Handle widget sending data
        if (req.method === 'POST' && req.url === '/send-to-claude') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    await this.sendToClaude(data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, sessionId: this.sessionId }));
                } catch (error) {
                    console.error('Error processing request:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }
        
        // Set session ID endpoint
        if (req.method === 'POST' && req.url === '/set-session') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.sessionId) {
                        this.saveSessionId(data.sessionId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'No session ID provided' }));
                    }
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }
        
        // Get current session ID
        if (req.method === 'GET' && req.url === '/session') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ sessionId: this.sessionId }));
            return;
        }
        
        // Get Claude completion status
        if (req.method === 'GET' && req.url === '/status') {
            // Simply return the current completion status
            const completed = this.claudeCompleted;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                completed,
                lastRequestTime: this.lastRequestTime
            }));
            
            // Reset completion flag after reading if completed
            if (completed) {
                console.log('📊 Status check: Claude completed, resetting flag');
                this.claudeCompleted = false;
                this.lastRequestTime = null;
            }
            return;
        }

        if (req.method === 'POST' && req.url === '/claude-code-extension') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    await this.processElementData(data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Data sent to Claude Code CLI',
                        projectDirectory: this.projectDirectory 
                    }));
                } catch (error) {
                    console.error('❌ Error processing request:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    }

    async processElementData(data) {
        console.log(`\n📥 Received ${data.elements.length} selected element${data.elements.length === 1 ? '' : 's'} from ${data.url}`);
        console.log(`📂 Working directory: ${this.projectDirectory}`);
        
        const prompt = this.generatePrompt(data);
        
        // Only show the prompt in verbose mode or if Claude Code fails
        const verbose = process.env.VERBOSE === 'true';
        if (verbose) {
            console.log('\n📝 Generated prompt:\n');
            console.log('─'.repeat(80));
            console.log(prompt);
            console.log('─'.repeat(80));
        }
        
        try {
            await this.sendToClaudeCode(prompt);
            console.log('✅ Successfully sent to Claude Code!\n');
        } catch (error) {
            console.error('❌ Failed to send to Claude Code:', error.message);
            console.log('\n💡 To use this data manually:');
            console.log('   1. Make sure you have Claude Code CLI installed');
            console.log('   2. Run: claude-code');
            console.log('   3. Paste the following prompt:\n');
            console.log('─'.repeat(80));
            console.log(prompt);
            console.log('─'.repeat(80));
        }
    }

    generatePrompt(data) {
        let prompt = `I'm working on a web application and need help with specific elements I've selected on the page.\n\n`;
        
        // Context about the page
        prompt += `**Page Context:**\n`;
        prompt += `- URL: ${data.url}\n`;
        prompt += `- Title: ${data.title || 'Untitled'}\n`;
        
        if (data.pathname) {
            prompt += `- Path: ${data.pathname}\n`;
        }
        
        if (data.viewport) {
            prompt += `- Viewport: ${data.viewport.width}x${data.viewport.height}px\n`;
        }
        
        // Check if this is a known framework based on common ports
        if (data.project && data.project.port) {
            const port = data.project.port;
            if (port === '3000' || port === '3001') {
                prompt += `- Likely framework: Next.js or Create React App\n`;
            } else if (port === '5173') {
                prompt += `- Likely framework: Vite\n`;
            } else if (port === '4200') {
                prompt += `- Likely framework: Angular\n`;
            }
        }
        
        prompt += `\n`;
        
        // User's specific request
        if (data.comment && data.comment.trim()) {
            prompt += `**User Request:**\n${data.comment}\n\n`;
        }
        
        // Details about selected elements
        if (data.elements && data.elements.length > 0) {
            prompt += `**Selected Elements (${data.elements.length}):**\n`;
            
            data.elements.forEach((element, index) => {
                prompt += `\n${index + 1}. **${element.tagName.toUpperCase()} Element**\n`;
                prompt += `   - CSS Selector: \`${element.selector}\`\n`;
                
                if (element.className) {
                    // Parse and format classes nicely
                    const classes = element.className.split(' ').filter(c => c && !c.startsWith('claude-'));
                    if (classes.length > 0) {
                        prompt += `   - Classes: ${classes.map(c => `\`${c}\``).join(', ')}\n`;
                    }
                }
                
                if (element.textContent) {
                    prompt += `   - Text Content: "${element.textContent}"\n`;
                }
            });
            
            prompt += `\n`;
        }
        
        // Add context about finding the source files
        prompt += `**Note:** I'm running in the project directory: ${this.projectDirectory}\n`;
        prompt += `Please help me locate and modify the source components for these elements.\n`;
        
        // Default request if no specific comment
        if (!data.comment || !data.comment.trim()) {
            prompt += `\nPlease analyze these elements and suggest improvements or help me understand their implementation.`;
        }
        
        return prompt;
    }

    getBookmarkletPage() {
        const bookmarkletCode = `javascript:(function(){const s=document.createElement('script');s.src='http://localhost:${PORT}/claude-bridge.js';document.body.appendChild(s);})()`;
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Claude Dev Inspector</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #334155;
            margin-top: 0;
        }
        .bookmarklet {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .bookmarklet:hover {
            transform: scale(1.05);
        }
        .status {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #166534;
        }
        .instructions {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .instructions h3 {
            margin-top: 0;
            color: #475569;
        }
        .instructions ol {
            color: #64748b;
            line-height: 1.8;
        }
        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        .method {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .method h3 {
            margin-top: 0;
            color: #334155;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Claude Dev Inspector</h1>
        
        <div class="status">
            ✅ Server is running on port ${PORT}<br>
            📂 Project directory: <code>${this.projectDirectory}</code>
        </div>

        <h2>Quick Start</h2>
        
        <div class="method">
            <h3>Method 1: Bookmarklet (Recommended)</h3>
            <p>Drag this button to your bookmarks bar:</p>
            <a href="${bookmarkletCode}" class="bookmarklet">🎯 Claude Select</a>
            <p>Then click it on any page to start selecting elements!</p>
        </div>

        <div class="method">
            <h3>Method 2: DevTools Console</h3>
            <p>Copy and paste this into your browser's console:</p>
            <pre><code>fetch('http://localhost:${PORT}/claude-bridge.js')
  .then(r => r.text())
  .then(eval)</code></pre>
        </div>

        <div class="method">
            <h3>Method 3: Auto-inject (Coming Soon)</h3>
            <p>Add to your dev server to automatically inject on all pages during development.</p>
        </div>

        <div class="instructions">
            <h3>How to Use</h3>
            <ol>
                <li>Navigate to your localhost development site</li>
                <li>Click the bookmarklet or run the console command</li>
                <li>Click on elements to select them (they'll turn green)</li>
                <li>Add a description of what you need help with</li>
                <li>Click "Send to Claude Code"</li>
                <li>Claude Code will open in this project directory</li>
            </ol>
        </div>

        <div class="instructions">
            <h3>Tips</h3>
            <ul>
                <li>Hover over elements to preview selection (blue outline)</li>
                <li>Click selected elements again to deselect them</li>
                <li>Click the × on items in the widget to remove them</li>
                <li>The widget shows element selectors and text content</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    }

    async sendToClaude(data) {
        console.log('\n📥 Received element selection from widget:');
        console.log('   URL:', data.url);
        console.log('   Elements:', data.elements.length);
        console.log('   Comment:', data.comment || '(none)');
        
        // Get settings from data or use defaults
        const settings = data.settings || {
            bypassPermissions: true,
            continueChat: true
        };
        
        console.log('   Settings:', settings);
        
        // Build a detailed prompt with component context
        let prompt = `The user selected ${data.elements.length} element(s) on ${data.url}:\n\n`;
        
        data.elements.forEach((el, index) => {
            prompt += `Element ${index + 1}:\n`;
            prompt += `  Selector: ${el.selector}\n`;
            prompt += `  Tag: <${el.tagName}>\n`;
            
            if (el.reactComponent) {
                prompt += `  React Component: ${el.reactComponent}\n`;
            }
            
            if (el.className && el.className !== 'claude-highlight') {
                const classes = el.className.replace('claude-highlight', '').trim();
                if (classes) {
                    prompt += `  Classes: ${classes}\n`;
                }
            }
            
            if (el.text) {
                prompt += `  Text: "${el.text}"\n`;
            }
            
            prompt += '\n';
        });
        
        if (data.comment) {
            prompt += `User request: ${data.comment}\n\n`;
        }
        
        // Add helpful context
        prompt += `Note: This is a ${this.detectFramework(data.url)} application. `;
        prompt += `Look for the React component mentioned above in the codebase. `;
        prompt += `The component name and class names should help you locate the right file to edit.`;
        
        // Use settings to determine chat behavior
        const useExistingChat = settings.continueChat;
        
        return this.sendToClaudeCode(prompt, useExistingChat, settings);
    }
    
    detectFramework(url) {
        // Simple framework detection based on common patterns
        if (url.includes(':3000')) return 'Next.js/React';
        if (url.includes(':5173')) return 'Vite/React';
        if (url.includes(':4200')) return 'Angular';
        if (url.includes(':8080')) return 'Vue';
        return 'React'; // Default assumption
    }

    async sendToClaudeCode(prompt, useExistingChat = true, settings = {}) {
        this.lastRequestTime = Date.now();
        this.claudeCompleted = false;
        console.log('🚀 Starting Claude request, resetting completion flag');
        
        // If a subagent is specified, add it to the prompt
        if (settings.subagent && settings.subagent !== '') {
            // Explicitly request the subagent in the prompt, as shown in the docs
            const subagentRequest = `Use the ${settings.subagent} subagent to ${prompt}`;
            prompt = subagentRequest;
            console.log(`🤖 Requesting subagent: ${settings.subagent}`);
        }
        
        return new Promise((resolve, reject) => {
            // Build args based on settings
            let args = [];
            
            // Always use print mode
            args.push('-p');
            
            // Add bypass permissions if enabled
            if (settings.bypassPermissions !== false) {
                args.push('--dangerously-skip-permissions');
                console.log('⚠️  Using --dangerously-skip-permissions');
            }
            
            // Handle chat continuation
            if (useExistingChat && settings.continueChat !== false) {
                if (this.sessionId) {
                    args.push('--resume', this.sessionId);
                    console.log(`🔄 Resuming session: ${this.sessionId}`);
                } else {
                    args.push('-c');
                    console.log(`➕ Continuing most recent chat`);
                }
            } else {
                console.log(`🆕 Starting new chat`);
            }
            
            console.log('Running:', 'claude', args.join(' '));
            
            const claudeProcess = spawn('claude', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.projectDirectory,
                env: { ...process.env }
            });

            let output = '';
            let errorOutput = '';

            // Capture and display output
            claudeProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                process.stdout.write(text);
            });

            claudeProcess.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                process.stderr.write(text);
            });

            // Send the prompt and close stdin
            claudeProcess.stdin.write(prompt + '\n');
            claudeProcess.stdin.end();

            claudeProcess.on('close', (code) => {
                this.claudeCompleted = true;
                console.log(`✅ Claude process closed with code ${code}, marking as completed`);
                
                if (code === 0) {
                    console.log('✅ Claude completed successfully');
                    resolve();
                } else if (code === 130) {
                    // User pressed Ctrl+C in Claude
                    console.log('👍 Claude session ended by user');
                    resolve();
                } else {
                    reject(new Error(`Claude CLI exited with code ${code}`));
                }
            });

            claudeProcess.on('error', (error) => {
                this.claudeCompleted = true;
                
                if (error.code === 'ENOENT') {
                    reject(new Error('Claude CLI not found'));
                } else {
                    reject(error);
                }
            });
        });
    }
}

module.exports = ClaudeCodeServer;