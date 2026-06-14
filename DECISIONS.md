# Major Decisions

This document records the major decisions made during the planning of the Shared Expense Management Application, including alternatives considered and the rationale for each choice.

## 1. Technology Stack

**Decision:** Use React with TypeScript and Next.js for frontend, Node.js with Express.js for backend, PostgreSQL for database, Prisma for ORM, JWT for authentication, and deploy to Vercel (frontend) and Railway (backend).

**Alternatives Considered:**
- Django (Python) + React: Rejected to avoid language context switching and leverage JavaScript expertise.
- Ruby on Rails: Rejected due to opinionated nature conflicting with specific requirements.
- Spring Boot (Java): Rejected due to heavier weight and longer development cycle.
- MongoDB: Rejected because relational structure is clearer for financial data and ACID transactions are crucial.
- Session-based authentication: Rejected because JWT is more suitable for distributed systems.

**Why Chosen:**
- TypeScript provides static typing for correctness and maintainability
- Next.js offers SSR, routing, and API routes in one framework
- Express.js is minimal, flexible, and well-understood
- PostgreSQL provides strong ACID compliance for financial data
- Prisma offers type-safe database access and migrations
- JWT is a standard, stateless authentication mechanism
- Vercel and Railway provide easy deployment, scaling, and free tiers

## 2. Database Design Approach

**Decision:** Use a normalized relational schema with tables for users, groups, group_memberships (to track membership over time), expenses, expense_participants (for flexible split types), settlements, exchange_rates, and audit tables for import and changes.

**Alternatives Considered:**
- Single-table design with JSON blob for splits: Rejected because it would make querying and validation difficult.
- NoSQL document database: Rejected because ACID transactions and relational integrity are important.
- Event-sourcing: Rejected because it adds complexity beyond scope; current state queries are more important.
- Hybrid approach (some tables NoSQL): Rejected because it increases architectural complexity without clear benefit.

**Why Chosen:**
- Accurately models complex domain (membership periods, split types)
- Supports efficient querying with proper indexing
- Enforces data integrity through foreign keys and constraints
- Provides clear audit trail for all changes
- Scales vertically well for expected load
- Aligns with relational database constraint from assignment

## 3. Authentication Mechanism

**Decision:** Implement JWT-based authentication with short-lived access tokens (15-30 minutes) and longer-lived refresh tokens (7 days stored in HTTP-only cookies), using bcrypt for password hashing.

**Alternatives Considered:**
- Session-based authentication (server-side sessions): Rejected because it doesn't scale horizontally and requires shared session storage.
- OAuth 2.0 / OpenID Connect: Rejected because it's overkill; no need for third-party auth.
- API keys: Rejected because they're unsuitable for user authentication and lack fine-grained expiration.
- GraphQL with JWT: Not applicable as we're using REST.

**Why Chosen:**
- Stateless authentication reduces server memory usage
- Tokens can be invalidated via refresh token rotation or blacklisting
- Standard approach with many libraries and best practices
- Separation of concerns: frontend handles token storage, backend validates
- Refresh token rotation mitigates XSS risks

## 4. State Management Approach

**Decision:** Use React Query (TanStack Query) for server state management and React Context API with useReducer for global client state.

**Alternatives Considered:**
- Redux Toolkit: Rejected because React Query + Context provides sufficient functionality with less boilerplate.
- MobX: Rejected because it's less predictable than explicit state updates.
- Jotai or Recoil: Rejected because React Query is more suitable for data fetching needs.
- useState only: Rejected because it doesn't scale well for complex applications.

**Why Chosen:**
- React Query provides excellent caching, deduplication, and background updates
- Reduces boilerplate compared to Redux
- Automatic garbage collection of unused data
- Built-in loading and error states
- Context API is built into React and sufficient for limited global state needs
- Clear separation between server and client state

## 5. Balance Calculation Strategy

**Decision:** Implement a service-based balance calculator that processes expenses and settlements on-demand, considering membership periods, split types, currency conversion, and providing audit-ready breakdowns.

**Alternatives Considered:**
- Pre-computed balances updated on every transaction: Rejected because it's complex to maintain correctly with membership changes.
- Database views with complex SQL: Rejected because difficult to maintain, test, and less flexible for currency conversion.
- MapReduce or batch processing: Rejected because adds latency; need real-time balance queries.
- CQRS with read models: Rejected because overkill for this application scale.

**Why Chosen:**
- Mathematically accurate and auditable
- Handles all split types and membership scenarios
- Currency conversion is explicit and traceable
- Can be unit tested with various scenarios
- Breakdown feature satisfies transparency requirement
- Settlements are properly separated from expenses

## 6. Import Anomaly Handling

**Decision:** Implement an import pipeline that preserves original CSV data, detects anomalies via plugins, requires explicit user action for each anomaly, and maintains a complete audit trail.

**Alternatives Considered:**
- Automatic correction with logging: Rejected because it modifies data without explicit user approval per row.
- Two-step import (validate then import): Rejected because doesn't prevent silent modifications if validation passes incorrectly.
- Import all and flag anomalies afterward: Rejected because violates principle of never silently modifying data.
- Manual preprocessing outside system: Rejected because moves burden to user and loses audit trail.

**Why Chosen:**
- Never silently modifies imported data (Meera's requirement)
- Every anomaly is detected, surfaced, logged, and has an action recorded (Engineering Principle)
- Complete audit trail of original data and decisions
- User maintains full control over data quality
- Extensible plugin system for anomaly detection
- Import reporting shows exactly what was changed

## 7. Deployment Architecture

**Decision:** Use a decoupled deployment with frontend on Vercel (Next.js optimized) and backend on Railway (Node.js, PostgreSQL hosting).

**Alternatives Considered:**
- Docker Compose on single server: Rejected because it doesn't scale well and requires more DevOps effort.
- AWS (ECS/EKS + RDS): Rejected because overkill for scope and increases complexity.
- Heroku: Rejected because Rails-based and less optimal for Node.js/Next.js.
- Self-managed Kubernetes: Rejected because excessive complexity for this application.
- Netlify (frontend) + Render (backend): Considered but chose Vercel/Railway for specific Next.js and PostgreSQL optimizations.

**Why Chosen:**
- Vercel optimizes Next.js applications with automatic SSL, CDN, and edge caching
- Railway provides easy PostgreSQL hosting with backups and scaling
- Separation of concerns allows independent scaling
- Platform handles infrastructure management (OS, patching, etc.)
- Preview deployments on Vercel for pull requests
- Simple to set up and maintain for small team

## 8. Anomaly Detection Framework

**Decision:** Create an extensible anomaly detection framework with predefined anomaly types (duplicate, near duplicate, currency mismatch, invalid amount, negative amount, missing payer, missing participant, settlement as expense, invalid date, future date, member not active, split mismatch, total mismatch, orphan user, unknown currency, invalid group, rounding issue) and the ability to add new types.

**Why Chosen:**
- Ensures comprehensive coverage of potential data issues
- Allows systematic handling of each anomaly type
- Provides consistent user experience for anomaly resolution
- Facilitates reporting and audit trail generation
- Can be extended as new anomaly types are discovered during CSV analysis
