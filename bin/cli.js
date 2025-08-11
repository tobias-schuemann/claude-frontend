#!/usr/bin/env node

const ClaudeCodeServer = require('../lib/server');
const path = require('path');
const fs = require('fs');

// Get the current working directory (where the command is run from)
const projectDir = process.cwd();

// Check if we're in a valid project directory (has package.json)
const packageJsonPath = path.join(projectDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.warn('⚠️  Warning: No package.json found in current directory');
    console.log('   Running anyway, but make sure you\'re in your project root\n');
}

console.log('🚀 Starting Claude Frontend...');
console.log(`📁 Project directory: ${projectDir}`);

// Create and start the server
const server = new ClaudeCodeServer({
    projectDirectory: projectDir
});

server.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Claude Frontend...');
    if (server.claudeProcess) {
        console.log('Closing Claude session...');
        server.claudeProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down Claude Frontend...');
    if (server.claudeProcess) {
        console.log('Closing Claude session...');
        server.claudeProcess.kill();
    }
    process.exit(0);
});