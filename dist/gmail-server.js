#!/usr/bin/env node
/**
 * Gmail MCP Server - Comprehensive Gmail integration for Claude Code
 * @tszaks
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import { join } from 'path';
class GmailMCPServer {
    server;
    gmail;
    oauth2Client = null;
    credentialsPath;
    tokenPath;
    constructor() {
        this.server = new Server({
            name: 'gmail-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // Set up credential paths - you will need to provide these
        this.credentialsPath = join(process.cwd(), 'credentials.json');
        this.tokenPath = join(process.cwd(), 'token.json');
        this.setupToolHandlers();
    }
    async initializeGmailAPI() {
        if (this.gmail)
            return; // Already initialized
        try {
            // Load client credentials from credentials.json
            const credentials = JSON.parse(await fs.readFile(this.credentialsPath, 'utf-8'));
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            this.oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
            // Load or create token
            try {
                const token = await fs.readFile(this.tokenPath, 'utf-8');
                this.oauth2Client.setCredentials(JSON.parse(token));
            }
            catch (error) {
                throw new Error(`Token not found. Please run authentication flow first. Token should be at: ${this.tokenPath}`);
            }
            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        }
        catch (error) {
            throw new Error(`Failed to initialize Gmail API: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'read_emails',
                    description: 'Read emails from Gmail inbox with optional filters and limits',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Gmail search query (e.g., "from:someone@example.com", "is:unread", "subject:important")',
                                default: ''
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of emails to retrieve',
                                default: 10,
                                maximum: 100
                            },
                            include_body: {
                                type: 'boolean',
                                description: 'Whether to include email body content',
                                default: false
                            }
                        }
                    }
                },
                {
                    name: 'send_email',
                    description: 'Send an email through Gmail',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            to: {
                                type: 'string',
                                description: 'Recipient email address'
                            },
                            subject: {
                                type: 'string',
                                description: 'Email subject line'
                            },
                            body: {
                                type: 'string',
                                description: 'Email body content'
                            },
                            cc: {
                                type: 'string',
                                description: 'CC recipients (optional)',
                                optional: true
                            },
                            bcc: {
                                type: 'string',
                                description: 'BCC recipients (optional)',
                                optional: true
                            },
                            html: {
                                type: 'boolean',
                                description: 'Whether body is HTML format',
                                default: false
                            }
                        },
                        required: ['to', 'subject', 'body']
                    }
                },
                {
                    name: 'search_emails',
                    description: 'Search emails with advanced Gmail search syntax',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Gmail search query (supports all Gmail operators like from:, to:, subject:, has:attachment, etc.)'
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                                default: 25,
                                maximum: 100
                            }
                        },
                        required: ['query']
                    }
                },
                {
                    name: 'get_labels',
                    description: 'Get all Gmail labels/folders',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'get_email_thread',
                    description: 'Get a complete email thread/conversation by thread ID',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            thread_id: {
                                type: 'string',
                                description: 'Gmail thread ID'
                            }
                        },
                        required: ['thread_id']
                    }
                },
                {
                    name: 'mark_as_read',
                    description: 'Mark emails as read',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            message_ids: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of Gmail message IDs to mark as read'
                            }
                        },
                        required: ['message_ids']
                    }
                },
                {
                    name: 'add_labels',
                    description: 'Add labels to emails',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            message_ids: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of Gmail message IDs'
                            },
                            label_ids: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of label IDs to add'
                            }
                        },
                        required: ['message_ids', 'label_ids']
                    }
                },
                {
                    name: 'create_draft',
                    description: 'Create a draft email in Gmail (saves to drafts folder without sending)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            to: {
                                type: 'string',
                                description: 'Recipient email address'
                            },
                            subject: {
                                type: 'string',
                                description: 'Email subject line'
                            },
                            body: {
                                type: 'string',
                                description: 'Email body content'
                            },
                            cc: {
                                type: 'string',
                                description: 'CC recipients (optional)',
                                optional: true
                            },
                            bcc: {
                                type: 'string',
                                description: 'BCC recipients (optional)',
                                optional: true
                            },
                            html: {
                                type: 'boolean',
                                description: 'Whether body is HTML format',
                                default: false
                            }
                        },
                        required: ['to', 'subject', 'body']
                    }
                },
                {
                    name: 'get_auth_url',
                    description: 'Get OAuth2 authorization URL for Gmail API access (for initial setup)',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                }
            ]
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                // Initialize Gmail API for most operations
                if (name !== 'get_auth_url') {
                    await this.initializeGmailAPI();
                }
                switch (name) {
                    case 'read_emails':
                        return await this.readEmails(args);
                    case 'send_email':
                        return await this.sendEmail(args);
                    case 'search_emails':
                        return await this.searchEmails(args);
                    case 'get_labels':
                        return await this.getLabels();
                    case 'get_email_thread':
                        return await this.getEmailThread(args);
                    case 'mark_as_read':
                        return await this.markAsRead(args);
                    case 'add_labels':
                        return await this.addLabels(args);
                    case 'create_draft':
                        return await this.createDraft(args);
                    case 'get_auth_url':
                        return await this.getAuthUrl();
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        });
    }
    async readEmails(args) {
        const query = args.query || '';
        const maxResults = args.max_results || 10;
        const includeBody = args.include_body || false;
        const response = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: Math.min(maxResults, 100)
        });
        const messages = response.data.messages || [];
        const emailData = [];
        for (const message of messages) {
            const fullMessage = await this.gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: includeBody ? 'full' : 'metadata'
            });
            const email = await this.parseEmailMessage(fullMessage.data, includeBody);
            emailData.push(email);
        }
        const summary = this.buildEmailSummary(emailData, query, includeBody);
        return {
            content: [
                {
                    type: 'text',
                    text: summary
                }
            ]
        };
    }
    async sendEmail(args) {
        const { to, subject, body, cc, bcc, html } = args;
        let emailContent = [
            `To: ${to}`,
            `Subject: ${subject}`
        ];
        if (cc)
            emailContent.push(`Cc: ${cc}`);
        if (bcc)
            emailContent.push(`Bcc: ${bcc}`);
        emailContent.push(`Content-Type: text/${html ? 'html' : 'plain'}; charset=utf-8`);
        emailContent.push('');
        emailContent.push(body);
        const encodedMessage = Buffer.from(emailContent.join('\n')).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const response = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Email sent successfully!\n\n**To**: ${to}\n**Subject**: ${subject}\n**Message ID**: ${response.data.id}\n**Thread ID**: ${response.data.threadId}`
                }
            ]
        };
    }
    async searchEmails(args) {
        const query = args.query;
        const maxResults = args.max_results || 25;
        const response = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: Math.min(maxResults, 100)
        });
        const messages = response.data.messages || [];
        const searchResults = [];
        for (const message of messages) {
            const fullMessage = await this.gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'metadata'
            });
            const email = await this.parseEmailMessage(fullMessage.data, false);
            searchResults.push(email);
        }
        const summary = `# Gmail Search Results\n\n**Query**: "${query}"\n**Found**: ${searchResults.length} emails\n\n` +
            searchResults.map((email, index) => `## ${index + 1}. ${email.subject}\n` +
                `**From**: ${email.from}\n` +
                `**Date**: ${email.date}\n` +
                `**Preview**: ${email.snippet}\n` +
                `**ID**: ${email.id}\n`).join('\n');
        return {
            content: [
                {
                    type: 'text',
                    text: summary
                }
            ]
        };
    }
    async getLabels() {
        const response = await this.gmail.users.labels.list({
            userId: 'me'
        });
        const labels = response.data.labels || [];
        const labelSummary = `# Gmail Labels\n\n**Total Labels**: ${labels.length}\n\n` +
            labels.map((label) => `- **${label.name}** (${label.id}) - Type: ${label.type || 'user'}, Messages: ${label.messagesTotal || 0}`).join('\n');
        return {
            content: [
                {
                    type: 'text',
                    text: labelSummary
                }
            ]
        };
    }
    async getEmailThread(args) {
        const threadId = args.thread_id;
        const response = await this.gmail.users.threads.get({
            userId: 'me',
            id: threadId
        });
        const thread = response.data;
        const messages = thread.messages || [];
        let threadSummary = `# Email Thread\n\n**Thread ID**: ${threadId}\n**Messages**: ${messages.length}\n\n`;
        for (let i = 0; i < messages.length; i++) {
            const email = await this.parseEmailMessage(messages[i], true);
            threadSummary += `## Message ${i + 1}\n`;
            threadSummary += `**From**: ${email.from}\n`;
            threadSummary += `**To**: ${email.to}\n`;
            threadSummary += `**Date**: ${email.date}\n`;
            threadSummary += `**Subject**: ${email.subject}\n\n`;
            if (email.body) {
                threadSummary += `**Content**:\n${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}\n\n`;
            }
            threadSummary += '---\n\n';
        }
        return {
            content: [
                {
                    type: 'text',
                    text: threadSummary
                }
            ]
        };
    }
    async markAsRead(args) {
        const messageIds = args.message_ids;
        for (const messageId of messageIds) {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Marked ${messageIds.length} email(s) as read`
                }
            ]
        };
    }
    async addLabels(args) {
        const messageIds = args.message_ids;
        const labelIds = args.label_ids;
        for (const messageId of messageIds) {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    addLabelIds: labelIds
                }
            });
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Added labels to ${messageIds.length} email(s)`
                }
            ]
        };
    }
    async createDraft(args) {
        const { to, subject, body, cc, bcc, html } = args;
        let emailContent = [
            `To: ${to}`,
            `Subject: ${subject}`
        ];
        if (cc)
            emailContent.push(`Cc: ${cc}`);
        if (bcc)
            emailContent.push(`Bcc: ${bcc}`);
        emailContent.push(`Content-Type: text/${html ? 'html' : 'plain'}; charset=utf-8`);
        emailContent.push('');
        emailContent.push(body);
        const encodedMessage = Buffer.from(emailContent.join('\n')).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const response = await this.gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    raw: encodedMessage
                }
            }
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Draft created successfully!\n\n**To**: ${to}\n**Subject**: ${subject}\n**Draft ID**: ${response.data.id}\n**Status**: Saved to Gmail Drafts folder - ready to send when you're ready!`
                }
            ]
        };
    }
    async getAuthUrl() {
        try {
            const credentials = JSON.parse(await fs.readFile(this.credentialsPath, 'utf-8'));
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            const oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
            const SCOPES = [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/gmail.labels'
            ];
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `# Gmail OAuth2 Authorization\n\n**Step 1**: Visit this URL to authorize the app:\n\n${authUrl}\n\n**Step 2**: After authorization, you'll get a code. Save it as token.json in the project directory.\n\n**Credentials Path**: ${this.credentialsPath}\n**Token Path**: ${this.tokenPath}`
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting auth URL: ${error instanceof Error ? error.message : String(error)}\n\nMake sure you have credentials.json in: ${this.credentialsPath}`
                    }
                ]
            };
        }
    }
    async parseEmailMessage(message, includeBody) {
        const headers = message.payload?.headers || [];
        const getHeader = (name) => {
            const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
        };
        let body = '';
        if (includeBody) {
            body = this.extractEmailBody(message.payload);
        }
        return {
            id: message.id,
            threadId: message.threadId,
            snippet: message.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            body,
            labels: message.labelIds || []
        };
    }
    extractEmailBody(payload) {
        if (!payload)
            return '';
        // Simple text extraction - handles basic cases
        if (payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }
        if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
            }
        }
        return 'Body content not available';
    }
    buildEmailSummary(emails, query, includeBody) {
        const queryText = query ? ` matching "${query}"` : '';
        let summary = `# Gmail Emails${queryText}\n\n**Found**: ${emails.length} emails\n\n`;
        emails.forEach((email, index) => {
            summary += `## ${index + 1}. ${email.subject || 'No Subject'}\n`;
            summary += `**From**: ${email.from}\n`;
            summary += `**To**: ${email.to}\n`;
            summary += `**Date**: ${email.date}\n`;
            summary += `**ID**: ${email.id}\n`;
            summary += `**Thread**: ${email.threadId}\n`;
            summary += `**Preview**: ${email.snippet}\n`;
            if (includeBody && email.body) {
                summary += `\n**Content**:\n${email.body.substring(0, 300)}${email.body.length > 300 ? '...' : ''}\n`;
            }
            summary += '\n---\n\n';
        });
        return summary;
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Gmail MCP Server running on stdio');
    }
}
const server = new GmailMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=gmail-server.js.map