# Shared Expense Management Application

A production-ready solution for managing shared expenses within groups, featuring robust audit trails, dynamic membership handling, and multi-currency support.

## Overview
This application helps groups of users track shared expenses, calculate balances, and settle debts. It is designed with correctness, traceability, and auditability as core principles, ensuring every financial transaction is transparent and reversible.

## Key Features
- User authentication and authorization
- Group creation and management with dynamic membership (users can join/leave)
- Expense tracking with multiple split types (equal, percentage, exact, unequal)
- CSV import with comprehensive anomaly detection and manual approval
- Balance calculation that respects membership periods
- Debt settlement recording
- Multi-currency support with explicit exchange rates
- Complete audit trail for all changes
- Anomaly reporting and resolution workflow

## Documentation
- [Product Requirements](PRODUCT_REQUIREMENTS.md)
- [Scope](SCOPE.md)
- [User Stories](USER_STORIES.md)
- [Architecture Decisions](ARCHITECTURE_DECISION_RECORD.md)
- [API Requirements](API_REQUIREMENTS.md)
- [Domain Model](DOMAIN_MODEL.md)
- [Entity Relationship Diagram](ERD.md)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database connection details and JWT secret
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at http://localhost:3000/api/v1

### API Documentation
Once the server is running, you can access the API endpoints:
- Authentication: `/api/v1/auth/*`
- Users: `/api/v1/users/*`
- Groups: `/api/v1/groups/*`
- Expenses: `/api/v1/groups/:groupId/expenses/*`
- Import: `/api/v1/import/*`
- Balances: `/api/v1/balances/*`
- Settlements: `/api/v1/groups/:groupId/settlements/*`
- Exchange Rates: `/api/v1/exchange-rates/*`
- Audit: `/api/v1/audit/*`

### Testing
Run the test suite:
```bash
npm test
```

### Production Deployment
For production deployment, see the DEPLOYMENT.md file.

## License
[To be determined]

## Acknowledgments
Built as part of a software engineering internship assignment.