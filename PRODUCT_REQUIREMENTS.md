# Product Requirements Document

## 1. Introduction
This document outlines the requirements for a Shared Expense Management Application designed to help groups of users manage shared expenses, track balances, and settle debts.

## 2. Product Vision
To provide a transparent, auditable, and flexible system for managing group expenses that adapts to changing membership and supports multiple currencies while ensuring every transaction is traceable and every user's balance is accurate based on their membership period.

## 3. Core Features
1. User authentication and authorization
2. Group creation and management
3. Dynamic group membership (users can join/leave groups)
4. Expense creation with various split types (equal, percentage, exact, unequal)
5. Expense import from CSV with anomaly detection
6. Balance calculation per user and per group
7. Debt settlement recording
8. Currency conversion (with explicit rates)
9. Comprehensive audit trail for all changes
10. Anomaly reporting and manual approval workflow

## 4. User Requirements (from stakeholders)
- Aisha: Wants one final number per person - who pays whom and how much.
- Rohan: Requires full transparency - every balance must be traceable to underlying expenses.
- Priya: Needs support for multiple currencies (CSV contains USD expenses).
- Sam: Joined mid-April - expenses before joining should not affect him.
- Meera: Requires duplicate detection but never auto-delete silently - must approve modifications.

## 5. Scope
### In Scope
- Web application with REST API
- PostgreSQL database
- User authentication via JWT
- Expense tracking with multiple split types
- Group management with membership history
- Currency handling (primarily USD in CSV, but system designed for multi-currency)
- Anomaly detection during import
- Balance calculation engine
- Settlement tracking
- Audit logging
- CSV import functionality
- Reporting of anomalies

### Out of Scope
- Mobile applications (initial focus on web)
- Real-time collaboration features (like live updates)
- Advanced financial forecasting
- Integration with payment gateways (for actual money transfer)
- Multi-language support (initial English only)
- Complex tax calculations

## 6. Success Metrics
- All imported expenses from CSV are processed with audit trail
- Zero silent modifications to imported data
- 100% traceability of balances to source expenses
- Accurate balance calculations considering membership periods
- User satisfaction with transparency and control over data modifications

## 7. Assumptions
- Users will primarily use USD for expenses (as per CSV)
- Exchange rates will be provided externally when needed for multi-currency
- Groups will be relatively small (<100 members) for performance
- Expense frequency is moderate (not high-frequency trading)
- Users will actively review and approve anomaly resolutions

## 8. Constraints
- Relational database only (PostgreSQL)
- No silent modification of imported data
- Every anomaly must be detected, surfaced, logged, and have an action recorded
- Membership periods must affect balance calculations
- Currency conversion must be explicit
- Settlement transactions must not be treated as expenses
- System must be correct, traceable, explainable, and auditable

## 9. Open Questions
1. What time zone should be used for timestamps?
2. Should we support recurring expenses?
3. What level of detail is required in the audit log (field-level changes)?
4. How should we handle foreign currency exchange rate fluctuations?
5. What is the expected scale of data (number of users, groups, expenses)?