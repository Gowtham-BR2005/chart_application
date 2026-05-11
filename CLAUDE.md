# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WhatsApp-style chat application built with React. It features a complete authentication flow (login/signup with OTP verification) and a messaging interface with a sidebar contact list and chat window.

## Development Commands

```bash
# Start development server (opens at http://localhost:3000)
npm start

# Run tests in watch mode
npm test

# Build for production
npm run build

# Note: npm run gg (nodemon app.js) exists in package.json but app.js is not in the codebase
```

## Architecture

### Authentication Flow

The app uses a client-side authentication gate controlled by `authenticated` state in `App.js`:

1. **Unauthenticated state**: Renders `<Auth />` component which handles login/signup flows
2. **Authenticated state**: Renders the main chat interface (Sidebar + ChatWindow)

The Auth component manages multiple screens via state machine:
- `login` → User ID/password or phone number login
- `otp` → OTP verification for phone-based login
- `signup1` → Step 1: User ID and password creation
- `signup2` → Step 2: Phone number entry
- `signup-otp` → OTP verification for signup
- `success` → Success screen before entering chat

**Important**: This is a demo authentication system. All OTP codes are accepted regardless of value.

### Component Structure

**App.js**: Root component managing authentication state and message/contact data
- Stores all contacts and messages in `initialContacts` array (hardcoded demo data)
- Each contact has: id, name, avatar, avatarColor, lastMessage, time, unread count, online status, messages array
- Messages can have a `sender` field for group chats
- State updates flow: user types → `handleSendMessage` → updates contacts array → updates selectedContact

**Auth.js**: Multi-screen authentication flow with inline SVG icons
- Reusable `Field` component for all input fields with icon, error state, and optional right slot
- Each screen is a separate component (LoginPage, OtpPage, SignUpStep1, SignUpStep2, SuccessScreen)
- OTP input uses ref array for focus management and supports paste handling

**Sidebar.js**: Contact list with search functionality
- Displays all contacts with avatar, last message, timestamp, unread badge
- Search filters by name (case-insensitive)
- Clicking a contact clears its unread count

**ChatWindow.js**: Message display and input area
- Shows WelcomeScreen when no contact selected
- Messages auto-scroll to bottom on new message via `messagesEndRef`
- Enter key sends message (Shift+Enter not implemented for multi-line)
- Conditional send button: shows mic icon when input empty, send icon when text present

### State Management

All state lives in App.js. No external state management library is used. Key state:
- `authenticated`: boolean controlling auth gate
- `contacts`: array of contact objects (includes message history)
- `selectedContact`: currently selected contact for chat view
- `searchQuery`: sidebar search filter

Message sending updates both the `contacts` array and `selectedContact` to keep UI in sync.

### Styling

Each component has its own CSS file. The app uses:
- CSS custom properties for WhatsApp-like theming
- Flexbox layouts throughout
- Inline SVG icons (no icon library)
- Responsive design patterns (media queries in CSS files)

## Deployment

The project is configured for Azure Static Web Apps deployment:
- CI/CD runs on push to main and on PRs
- Build output directory: `build`
- No API backend configured
- Workflow file: `.github/workflows/azure-static-web-apps-kind-cliff-05ea40100.yml`

## Testing

Uses React Testing Library and Jest (configured via Create React App):
- Test files: `App.test.js`, `setupTests.js`
- Run single test: `npm test -- --testNamePattern="test name"`
- Run specific file: `npm test -- App.test.js`

## Code Conventions

- Functional components with hooks (no class components)
- Inline SVG icons defined as constants at file top
- Time formatting uses native `toLocaleTimeString` with 12-hour format
- Demo data uses emojis for avatars and visual elements
- No TypeScript, PropTypes, or type checking
