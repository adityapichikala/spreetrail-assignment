# Forensic Analysis of expenses_export.csv

## Overview
This document provides a complete forensic analysis of the expenses_export.csv file, identifying all data quality issues, anomalies, and inconsistencies that need to be addressed during the import process.

## File Information
- **Filename:** expenses_export.csv
- **Total Rows:** 43 (including header)
- **Data Rows:** 42
- **Headers:** date, description, paid_by, amount, currency, split_type, split_with, split_details, notes

## Detailed Anomaly Analysis

### 1. Date Format Inconsistencies
**Severity:** High
**Detection Logic:** Check if date matches expected formats (YYYY-MM-DD or DD/MM/YYYY). Flag ambiguous or non-standard formats.
**Instances:**
- Line 16: "01/03/2026" (DD/MM/YYYY) - inconsistent with predominant YYYY-MM-DD
- Line 19: "08/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 20: "09/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 21: "10/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 22: "10/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 23: "11/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 27: "Mar 14" - ambiguous format missing year
- Line 28: "15/03/2026" (DD/MM/YYYY) - inconsistent format
- Line 34: "04/05/2026" (DD/MM/YYYY) - ambiguous (could be Apr 5 or May 4)
**User Explanation:** Dates are formatted inconsistently, making automated parsing unreliable.
**Recommended Action:** Standardize all dates to YYYY-MM-DD format. For ambiguous dates like "Mar 14", infer year from surrounding transactions.
**Audit Log Entry:** "DATE_FORMAT_INCONSISTENCY: Original date value '[value]' converted to standardized format '[new_value]'"

### 2. Naming Inconsistencies
**Severity:** Medium
**Detection Logic:** Compare paid_by and split_with values against known user list. Flag case variations or extra text.
**Instances:**
- Line 9: "priya" (lowercase) vs standard "Priya"
- Line 11: "Priya S" (extra text) vs standard "Priya"
- Line 25: "Thalassa dinner" vs Line 24: "Dinner at Thalassa" (potential duplicate description)
**User Explanation:** User names are not consistently formatted, which could lead to incorrect user identification.
**Recommended Action:** Normalize user names to standard format (proper case). Flag potential duplicate descriptions for manual review.
**Audit Log Entry:** "NAMING_INCONSISTENCY: Original value '[value]' normalized to '[normalized_value]'"

### 3. Missing Data
**Severity:** High
**Detection Logic:** Check for empty/null values in required fields (paid_by, amount, currency, split_type, split_with).
**Instances:**
- Line 13: Empty paid_by field (house cleaning supplies)
- Line 14: Empty split_type field (settlement transaction)
- Line 28: Empty currency field (Groceries DMart)
**User Explanation:** Required fields are missing, making the expense record incomplete and unusable.
**Recommended Action:** Flag for manual correction. For paid_by, cannot auto-correct without user input. For currency, infer from context or group default.
**Audit Log Entry:** "MISSING_FIELD: Field '[field_name]' is empty and requires manual input"

### 4. Invalid Amount Formats
**Severity:** Medium
**Detection Logic:** Validate amount is numeric with proper decimal precision (max 2 decimal places for currency).
**Instances:**
- Line 7: "1,200" (contains comma separator)
- Line 10: "899.995" (3 decimal places, should be 2)
- Line 26: "-30" (negative amount - refund)
- Line 31: "0" (zero amount)
**User Explanation:** Amounts are not in valid currency format, potentially causing calculation errors.
**Recommended Action:** 
- Remove thousands separators and parse as decimal
- Round to 2 decimal places or flag for review
- Treat negative amounts as refunds/credits (valid but special handling)
- Zero amounts require manual review (likely erroneous)
**Audit Log Entry:** "AMOUNT_FORMAT_ISSUE: Original amount '[value]' processed as '[processed_value]'"

### 5. Duplicate/Near Duplicate Expenses
**Severity:** High
**Detection Logic:** Group by date, description (normalized), paid_by, and amount. Flag groups with >1 entry.
**Instances:**
- Lines 5 & 6: Both are dinner expenses by Dev on 2026-02-08 for 3200 INR with similar descriptions
- Lines 24 & 25: Both are Thalassa dinner expenses (~2400-2450 INR) by different users on 2026-03-11
**User Explanation:** Appears to be duplicate entries for the same expense, potentially inflating totals.
**Recommended Action:** Flag near-duplicates for manual review and resolution (approve one, skip other, or merge).
**Audit Log Entry:** "NEAR_DUPLICATE: This expense matches another entry on [date] for [amount] by [user]. Please review."

### 6. Split Type Issues
**Severity:** High
**Detection Logic:** Validate split_type against allowed values (equal, percentage, exact, unequal, share). Validate split_details consistency.
**Instances:**
- Line 14: Empty split_type (settlement)
- Line 22: split_type = "share" (not in standard list)
- Line 35: split_type = "equal" but split_details shows specific shares ("Aisha 1; Rohan 1; Priya 1; Sam 1")
**User Explanation:** Split type is invalid or inconsistent with provided split details, making accurate calculation impossible.
**Recommended Action:** 
- For empty split_type on settlements: flag as settlement transaction requiring separate handling
- For invalid split_type: flag for manual correction to valid type
- For inconsistent split_details: flag for manual review and correction
**Audit Log Entry:** "INVALID_SPLIT_TYPE: Value '[value]' is not a valid split type. Must be one of: equal, percentage, exact, unequal"

