# Acceptance Criteria

## 1. User Authentication
### 1.1 Registration
- AC-1.1.1: Given valid email and password, when registering, then account is created and confirmation email sent.
- AC-1.1.2: Given invalid email format, when registering, then error message is displayed.
- AC-1.1.3: Given password that doesn't meet complexity requirements, when registering, then error message is displayed.
- AC-1.1.4: Given email already registered, when registering, then error message indicating duplicate email.

### 1.2 Login
- AC-1.2.1: Given correct credentials, when logging in, then JWT token is issued and user is redirected to dashboard.
- AC-1.2.2: Given incorrect credentials, when logging in, then error message is displayed and login fails.
- AC-1.2.3: Given valid JWT token, when accessing protected endpoint, then request is authorized.
- AC-1.2.4: Given expired JWT token, when accessing protected endpoint, then 401 Unauthorized is returned.

## 2. Group Management
### 2.1 Group Creation
- AC-2.1.1: Given authenticated user, when creating group with valid name, then group is created and user is added as first member.
- AC-2.1.2: Given group name exceeding length limit, when creating group, then validation error is shown.
- AC-2.1.3: Given unauthenticated user, when attempting to create group, then redirect to login.

### 2.2 Membership
- AC-2.2.1: Given group member, when inviting valid user by email, then invitation is sent and pending until acceptance.
- AC-2.2.2: Given invited user accepts invitation, when they log in, then they are added to group with current timestamp as join date.
- AC-2.2.3: Given group member, when removing another member, then removal is recorded with leave timestamp and user no longer sees group expenses after that date.
- AC-2.2.4: Given user leaving group, when they attempt to create expense in group after leave date, then error is shown indicating they are not a member.

## 3. Expense Management
### 3.1 Expense Creation
- AC-3.1.1: Given group member, when creating expense with valid payer, amount, date, and split type, then expense is stored and balances updated accordingly.
- AC-3.1.2: Given expense with percentage splits summing to 99%, when saving, then validation error indicates percentages must sum to 100%.
- AC-3.1.3: Given expense with exact amounts summing to more than total, when saving, then validation error indicates amounts must equal total.
- AC-3.1.4: Given expense with future date, when saving, then warning is shown but expense is saved (to be caught by anomaly detection later if imported).
- AC-3.1.5: Given expense with payer not in group, when saving, then error is shown indicating payer must be group member.

### 3.2 Expense Import
- AC-3.2.1: Given valid CSV file with no anomalies, when importing, then all rows are imported as expenses and import report shows zero anomalies.
- AC-3.2.2: Given CSV with duplicate expense row, when importing, then duplicate is detected and user must approve resolution before import continues.
- AC-3.2.3: Given CSV with negative amount, when importing, then invalid amount anomaly is detected and user must approve resolution.
- AC-3.2.4: Given CSV where user is not member of group on expense date, when importing, then member not active anomaly is detected.
- AC-3.2.5: Given CSV with settlement marked as expense, when importing, then settlement recorded as expense anomaly is detected.
- AC-3.2.6: Given CSV import, when user approves all anomaly resolutions, then expenses are imported and audit log records import batch and decisions.
- AC-3.2.7: Given CSV import, when user rejects an anomaly resolution, then that row is skipped and not imported.

### 3.3 Expense Modification and Deletion
- AC-3.3.1: Given expense creator, when editing expense within allowed time, then changes are saved and audit log records modification.
- AC-3.3.2: Given non-creator, when attempting to edit expense, then authorization error is shown.
- AC-3.3.3: Given expense with no settlements, when deleting by creator, then expense is removed and audit log records deletion.
- AC-3.3.4: Given expense with settlements, when attempting to delete, then error is shown indicating expense cannot be deleted due to dependencies.

## 4. Balance Calculation
### 4.1 Basic Balance
- AC-4.1.1: Given group with two members and one expense of $100 split equally, when checking balances, then one member shows +$50 (owed) and other shows -$50 (owes).
- AC-4.1.2: Given group with three members and one expense of $120 split equally, when checking balances, then each member shows +$40 or -$40 appropriately.
- AC-4.1.3: Given expense with percentage splits (50%, 30%, 20%) of $100, when checking balances, then amounts owed match percentages.

