# Domain Model

## Overview
The Shared Expense Management Application centers around users, groups, expenses, and settlements. The core concept is tracking financial obligations within groups where membership can change over time, and expenses must be accurately attributed based on membership periods.

## Core Entities

### 1. User
Represents an individual using the system.
**Attributes:**
- id (UUID): Unique identifier
- email (String): Unique email address for login
- name (String): Full name
- password_hash (String): Bcrypt hashed password
- created_at (Timestamp): Account creation time
- updated_at (Timestamp): Last profile update time
- is_active (Boolean): Account status

**Responsibilities:**
- Authenticate to the system
- Create and manage groups
- Participate in expenses
- Record settlements
- View balances and transaction history

### 2. Group
A collection of users who share expenses.
**Attributes:**
- id (UUID): Unique identifier
- name (String): Group name
- description (String): Optional description
- created_at (Timestamp): Group creation time
- updated_at (Timestamp): Last modification time
- created_by (UUID): Reference to User who created group
- currency (String): Default currency for the group (ISO 4217), e.g., "USD"

**Responsibilities:**
- Define a shared financial space
- Manage membership over time
- Host expenses and settlements
- Determine default currency for transactions

### 3. GroupMembership
Represents a user's period of membership in a group (to handle joins and leaves).
**Attributes:**
- id (UUID): Unique identifier
- group_id (UUID): Reference to Group
- user_id (UUID): Reference to User
- joined_at (Timestamp): When user joined the group
- left_at (Timestamp): When user left the group (NULL if currently active)
- created_at (Timestamp): Record creation time

**Constraints:**
- A user can have multiple membership records for the same group (non-overlapping periods)
- For any group, membership periods for a user must not overlap
- left_at must be after joined_at when not NULL

**Responsibilities:**
- Define when a user is considered a member for expense attribution
- Enable accurate balance calculations based on membership periods
- Track historical group composition

### 4. Expense
A financial transaction shared among group members.
**Attributes:**
- id (UUID): Unique identifier
- group_id (UUID): Reference to Group
- payer_id (UUID): Reference to User who paid the amount
- amount (Decimal): Total amount of the expense
- currency (String): Currency of the expense (ISO 4217)
- date (Timestamp): Date of the expense
- description (String): Description of the expense
- split_type (Enum): Type of split (EQUAL, PERCENTAGE, EXACT, UNEQUAL)
- created_at (Timestamp): When expense was recorded
- created_by (UUID): Reference to User who created the expense
- exchange_rate (Decimal): Rate to convert to group currency (if different), default 1.0

**Responsibilities:**
- Represent a shared cost
- Store split information via ExpenseParticipant
- Enable balance calculations based on splits and membership
- Track origin and modifications through audit trail

### 5. ExpenseParticipant
Defines how an expense is split among participants.
**Attributes:**
- id (UUID): Unique identifier
- expense_id (UUID): Reference to Expense
- user_id (UUID): Reference to User who participates
- percentage (Decimal): Percentage of expense (for PERCENTAGE split), NULL otherwise
- amount (Decimal): Exact amount owed (for EXACT split), NULL otherwise
- notes (String): Optional notes about this participant's share

**Constraints:**
- For EQUAL split: percentage and amount are NULL, share calculated as 1/N
- For PERCENTAGE split: percentage must be provided, amount is NULL
- For EXACT split: amount must be provided, percentage is NULL
- For UNEQUAL split: either percentage or amount must be provided (consistent with split_type)
- Sum of all participants' shares must equal expense amount (within rounding tolerance)

**Responsibilities:**
- Define each user's share of an expense
- Enable flexible split types
- Support validation of split correctness

### 6. Settlement
Records a debt repayment between two users.
**Attributes:**
- id (UUID): Unique identifier
- group_id (UUID): Reference to Group
- from_user_id (UUID): Reference to User paying the settlement
- to_user_id (UUID): Reference to User receiving the settlement
- amount (Decimal): Settlement amount
- currency (String): Currency of settlement (ISO 4217)
- date (Timestamp): Date of settlement
- description (String): Optional description
- created_at (Timestamp): When settlement was recorded
- created_by (UUID): Reference to User who recorded settlement
- exchange_rate (Decimal): Rate to convert to group currency (if different), default 1.0

**Responsibilities:**
- Record debt repayment
- Adjust user balances accordingly
- Be distinguished from expenses in balance calculations
- Track financial flow between users

### 7. ExchangeRate
Stores currency conversion rates for historical accuracy.
**Attributes:**
- id (UUID): Unique identifier
- from_currency (String): Source currency (ISO 4217)
- to_currency (String): Target currency (ISO 4217)
- rate (Decimal): Conversion rate (1 unit of from_currency = rate units of to_currency)
- date (Timestamp): Date when this rate was effective
- source (String): Source of the rate (e.g., "ECB", "Manual")

**Responsibilities:**
- Enable accurate currency conversion for expenses and settlements
- Support historical rate lookups
- Provide audit trail for conversion rates used

