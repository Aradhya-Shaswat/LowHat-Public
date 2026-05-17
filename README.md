# LowHat

LowHat is an execution marketplace where clients and freelancers collaborate on projects with transparent governance and real-time communication.

## development notes

- **ai scaffolding**: the initial project structure and components were scaffolded using ai tools.
- **ui fixes**: minor user interface issues and styling adjustments were resolved with ai assistance.
- **openrouter integration**: the platform integrates with openrouter to enable ai-powered features like writing bids.

## key features

- **governance and voting**: unit members can create proposals and vote to remove other members.
- **google meet support**: integrated meeting creation for collaboration.
- **advanced notifications**: a system to handle read/unread states and real-time alerts.
- **milestone tracking**: projects are managed with detailed milestones and status tracking.
- **command palette**: quick access tool for navigation and global actions.
- **ai bid writer**: automated assistance for freelancers to draft bids via openrouter.

## tech stack

- framework: next.js
- database: neon
- orm: drizzle orm
- package manager: bun
- styling: tailwind css
- components: shadcn ui
- primitives: radix ui, base ui
- icons: lucide react
- themes: next themes
- utilities: clsx, tailwind merge, class variance authority
- moderation: leo profanity

## project scripts

- `bun dev`: starts the development server.
- `bun build`: builds the application for production.
- `bun run db:generate`: generates drizzle migrations.
- `bun run db:push`: pushes the schema to the database.
- `bun run db:studio`: opens drizzle studio.

## getting started

first, run the development server:

```bash
bun dev 
```
or
```bash
bun run dev
```
open [http://localhost:3000](http://localhost:3000) on your browser.