### 4.2 Membership Periods
- AC-4.2.1: Given user joins group after an expense was created, when checking balances, then that expense does not affect the new member's balance.
- AC-4.2.2: Given user leaves group before an expense was created, when checking balances, then that expense does not affect the former member's balance.
- AC-4.2.3: Given user has multiple membership periods, when checking balances, then only expenses during their membership periods affect balance.

### 4.3 Currency
- AC-4.3.1: Given expense in EUR with explicit exchange rate to USD, when calculating balances in USD group, then amount is converted using provided rate.
- AC-4.3.2: Given multiple currencies in same group, when calculating balances, then each expense is converted to group currency using its specific rate or group currency if same.

### 4.4 Settlements
- AC-4.4.1: Given user A owes user B $50, when settlement of $50 is recorded from A to B, then A's balance increases by $50 and B's decreases by $50.
- AC-4.4.2: Given settlement in different currency, when recording, then amount is converted using appropriate rate before affecting balances.
- AC-4.4.3: Given settlement recorded, when checking expense breakdown, then settlement does not appear as an expense.

## 5. Anomaly Detection
### 5.1 Detection
- AC-5.1.1: Given CSV with duplicate rows (same payer, amount, date, description), when importing, then duplicate expense anomaly is detected for each duplicate after first.
- AC-5.1.2: Given CSV with amount column containing non-numeric value, when importing, then invalid amount anomaly is detected.
- AC-5.1.3: Given CSV with date in invalid format, when importing, then invalid date anomaly is detected.
- AC-5.1.4: Given CSV with currency code not in ISO 4217, when importing, then unknown currency anomaly is detected.
- AC-5.1.5: Given CSV where total amount does not equal sum of splits, when importing, then total mismatch anomaly is detected.

### 5.2 Resolution and Audit
- AC-5.2.1: Given detected anomaly, when user approves suggested resolution, then resolution is applied and audit log records anomaly type, original data, resolution action, and user decision.
- AC-5.2.2: Given detected anomaly, when user rejects suggested resolution, then row is skipped and audit log records anomaly and rejection.
- AC-5.2.3: Given anomaly resolution requiring manual input (e.g., correct amount), when user provides input and approves, then expense is created with corrected data and audit log shows original vs corrected.
- AC-5.2.4: Given imported data, when viewing audit trail, then original CSV row data is preserved and visible.

## 6. Reporting
### 6.1 Import Report
- AC-6.1.1: Given completed import, when import report is generated, then it includes: total rows, successful imports, anomalies by type, actions taken, and import batch ID.
- AC-6.1.2: Given import report, when exported, then it is available in CSV or PDF format.

### 6.2 Balance Transparency
- AC-6.2.1: Given user viewing their balance breakdown, when expanding an expense line item, then they see how that expense contributed to their balance (amount owed/owed based on split).
- AC-6.2.2: Given user viewing group balances, when clicking on a member's balance, then they see the expense breakdown contributing to that balance.

## 7. System Qualities
### 7.1 Performance
- AC-7.1.1: Given typical user actions (create expense, view group, check balance), when performed, then response time is under 2 seconds.
- AC-7.1.2: Given balance calculation for group of 50 members with 1,000 expenses, when requested, then result is returned within 3 seconds.

### 7.2 Security
- AC-7.2.1: Given unauthenticated user, when attempting to access API endpoint, then 401 Unauthorized is returned.
- AC-7.2.2: Given user attempting to access another user's private data, when verified, then authorization prevents access.
- AC-7.2.3: Given SQL injection attempt in input field, when processed, then input is sanitized and no database mutation occurs.

### 7.3 Data Integrity
- AC-7.3.1: Given database constraint violation (e.g., foreign key), when operation attempted, then error is returned and transaction rolled back.
- AC-7.3.2: Given system crash during transaction, when recovered, then data is in consistent state (no partial updates).