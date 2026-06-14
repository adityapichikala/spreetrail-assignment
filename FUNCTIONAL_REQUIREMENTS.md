# Functional Requirements

## 1. User Management
### 1.1 Authentication
- FR-1.1.1: System shall allow user registration with email and secure password
- FR-1.1.2: System shall authenticate users via email and password
- FR-1.1.3: System shall issue JWT tokens upon successful authentication
- FR-1.1.4: System shall validate JWT tokens for protected endpoints
- FR-1.1.5: System shall allow token refresh
- FR-1.1.6: System shall support logout by token invalidation

### 1.2 User Profile
- FR-1.2.1: System shall store user profile information (name, email, etc.)
- FR-1.2.2: System shall allow users to update their profile information
- FR-1.2.3: System shall prevent duplicate email addresses

## 2. Group Management
### 2.1 Group Lifecycle
- FR-2.1.1: System shall allow authenticated users to create groups
- FR-2.1.2: System shall store group name, description, and creation timestamp
- FR-2.1.3: System shall allow users to view groups they belong to
- FR-2.1.4: System shall allow group creators to update group name and description
- FR-2.1.5: System shall allow group deletion only when no expenses exist in the group

### 2.2 Membership Management
- FR-2.2.1: System shall track membership with join timestamp and optional leave timestamp
- FR-2.2.2: System shall allow adding users to groups (with invitation acceptance)
- FR-2.2.3: System shall allow removing users from groups (recording leave timestamp)
- FR-2.2.4: System shall prevent removing users who have unresolved expenses or settlements
- FR-2.2.5: System shall provide membership history view showing periods of membership

## 3. Expense Management
### 3.1 Expense Creation
- FR-3.1.1: System shall allow recording expenses with:
  - Payer (user ID)
  - Amount (decimal)
  - Currency (ISO 4217 code)
  - Date (timestamp)
  - Description (text)
  - Split type (equal, percentage, exact, unequal)
  - Participant list with split specifications
- FR-3.1.2: System shall validate that payer is a group member on expense date
- FR-3.1.3: System shall validate that all participants are group members on expense date
- FR-3.1.4: System shall validate split specifications based on split type:
  - Equal: no additional data needed
  - Percentage: percentages must sum to 100%
  - Exact: amounts must sum to total expense amount
  - Unequal: amounts or percentages must be provided and sum appropriately
- FR-3.1.5: System shall store currency exchange rate used if conversion applied

### 3.2 Expense Modification
- FR-3.2.1: System shall allow editing of expenses by their creator within time limits
- FR-3.2.2: System shall prohibit modification of imported expenses without creating an audit trail version
- FR-3.2.3: System shall log all modifications to expenses with user and timestamp

### 3.3 Expense Deletion
- FR-3.3.1: System shall allow deletion of expenses by their creator
- FR-3.2.2: System shall prevent deletion if expense has associated settlements
- FR-3.3.3: System shall log deletion events

### 3.4 Expense Import
- FR-3.4.1: System shall support importing expenses from CSV format
- FR-3.4.2: System shall parse CSV rows into expense objects
- FR-3.4.3: System shall validate each imported row for basic validity
- FR-3.4.4: System shall detect anomalies in imported data
- FR-3.4.5: System shall require user approval for each anomaly resolution before importing
- FR-3.4.6: System shall maintain audit trail of import batches and decisions
- FR-3.4.7: System shall preserve original CSV data in import records

### 3.5 Expense Retrieval
- FR-3.5.1: System shall allow retrieving expenses by group with pagination
- FR-3.5.2: System shall allow retrieving single expense by ID with full details
- FR-3.5.3: System shall allow filtering expenses by date range, payer, or participants

## 4. Balance Calculation
### 4.1 Balance Engine
- FR-4.1.1: System shall calculate user balances in a group considering:
  - All expenses where user is participant or payer
  - Membership periods (user only responsible for expenses during their membership)
  - Split types (equal, percentage, exact, unequal)
  - Currency conversion to group currency
  - Settlements (reduce what user owes or is owed)
- FR-4.1.2: System shall provide balance breakdown traceable to individual expenses
- FR-4.1.3: System shall calculate net balance (positive = owed to user, negative = user owes)
- FR-4.1.4: System shall handle multiple currencies within same group using appropriate exchange rates

### 4.2 Settlement Tracking
- FR-4.2.1: System shall allow recording settlements between users in a group
- FR-4.2.2: System shall store settlement amount, currency, date, from-user, to-user
- FR-4.2.3: System shall validate that settlement currency matches group currency or provide conversion
- FR-4.2.4: System shall ensure settlements are not treated as expenses in balance calculation
- FR-4.2.5: System shall update user balances based on settlements
- FR-4.2.5: System shall maintain settlement history

## 5. Currency Handling
- FR-5.1: System shall support multiple currencies using ISO 4217 codes
- FR-5.2: System shall store exchange rates with timestamp and source
- FR-5.3: System shall convert amounts to group currency for balance calculations using appropriate rates
- FR-5.4: System shall display amounts in both original and group currency when different
- FR-5.5: System shall require explicit exchange rates for conversions (no automatic fetching)

## 6. Audit and Anomaly Management
### 6.1 Audit Trail
- FR-6.1.1: System shall log all create, update, delete operations on:
  - Users (profile changes)
  - Groups (creation, updates, deletion)
  - Memberships (join, leave)
  - Expenses (creation, modification, deletion)
  - Settlements (creation, modification, deletion)
- FR-6.1.2: Audit log shall include: user ID, action, timestamp, object ID, changes made
- FR-6.1.3: System shall prevent tampering with audit logs

### 6.2 Anomaly Detection
- FR-6.2.1: System shall detect anomalies during CSV import as defined in SCOPE.md
- FR-6.2.2: For each anomaly, system shall provide:
  - Anomaly type and severity
  - Detection logic explanation
  - User-facing description
  - Recommended action
  - Required audit log entry
- FR-6.2.3: System shall require explicit user approval for each anomaly resolution
- FR-6.2.4: System shall log anomaly detection and resolution decisions
- FR-6.2.5: System shall never silently modify imported data

### 6.3 Reporting
- FR-6.3.1: System shall generate import reports summarizing:
  - Number of rows processed
  - Number of expenses imported
  - Number of anomalies detected by type
  - Actions taken on anomalies
  - Import batch identifier
- FR-6.3.2: System shall allow exporting import reports

## 7. Non-Functional Requirements (Functional Aspects)
- FR-7.1: System shall provide API endpoints for all frontend operations
- FR-7.2: System shall enforce authorization checks on all resources
- FR-7.3: System shall validate all input data according to business rules
- FR-7.4: System shall handle errors gracefully with informative messages
- FR-7.5: System shall log system events for monitoring and debugging