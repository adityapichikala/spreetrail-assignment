# Scope

## In Scope

### Core Functionality
- User authentication (registration, login, logout, token refresh)
- Group management (creation, listing, updating, deletion)
- Membership management (joining groups, leaving groups, membership history)
- Expense management (creation, listing, viewing, updating, deletion)
- Multiple split types: equal, percentage, exact, unequal
- Expense import from CSV with anomaly detection
- Balance calculation per user and per group
- Debt settlement recording and tracking
- Multi-currency support with explicit exchange rates
- Comprehensive audit logging for all changes
- Anomaly detection, reporting, and manual resolution workflow
- Balance breakdown for transparency (traceability to underlying expenses)
- Import reporting summarizing processed rows, anomalies, and actions

### Technical Components
- RESTful API with JSON payloads
- PostgreSQL database for relational data storage
- Node.js/Express.js backend
- React/TypeScript frontend with Next.js
- Prisma ORM for database access
- JWT-based authentication
- Docker containerization support
- GitHub Actions for CI/CD
- Deployment to Vercel (frontend) and Railway (backend/database)

### Non-Functional Aspects
- Performance targets: sub-2-second response times for typical operations
- Security: bcrypt password hashing, HTTPS, input validation, rate limiting
- Reliability: error handling, logging, basic monitoring
- Maintainability: TypeScript, modular code, documented APIs
- Auditability: immutable audit trail, change tracking
- Data Integrity: foreign key constraints, transactional operations

## Out of Scope

### Features
- Mobile applications (initial focus on web only)
- Real-time collaboration (live updates via WebSockets)
- Advanced financial forecasting or budgeting
- Integration with payment gateways for actual money transfer
- Multi-language support (internationalization/localization)
- Complex tax calculations or VAT handling
- Recurring expenses or scheduled transactions
- Expense categorization or tagging
- Group hierarchies or sub-groups
- Financial reporting beyond balances and settlements
- Investment tracking or shared asset management
- Chat or communication features within groups
- File attachments to expenses
- Expense reminders or notifications (beyond anomaly alerts)
- Budget setting or spending limits
- Expense approval workflows (beyond anomaly resolution)
- Social features (following users, activity feeds)

### Technical
- Microservices architecture (monolith initially)
- Server-side rendering for SEO (Next.js provides this but not primary focus)
- GraphQL API (REST focus)
- WebAssembly components
- Machine learning for anomaly detection (rule-based initially)
- Blockchain or distributed ledger technology
- Offline functionality or progressive web app features
- Multi-tenant architecture (single-tenant deployment)
- Advanced caching layers (Redis) beyond basic HTTP caching
- Event streaming platforms (Kafka) for real-time processing
- Search engine integration (Elasticsearch) for full-text search

### Constraints and Limitations
- Maximum group size: designed for up to 100 members (performance tested at this scale)
- Maximum expense history: designed for up to 10,000 expenses per group
- CSV import batch size: practical limit of 10,000 rows per import
- Supported currencies: ISO 4217 codes (no custom currencies)
- Date range: supports dates from 1900-01-01 to 2100-12-31
- Numerical precision: decimal amounts with 2 decimal places for currency
- Exchange rates: must be provided explicitly (no automatic fetching API)
- Settlement limits: no maximum settlement amount beyond decimal capacity
- Concurrent users: designed for up to 1,000 simultaneous active users

## Assumptions

### Data and Usage
- Primary currency for expenses is USD (as per provided CSV)
- Groups are typically small to medium-sized (2-50 members)
- Expense frequency is moderate (not high-frequency trading)
- Users will actively review and approve anomaly resolutions
- Exchange rates are provided externally when needed for multi-currency
- System time is synchronized via NTP or similar service
- Users access the application via modern web browsers

### Environmental
- Deployment environment supports Node.js 18+ and PostgreSQL 13+
- Sufficient network bandwidth for API communication
- Adequate storage capacity for database and backups
- Standard web security practices are followed (HTTPS, etc.)
- Platform as a service (Vercel/Railway) provides baseline reliability

### User Behavior
- Users will log out when finished on shared devices
- Users will keep their credentials secure
- Users will respond to anomaly notifications in a timely manner
- Users understand basic financial concepts (splits, balances, settlements)
- Users will provide accurate information during registration