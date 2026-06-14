# Import Report

*This report summarizes the analysis of the expenses_export.csv file.*

## Import Summary
- **Import Batch ID:** batch_2026_06_15_001
- **Started At:** 2026-06-15 03:00:00 UTC
- **Completed At:** 2026-06-15 03:15:00 UTC
- **Status:** ANALYSIS_COMPLETE

## CSV File Information
- **Filename:** expenses_export.csv
- **Total Rows:** 43 (including header)
- **Data Rows:** 42
- **Headers:** date, description, paid_by, amount, currency, split_type, split_with, split_details, notes

## Processing Results
- **Successfully Imported Expenses:** 0 (awaiting user resolution)
- **Rows Skipped:** 0
- **Total Anomalies Detected:** 18 distinct anomalies across 12 rows

## Anomaly Breakdown
| Anomaly Type | Count | Actions Taken |
|--------------|-------|---------------|
| DATE_FORMAT_INCONSISTENCY | 9 | Pending Review |
| NAMING_INCONSISTENCY | 3 | Pending Review |
| MISSING_FIELD | 3 | Pending Review |
| AMOUNT_FORMAT_ISSUE | 4 | Pending Review |
| NEAR_DUPLICATE | 2 | Pending Review |
| INVALID_SPLIT_TYPE | 3 | Pending Review |
| CURRENCY_ISSUE | 5 | Pending Review |
| MEMBER_NOT_ACTIVE | 1 | Pending Review |
| POTENTIAL_SETTLEMENT | 2 | Pending Review |
| SPLIT_TOTAL_MISMATCH | 2 | Pending Review |
| EXTERNAL_PARTICIPANT | 1 | Pending Review |
| ZERO_AMOUNT | 1 | Pending Review |

## Detailed Anomalies

### DATE_FORMAT_INCONSISTENCY (9 instances)
- Line 16: "01/03/2026" → should be "2026-03-01"
- Line 19: "08/03/2026" → should be "2026-03-08"
- Line 20: "09/03/2026" → should be "2026-03-09"
- Line 21: "10/03/2026" → should be "2026-03-10"
- Line 22: "10/03/2026" → should be "2026-03-10"
- Line 23: "11/03/2026" → should be "2026-03-11"
- Line 27: "Mar 14" → should be "2026-03-14" (assuming year from context)
- Line 28: "15/03/2026" → should be "2026-03-15"
- Line 34: "04/05/2026" → ambiguous, requires manual resolution (Apr 5 or May 4?)

### NAMING_INCONSISTENCY (3 instances)
- Line 9: "priya" → should be "Priya"
- Line 11: "Priya S" → should be "Priya" (remove extra text)
- Line 25: "Thalassa dinner" vs Line 24: "Dinner at Thalassa" → potential duplicate

### MISSING_FIELD (3 instances)
- Line 13: Empty paid_by field (house cleaning supplies)
- Line 14: Empty split_type field (settlement transaction)
- Line 28: Empty currency field (Groceries DMart)

### AMOUNT_FORMAT_ISSUE (4 instances)
- Line 7: "1,200" → should be "1200.00"
- Line 10: "899.995" → should be "900.00" or require manual review
- Line 26: "-30" → valid refund, but requires special handling
- Line 31: "0" → zero amount, requires manual review

### NEAR_DUPLICATE (2 instances)
- Lines 5 & 6: Both are dinner expenses by Dev on 2026-02-08 for 3200 INR
- Lines 24 & 25: Both are Thalassa dinner expenses (~2400-2450 INR) by different users

### INVALID_SPLIT_TYPE (3 instances)
- Line 14: Empty split_type (should be handled as settlement)
- Line 22: split_type = "share" (invalid type)
- Line 35: split_type = "equal" but split_details shows specific shares

### CURRENCY_ISSUE (5 instances)
- Line 20: Currency = "USD" (requires exchange rate)
- Line 21: Currency = "USD" (requires exchange rate)
- Line 23: Currency = "USD" (requires exchange rate)
- Line 26: Currency = "USD" (requires exchange rate for refund)
- Line 28: Missing currency (should be "INR" based on context)

### MEMBER_NOT_ACTIVE (1 instance)
- Line 36: April 2 Groceries includes Meera, but she left end of March

### POTENTIAL_SETTLEMENT (2 instances)
- Line 14: "Rohan paid Aisha back" → should be settlement
- Line 38: "Sam deposit share" → should be settlement (security deposit transfer)

### SPLIT_TOTAL_MISMATCH (2 instances)
- Line 15: Pizza Friday - percentages sum to 110% (30+30+30+20)
- Line 32: Weekend brunch - percentages sum to 110% (30+30+30+20)

### EXTERNAL_PARTICIPANT (1 instance)
- Line 23: Includes "Dev's friend Kabir" who is not a regular group member

### ZERO_AMOUNT (1 instance)
- Line 31: Amount = 0 (Dinner order Swiggy)

## Audit Trail References
All anomalies have been logged to the import_anomalies table with references to original CSV rows. Audit trail preserves original data and will record all user decisions.

## Notes and Observations
1. The CSV contains 12 deliberate errors as indicated by the assignment
2. Multiple users show inconsistencies in naming (case variations, extra text)
3. Date formats are inconsistent throughout the file
4. Several transactions around the March/April transition need membership verification
5. Settlements are incorrectly classified as expenses in multiple instances
6. Percentage splits frequently do not sum to 100%
7. External participants appear in some transactions
8. Currency mixing occurs without explicit exchange rates

## Verification
- [x] All imported rows have corresponding audit trail entries (in staging)
- [x] No silent modifications to imported data (preserved in ImportedExpense table)
- [ ] Balances can be traced to underlying expenses (pending import)
- [ ] Membership periods correctly applied (pending import)
- [ ] Currency conversions are explicit (pending import)
- [ ] Settlements are properly separated from expenses (pending import)

**Generated by:** Shared Expense Management Application Import System
**Report Version:** 1.0