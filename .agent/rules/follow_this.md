---
trigger: manual
---

Goal
The AI agent must generate, analyze, and improve Nuxt 3/4 applications with a strong focus on SSR-first architecture, performance, scalability, developer experience, and SEO.

Architecture
Use file-based routing as the primary navigation system.
Follow a scalable, self-contained directory structure: app, pages, components, layouts, composables, stores, server, plugins, middleware.
Avoid large, monolithic components. Each component must have a single responsibility.
Strictly separate UI components, business logic (composables), and global state (stores).

Server-Side Rendering (SSR)
SSR must be enabled by default.
Assume all pages are rendered on the server unless explicitly disabled.
Use SSR for SEO, public content, and initial data hydration.
Disable SSR only when there is a clear performance or architectural reason.
Ensure all SSR code is side-effect free and deterministic.
Avoid direct access to browser-only APIs during SSR.
Guard client-only logic using process.client or client-only.
Ensure data required for rendering is available during SSR.

State Management
Use Pinia as the only global state management solution.
Stores must be SSR-safe and not rely on browser-only APIs.
Store authentication, user/session data, and shared UI state in Pinia.
Do not store temporary or one-time fetched data in Pinia.
Stores must be modular and written in TypeScript with explicit typing.

Data Fetching
Use useAsyncData for SSR and SEO-critical data.
Use useFetch for client-side requests.
Always define keys and configure server, lazy, and watch options when needed.
Avoid duplicate requests by relying on Nuxt’s built-in caching and singleton behavior.
Do not use native fetch directly inside components.
Ensure all SSR data fetching is deterministic and repeatable.
API logic must live in server/api and be accessed via composables.

Rendering
Use hybrid rendering strategies.
SSR for SEO and public content.
SSG for landing and marketing pages.
CSR for dashboards and internal tools.
Explicitly disable SSR per page when not needed.
Wrap client-only libraries using client-only.

Performance
Optimize bundle size using dynamic imports and async components.
Use lazy hydration when applicable.
Prefer NuxtImg and NuxtLink over native elements.
Optimize for Core Web Vitals.
Do not register heavy libraries globally.

TypeScript and Code Quality
Use TypeScript across the entire project.
Avoid using any without justification.
Define strict types for API responses and data models.
Use middleware for authentication and access control.
Code must be readable, predictable, and testable.

Middleware and Security
Use middleware for authentication, guest-only routes, and role-based permissions.
Never trust client-side data.
All sensitive logic must run on the server.
Do not expose secrets or privileged logic to the client bundle.

Server and Backend
Use server/api as the backend layer.
Follow REST or minimal RPC principles.
Use Nitro features such as runtimeConfig and server middleware.
Do not duplicate business logic between client and server.

SEO
Use useHead or useSeoMeta on all public pages.
Ensure metadata is rendered during SSR.
Enable sitemap and robots configuration.
Each public page must include title, description, and canonical URL.

Components and UI
Components must be reusable and UI-focused.
Business logic must live in composables.
Prefer slots over deep prop drilling.
Do not couple business logic to presentation components.

Error Handling
Use createError and Nuxt error boundaries.
Handle SSR and client errors explicitly.
Do not silently swallow errors.
Server errors must be logged.
Client errors must be displayed in a user-friendly manner.

AI Agent Behavior
Always assume SSR-first execution.
Do not suggest deprecated solutions such as Vuex or Options API.
Prefer composables over inline logic.
Avoid browser-only APIs without guards.
Explain reasoning when generating solutions.
Proactively suggest improvements and optimizations.
Think and act as a senior Nuxt developer.

Prohibited Practices
Do not fetch core data in mounted.
Do not introduce global side effects.
Do not mix architectural layers.