# Gmail MCP Server

Connect your Gmail to Claude Code! Read, send, search, and manage emails directly through Claude.

> **⚠️ Important**: This gives Claude access to your Gmail. Only use with accounts you trust Claude to access.

---

## 🤖 Recommended: Ask Claude to Help You Install This

**Just say:** *"Claude, help me install this Gmail MCP server"*

Claude can guide you through each step, check for errors, and verify everything works. This is the easiest way!

---

## 🚀 Quick Install Guide (For Claude to Follow)

### Prerequisites Check
```bash
# Check Node.js (required)
node --version

# Check if we're in the right directory
pwd
ls -la
```

**Expected output:** Node version 18+ (like `v20.x.x`)
**If missing:** User needs to install from [nodejs.org](https://nodejs.org)

### Installation Commands
```bash
# 1. Download and enter directory
git clone https://github.com/tjzaks/gmail-mcp-server.git
cd gmail-mcp-server

# 2. Install and build
npm install
npm run build

# 3. Verify build worked
ls -la dist/
```

**Expected output:** Should see `gmail-server.js` in dist/ folder

### Google Cloud Setup (Automated Helper)
```bash
# Check if credentials exist
ls -la credentials.json

# If missing, user needs to:
echo "You need Google Cloud credentials. Follow these steps:"
echo "1. Go to: https://console.cloud.google.com"
echo "2. Create new project: 'Gmail MCP'"  
echo "3. Enable Gmail API"
echo "4. Create OAuth Desktop credentials"
echo "5. Download as 'credentials.json' to this folder"
```

### Authentication Test
```bash
# Test OAuth flow
npm start
```

**Expected output:** URL starting with `https://accounts.google.com/o/oauth2/auth`
**User action:** Copy URL → Browser → Allow → Copy code → Paste in terminal
**Success indicator:** `Gmail MCP Server running on stdio`

### Claude Code Integration
```bash
# Find current directory path
pwd

# Add to Claude config - Mac/Linux
echo '{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["'$(pwd)'/dist/gmail-server.js"]
    }
  }
}' > ~/.claude.json

# Add to Claude config - Windows (PowerShell)
echo '{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["'$PWD'\dist\gmail-server.js"]
    }
  }
}' | Out-File -FilePath "$env:USERPROFILE\.claude.json"
```

### Verification
```bash
# Check Claude MCP config
cat ~/.claude.json

# Check if server starts
cd gmail-mcp-server
npm start
# Should see: "Gmail MCP Server running on stdio"
# Press Ctrl+C to stop
```

**Final test:** Ask Claude: "Can you read my recent emails?"

---

## 🔧 Troubleshooting Commands

### Check Installation Status
```bash
# Verify all components
ls -la gmail-mcp-server/
ls -la gmail-mcp-server/dist/gmail-server.js
ls -la gmail-mcp-server/credentials.json  
ls -la gmail-mcp-server/token.json
cat ~/.claude.json
```

### Common Error Fixes
```bash
# "Cannot find module" error
cd gmail-mcp-server
npm install
npm run build

# "Token not found" error  
cd gmail-mcp-server
npm start
# Complete OAuth flow again

# "Credentials not found" error
cd gmail-mcp-server  
ls -la credentials.json
# If missing, download from Google Cloud Console

# Test server manually
cd gmail-mcp-server
node dist/gmail-server.js
# Should output: "Gmail MCP Server running on stdio"
```

### Reset Everything
```bash
# Nuclear option - start fresh
rm -rf gmail-mcp-server
# Then repeat installation steps
```

---

## 📋 Manual Installation (If You're Doing This Yourself)

<details>
<summary>Click to expand detailed manual steps</summary>

### Step 1: Install Node.js
- Go to [nodejs.org](https://nodejs.org)
- Download and install LTS version
- Verify: `node --version` should show v18+

### Step 2: Download Project
**Option A: Download ZIP**
- Click green "Code" button on GitHub
- Click "Download ZIP"
- Unzip to your Desktop

**Option B: Git clone**
```bash
git clone https://github.com/tjzaks/gmail-mcp-server.git
```

### Step 3: Build Project
```bash
cd gmail-mcp-server
npm install
npm run build
```

### Step 4: Google Cloud Console Setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project called "Gmail MCP"
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop application)
5. Download credentials as `credentials.json`
6. Place `credentials.json` in the project folder

### Step 5: Authenticate
```bash
npm start
```
- Copy the OAuth URL to your browser
- Sign in and authorize
- Copy the authorization code back to terminal

### Step 6: Configure Claude Code
Edit `~/.claude.json` and add:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/full/path/to/gmail-mcp-server/dist/gmail-server.js"]
    }
  }
}
```

### Step 7: Test
- Restart Claude Code
- Ask: "Can you read my recent emails?"

</details>

---

## 🛠️ What You Can Ask Claude

Once installed, try these commands:

- "Read my unread emails"
- "Search for emails from john@company.com"
- "Create a draft email to sarah@example.com"
- "Show me emails about the project"
- "Mark these emails as read"
- "What are my Gmail labels?"

## 🔒 Security & Privacy

- All credentials stay on your computer
- No email data is stored or transmitted
- You can revoke access anytime at [Google Account Settings](https://myaccount.google.com/permissions)

## 📞 Need Help?

1. **Ask Claude!** - "Claude, my Gmail MCP isn't working, can you help troubleshoot?"
2. Check the Issues tab on this GitHub repo
3. Verify you followed each command exactly

---

*Made with ❤️ for Claude Code users* • *@tszaks*