### 7. Currency Issues
**Severity:** Medium
**Detection Logic:** Validate currency against ISO 4217 list. Check for missing currencies.
**Instances:**
- Line 20: Currency = "USD" (Goa villa booking)
- Line 21: Currency = "USD" (Beach shack lunch)
- Line 23: Currency = "USD" (Parasailing)
- Line 26: Currency = "USD" (Parasailing refund)
- Line 28: Missing currency (Groceries DMart)
**User Explanation:** Multiple currencies used without explicit exchange rates, and some currencies missing.
**Recommended Action:** 
- Validate currency codes against ISO 4217
- For missing currency, infer from context or flag for manual input
- Require explicit exchange rates for multi-currency transactions
**Audit Log Entry:** "CURRENCY_ISSUE: Currency '[value]' is invalid or missing. Please provide valid ISO 4217 currency code."

### 8. Membership/Timing Issues
**Severity:** High
**Detection Logic:** Check if transaction date falls within user's membership period (joined_at <= date <= left_at or open-ended).
**Instances:**
- Line 36: April 2 Groceries includes Meera, but she left end of March (per note on line 33)
- Various transactions around March/April need verification against membership dates
**User Explanation:** Expenses are being assigned to users who were not group members at the time of the transaction.
**Recommended Action:** Flag expenses where user membership cannot be verified for the transaction date.
**Audit Log Entry:** "MEMBER_NOT_ACTIVE: User '[user]' was not an active group member on [date]. Please verify membership period."

### 9. Settlement Misclassification
**Severity:** High
**Detection Logic:** Identify transactions that represent money transfers between users (descriptions indicating repayment, deposit, etc.) but classified as expenses.
**Instances:**
- Line 14: "Rohan paid Aisha back" - clearly a settlement
- Line 38: "Sam deposit share" - security deposit transfer, should be settlement
**User Explanation:** Settlements are being recorded as expenses, which distorts actual group spending totals.
**Recommended Action:** 
- Identify potential settlements based on description keywords (paid back, deposit, refund, settle, owe)
- Flag for manual classification as settlement vs expense
- Create separate settlement entity for money transfers between users
**Audit Log Entry:** "POTENTIAL_SETTLEMENT: Description suggests this is a settlement transaction rather than an expense. Please classify correctly."

### 10. Mathematical Inconsistencies
**Severity:** High
**Detection Logic:** For each expense, calculate sum of split amounts and compare to total amount.
**Instances:**
- Line 15: Pizza Friday - percentages sum to 110% (30+30+30+20) which exceeds 100%
- Line 32: Weekend brunch - percentages sum to 110% (30+30+30+20) which exceeds 100%
- Need to verify all split calculations
**User Explanation:** Split amounts do not correctly total the expense amount, leading to incorrect balance calculations.
**Recommended Action:** 
- For percentage splits: validate that percentages sum to 100% (allow small rounding tolerance)
- For exact/unequal splits: validate that split amounts sum to total amount
- Flag inconsistencies for manual review and correction
**Audit Log Entry:** "SPLIT_TOTAL_MISMATCH: Sum of split values ([sum]) does not equal total amount ([total]). Please correct split details."

### 11. External Participants
**Severity:** Medium
**Detection Logic:** Check split_with against known group members. Flag non-members.
**Instances:**
- Line 23: Includes "Dev's friend Kabir" who is not a regular group member
**User Explanation:** Expenses include participants who are not regular group members, requiring special handling.
**Recommended Action:** 
- Flag external participants for manual review
- Determine if external participants should be temporarily added to group or handled separately
**Audit Log Entry:** "EXTERNAL_PARTICIPANT: Participant '[participant]' is not a regular group member. Please verify if should be included."

### 12. Zero Amount Expenses
**Severity:** Medium
**Detection Logic:** Flag expenses with zero or near-zero amounts.
**Instances:**
- Line 31: Amount = 0 (Dinner order Swiggy)
**User Explanation:** Zero amount expenses are likely erroneous or represent voided transactions.
**Recommended Action:** Flag for manual review to confirm if valid (e.g., refund, correction) or should be skipped.
**Audit Log Entry:** "ZERO_AMOUNT: Expense amount is zero. Please verify if this is intentional."

## Summary of Anomaly Types Identified

Based on the analysis, the following anomaly types need to be handled by the import system:

1. DATE_FORMAT_INCONSISTENCY
2. NAMING_INCONSISTENCY
3. MISSING_FIELD (paid_by, currency, split_type)
4. AMOUNT_FORMAT_ISSUE
5. NEAR_DUPLICATE
6. INVALID_SPLIT_TYPE
7. CURRENCY_ISSUE
8. MEMBER_NOT_ACTIVE
9. POTENTIAL_SETTLEMENT
10. SPLIT_TOTAL_MISMATCH
11. EXTERNAL_PARTICIPANT
12. ZERO_AMOUNT

Each anomaly type requires:
- Specific detection logic
- User-facing explanation
- Recommended action
- Audit log entry format

The import system must:
1. Preserve original CSV data without modification
2. Detect all anomalies using pluggable detectors
3. Present anomalies to user for explicit resolution
4. Maintain complete audit trail of original data and decisions
5. Never silently modify imported data

## Recommended Import Workflow

1. **Ingestion:** Load CSV into ImportedExpense table (staging area)
2. **Validation:** Run all anomaly detectors against imported data
3. **Reporting:** Generate Import Report showing all anomalies by type
4. **Resolution:** User explicitly resolves each anomaly (APPROVE_SUGGESTED, MANUAL_CORRECTION, SKIP_ROW)
5. **Import:** Move resolved expenses to main Expense table
6. **Audit:** Log all decisions and preserve original data

This approach satisfies:
- Meera's requirement: "Detect duplicates but never auto-delete silently. I must approve modifications."
- Engineering Principle: "Never silently modify imported data."
- Engineering Principle: "Every anomaly must be detected, surfaced, logged, and have an action recorded."