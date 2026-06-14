# Architecture Decision Record

## ADR-001: Technology Stack Selection
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to choose a technology stack for building the Shared Expense Management Application that meets requirements for correctness, traceability, and maintainability.

### Decision
We will use:
- **Frontend:** React with TypeScript and Next.js
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Vercel (frontend) and Railway (backend/database)

### Consequences
**Positive:**
- TypeScript provides static typing for improved correctness and maintainability
- Next.js offers server-side rendering, routing, and API routes in one framework
- Express.js is minimal, flexible, and well-understood
- PostgreSQL is a robust, open-source relational database with strong ACID compliance
- Prisma provides type-safe database access and migrations
- JWT is a standard, stateless authentication mechanism suitable for SPA
- Vercel and Railway offer easy deployment, scaling, and free tiers for development

**Negative:**
- Learning curve for team members unfamiliar with TypeScript or Next.js
- Potential cold starts on Vercel/Railway (mitigated by caching)
- Prisma abstraction may limit complex SQL optimization options
- JWT token revocation requires additional complexity (we'll use short expiration + refresh tokens)

### Alternatives Considered
1. **Django (Python) + React:** Rejected because we want to leverage JavaScript/TypeScript expertise and avoid context switching between languages.
2. **Ruby on Rails:** Rejected due to opinionated nature that might conflict with specific requirements like complex split types.
3. **Spring Boot (Java):** Rejected due to heavier weight and longer development cycle for this scope.
4. **MongoDB:** Rejected because relational structure is clearer for financial data and ACID transactions are crucial.
5. **Session-based authentication:** Rejected because JWT is more suitable for distributed systems and avoids server-side session storage.

### Related Requirements
- NFR-5.1: Maintainability (TypeScript, Prisma)
- NFR-3.1: Security (JWT with proper handling)
- NFR-1.1: Performance (Next.js optimization, PostgreSQL indexing)
- NFR-9.1: Portability (containerizable stack)

## ADR-002: Database Design Approach
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to design a relational database schema that accurately represents shared expenses with dynamic membership and supports all required features.

### Decision
We will use a normalized relational schema with the following key tables:
- users
- groups
- group_memberships (to track membership over time)
- expenses
- expense_participants (for flexible split types)
- settlements
- exchange_rates
- import_batches, imported_expenses, imported_anomalies (for import audit trail)
- audit_log (for comprehensive traceability)

### Consequences
**Positive:**
- Accurately models complex domain (membership periods, split types)
- Supports efficient querying with proper indexing
- Enforces data integrity through foreign keys and constraints
- Provides clear audit trail for all changes
- Scales vertically well for expected load
- Aligns with relational database constraint from assignment

**Negative:**
- More complex queries than a denormalized approach
- Requires careful transaction management for related operations
- May require joins for balance calculations (mitigated by indexing and caching)

### Alternatives Considered
1. **Single-table design with JSON blob for splits:** Rejected because it would make querying and validation difficult, and violate normalization principles.
2. **NoSQL document database:** Rejected because ACID transactions and relational integrity are important for financial data.
3. **Event-sourcing:** Rejected because it adds complexity beyond the scope requirements; we need current state queries more than event history.
4. **Hybrid approach (some tables NoSQL):** Rejected because it increases architectural complexity without clear benefit for this domain.

### Related Requirements
- Functional Requirement: Dynamic group membership
- Functional Requirement: Multiple split types
- Functional Requirement: Currency conversion
- Functional Requirement: Import with audit trail
- Non-Functional Requirement: Data Integrity
- Non-Functional Requirement: Auditability

## ADR-003: Authentication Mechanism
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to choose an authentication mechanism that secures user data while providing a good user experience.

### Decision
We will implement JWT-based authentication with:
- Access tokens (short-lived: 15-30 minutes)
- Refresh tokens (longer-lived: 7 days, stored HTTP-only cookies)
- Password hashing using bcrypt (cost factor 12)
- HTTPS enforcement in production

### Consequences
**Positive:**
- Stateless authentication reduces server memory usage
- Tokens can be invalidated via refresh token rotation or blacklisting on logout
- Standard approach with many libraries and best practices
- Separation of concerns: frontend handles token storage, backend validates
- Refresh token rotation mitigates XSS risks

**Negative:**
- Token theft requires short access token lifetime to limit damage
- Refresh token storage requires secure handling (HTTP-only cookies)
- Added complexity of token refresh logic
- Need to handle token expiration gracefully on frontend

### Alternatives Considered
1. **Session-based authentication (server-side sessions):** Rejected because it doesn't scale well horizontally and requires shared session storage.
2. **OAuth 2.0 / OpenID Connect:** Rejected because it's overkill for this application; we don't need third-party auth.
3. **API keys:** Rejected because they're unsuitable for user authentication and lack fine-grained expiration.
4. **GraphQL with JWT:** We're using REST, so this doesn't apply.

### Related Requirements
- NFR-3.1: Security (password hashing, token handling)
- NFR-3.4: Security (JWT implementation)
- NFR-4.6: Reliability (stateless auth enables easy scaling)
- NFR-5.1: Maintainability (standard approach)

## ADR-004: State Management Approach
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to decide how to manage state in the React frontend application.

### Decision
We will use:
- React Query (TanStack Query) for server state management (caching, background updates)
- React Context API combined with useReducer for global client state (auth, UI state)
- Local component state for ephemeral UI state

### Consequences
**Positive:**
- React Query provides excellent caching, deduplication, and background updates
- Reduces boilerplate compared to Redux
- Automatic garbage collection of unused data
- Built-in loading and error states
- Context API is built into React and sufficient for our limited global state needs
- Clear separation between server and client state

**Negative:**
- Learning curve for team members unfamiliar with React Query
- Potential over-fetching if query keys not designed carefully
- Context API can cause re-renders if not split properly (we'll split contexts)

### Alternatives Considered
1. **Redux Toolkit:** Rejected because React Query + Context provides sufficient functionality with less boilerplate for our needs.
2. **MobX:** Rejected because it's less predictable than explicit state updates.
3. **Jotai or Recoil:** Rejected because React Query is more suitable for our data fetching needs.
4. **useState only:** Rejected because it doesn't scale well for complex applications with shared state.

### Related Requirements
- NFR-6.1: Usability (responsive UI with good loading states)
- NFR-1.1: Performance (efficient data fetching and caching)
- NFR-5.1: Maintainability (clear separation of concerns)

## ADR-005: Balance Calculation Strategy
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to implement a balance calculation engine that accurately computes user balances considering membership periods, split types, settlements, and currency conversion.

### Decision
We will implement a service-based balance calculator that:
1. Retrieves all expenses for a group within a date range
2. For each expense, determines which users were active members on the expense date
3. Calculates each participant's share based on split type and membership
4. Converts all amounts to group currency using appropriate exchange rates
5. Subtracts settlement amounts (converted to group currency)
6. Returns net balances with optional breakdown by expense

The calculation will be performed on-demand with caching of recent results. For large groups, we'll use pagination and incremental calculation where possible.

### Consequences
**Positive:**
- Mathematically accurate and auditable
- Handles all split types and membership scenarios
- Currency conversion is explicit and traceable
- Can be unit tested with various scenarios
- Breakdown feature satisfies Rohan's transparency requirement
- Settlements are properly separated from expenses

**Negative:**
- Computationally expensive for large groups with many expenses
- Requires careful caching strategy to avoid stale data
- Complexity in handling edge cases (timezones, historical rates)

### Alternatives Considered
1. **Pre-computed balances updated on every transaction:** Rejected because it would be complex to maintain correctly with membership changes and would still require recalculation for historical views.
2. **Database views with complex SQL:** Rejected because it would be difficult to maintain and test, and less flexible for currency conversion.
3. **MapReduce or batch processing:** Rejected because it adds latency and complexity; we need real-time balance queries.
4. **CQRS with read models:** Rejected because it's overkill for this application scale.

### Related Requirements
- Functional Requirement: Balance calculation engine
- Functional Requirement: Membership periods affect balances
- Functional Requirement: Currency conversion
- Functional Requirement: Settlements not treated as expenses
- User Requirement: Rohan's transparency (breakdown)
- User Requirement: Aisha's final numbers
- User Requirement: Sam's mid-period joining
- Non-Functional Requirement: Explainability
- Non-Functional Requirement: Auditability

## ADR-006: Import Anomaly Handling
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to design an import process that detects anomalies in CSV data without silently modifying data, as required by Meera's requirement and engineering principles.

### Decision
We will implement an import pipeline that:
1. Parses CSV rows into raw data objects
2. Validates each row for basic format (required fields, data types)
3. Runs anomaly detection plugins for each row
4. Presents all detected anomalies to the user before import
5. Requires explicit user action for each anomaly (approve suggestion, manual correction, skip row)
6. Preserves original CSV data in imported_expenses table
7. Creates audit trail for import batch, anomalies, and resolutions
8. Only imports rows that have been explicitly approved

### Consequences
**Positive:**
- Never silently modifies imported data (Meera's requirement)
- Every anomaly is detected, surfaced, logged, and has an action recorded (Engineering Principle)
- Complete audit trail of original data and decisions
- User maintains full control over data quality
- Extensible plugin system for anomaly detection
- Import reporting shows exactly what was changed

**Negative:**
- Import process requires user interaction (not fully automated)
- More complex than a simple validation-and-import approach
- Requires storage of raw CSV data
- Potential for user fatigue with many anomalies

### Alternatives Considered
1. **Automatic correction with logging:** Rejected because it still modifies data without explicit user approval per row.
2. **Two-step import (validate then import):** Rejected because it doesn't prevent silent modifications if validation passes incorrectly.
3. **Import all and flag anomalies afterward:** Rejected because it violates the principle of never silently modifying data.
4. **Manual preprocessing outside system:** Rejected because it moves the burden to user and loses audit trail.

### Related Requirements
- Engineering Principle: Never silently modify imported data
- Engineering Principle: Every anomaly must be detected, surfaced, logged, and have an action recorded
- User Requirement: Meera's duplicate detection with approval
- Functional Requirement: Import expenses_export.csv exactly as provided
- Functional Requirement: Generate anomaly reports
- Non-Functional Requirement: Auditability
- Non-Functional Requirement: Data Integrity

## ADR-007: Deployment Architecture
**Status:** Accepted
**Date:** 2026-06-15

### Context
We need to decide how to deploy the application for development, testing, and production.

### Decision
We will use a decoupled deployment approach:
- **Frontend:** Deployed to Vercel (Next.js optimized platform)
- **Backend:** Deployed to Railway (Node.js, PostgreSQL hosting)
- **Environment Variables:** Managed through platform-specific UI
- **Database:** PostgreSQL provided by Railway
- **CI/CD:** GitHub Actions for testing, automatic deployment on push to main

### Consequences
**Positive:**
- Vercel optimizes Next.js applications with automatic SSL, CDN, and edge caching
- Railway provides easy PostgreSQL hosting with backups and scaling
- Separation of concerns allows independent scaling
- Platform handles infrastructure management (OS, patching, etc.)
- Preview deployments on Vercel for pull requests
- Simple to set up and maintain for small team

**Negative:**
- Vendor lock-in to specific platforms (though both support easy migration)
- Less control over server configuration than self-hosted
- Potential latency between frontend and backend if regions differ (we'll co-locate)
- Dependency on platform uptime and pricing changes

### Alternatives Considered
1. **Docker Compose on single server:** Rejected because it doesn't scale well and requires more DevOps effort.
2. **AWS (ECS/EKS + RDS):** Rejected because it's overkill for this scope and increases complexity.
3. **Heroku:** Rejected because Rails-based and less optimal for Node.js/Next.js.
4. **Self-managed Kubernetes:** Rejected because it's excessive complexity for this application.
5. **Netlify (frontend) + Render (backend):** Considered but chose Vercel/Railway for specific Next.js and PostgreSQL optimizations.

### Related Requirements
- NFR-9.1: Portability (containerizable, though we're using PaaS)
- NFR-4.1: Reliability (platform manages uptime)
- NFR-1.1: Performance (Vercel/CDN optimizations)
- NFR-5.1: Maintainability (reduced infrastructure overhead)
- NFR-2.1: Scalability (platform handles basic scaling)