### 8. ImportBatch
Tracks a CSV import operation and its results.
**Attributes:**
- id (UUID): Unique identifier
- user_id (UUID): Reference to User who initiated import
- started_at (Timestamp): Import start time
- completed_at (Timestamp): Import completion time
- status (Enum): PENDING, PROCESSING, COMPLETED, FAILED
- row_count (Integer): Total rows in CSV
- imported_count (Integer): Successfully imported expenses
- anomaly_count (Integer): Number of anomalies detected
- metadata (JSON): Additional information (filename, etc.)

**Responsibilities:**
- Group import operations for reporting
- Track import progress and outcomes
- Link to ImportedExpense and ImportAnomaly records

### 9. ImportedExpense
Presents the original CSV data for an imported expense (for audit trail).
**Attributes:**
- id (UUID): Unique identifier
- import_batch_id (UUID): Reference to ImportBatch
- raw_data (JSON): Original CSV row as key-value pairs
- expense_id (UUID): Reference to Expense created (if imported)
- status (Enum): PENDING, IMPORTED, SKIPPED, MODIFIED
- anomaly_ids (Array of UUID): References to ImportedAnomaly for this row

**Responsibilities:**
- Preserve original imported data
- Link to created expense or indicate why not imported
- Track anomalies associated with the row

### 10. ImportedAnomaly
Represents an anomaly detected during CSV import.
**Attributes:**
- id (UUID): Unique identifier
- import_batch_id (UUID): Reference to ImportBatch
- imported_expense_id (UUID): Reference to ImportedExpense
- anomaly_type (String): Type of anomaly (from predefined list)
- severity (Enum): LOW, MEDIUM, HIGH, CRITICAL
- description (String): Detailed explanation of the anomaly
- detection_logic (String): How the anomaly was detected
- suggested_resolution (String): System-suggested way to resolve
- user_resolution (String): What the user decided to do (APPROVE_SUGGESTED, MANUAL_CORRECTION, SKIP_ROW, etc.)
- manual_correction_data (JSON): If user provided corrected data
- created_at (Timestamp): When anomaly was detected
- resolved_at (Timestamp): When user made decision
- resolved_by (UUID): Reference to User who resolved

**Responsibilities:**
- Document each anomaly found
- Track resolution decisions
- Ensure no silent modifications to imported data

### 11. AuditLog
Generic audit trail for system changes.
**Attributes:**
- id (UUID): Unique identifier
- user_id (UUID): Reference to User who performed action (if applicable)
- action (String): Type of action (CREATE, UPDATE, DELETE, LOGIN, etc.)
- entity_type (String): Type of entity affected (USER, GROUP, EXPENSE, etc.)
- entity_id (UUID): Reference to the entity
- changes (JSON): Details of what changed (for UPDATE) or copy of entity (for CREATE/DELETE)
- ip_address (String): Origin IP address
- user_agent (String): Client user agent
- created_at (Timestamp): When action occurred

**Responsibilities:**
- Provide immutable audit trail
- Support forensic analysis
- Enable compliance reporting

## Relationships Summary
- User 1..* GroupMembership (a user can have multiple memberships over time)
- Group 1..* GroupMembership (a group has multiple membership records)
- User 1..* Expense (as payer)
- User 1..* ExpenseParticipant (as participant)
- Expense 1..* ExpenseParticipant (an expense has multiple participants)
- Group 1..* Expense (a group contains multiple expenses)
- Group 1..* Settlement (a group contains multiple settlements)
- User 1..* Settlement (as from_user or to_user)
- User 1..* ImportBatch (a user can perform multiple imports)
- ImportBatch 1..* ImportedExpense (an import batch processes multiple rows)
- ImportedExpense 0..1 Expense (if successfully imported)
- ImportedExpense 0..* ImportedAnomaly (a row can have multiple anomalies)
- ImportedAnomaly 0..1 ImportedExpense (each anomaly belongs to a row)
- ExchangeRate 1..* Expense (for conversion)
- ExchangeRate 1..* Settlement (for conversion)
- User 1..* AuditLog (a user can perform multiple actions)
- * 1..* AuditLog (any entity can be audited)

## Value Objects
- Money: Amount + Currency
- DateRange: Start + End dates (for membership periods)
- SplitSpecification: Defines how an expense is split (based on split_type)

## Key Domain Constraints
1. An expense can only be created for users who are group members on the expense date (via GroupMembership)
2. A user's balance in a group is only affected by expenses during their membership periods
3. Settlements must not be treated as expenses in balance calculations
4. Every imported row must be preserved in original form with audit trail
5. Currency conversion must use explicit rates (provided or looked up by date)
6. Membership periods for a user in a group cannot overlap
7. Split shares must sum to the total expense amount (within rounding tolerance)

## Design Rationale
- Separated GroupMembership from User and Group to accurately model changing membership over time
- Used ExpenseParticipant to enable flexible split types without complicating the Expense entity
- Created ImportedExpense and ImportedAnomaly to strictly enforce no silent modification of imported data
- Added ExchangeRate entity to handle currency conversion with historical accuracy
- Designed Settlement as distinct from Expense to prevent conflating debt repayment with shared costs
- Included comprehensive AuditLog for full traceability as required by Rohan's transparency requirement