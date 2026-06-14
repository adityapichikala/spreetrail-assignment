# Edge Cases

## Membership and Time-Based Edge Cases
1. User joins group after an expense is created - expense should not affect new member's balance.
2. User leaves group before an expense is created - expense should not affect former member's balance.
3. User joins and leaves group multiple times - each membership period should be tracked separately.
4. Expense created on the exact day a user joins - user should participate in that expense.
5. Expense created on the exact day a user leaves - user should participate in that expense (assuming end of day).
6. Group has no active members - balance calculations should handle zero members gracefully.
7. User has multiple overlapping memberships in same group (should be prevented by business logic).

## Expense and Split Edge Cases
1. Expense with zero amount - should be allowed but create no balance impact.
2. Expense with negative amount (refund or credit) - should be handled as negative expense.
3. Expense split percentages that don't sum to 100% - should be detected as anomaly.
4. Expense split exact amounts that don't sum to total - should be detected as anomaly.
5. Expense with no participants (only payer) - valid for personal expense but should be flagged.
6. Expense with payer not in participant list - valid if payer is covering others, but should be flagged if payer not in group.
7. Expense with future date - should be detected as anomaly.
8. Expense with very old date (e.g., years ago) - should be allowed but may warrant warning.
9. Expense with duplicate timestamp, payer, amount, and description - potential duplicate.
10. Expense with same core data but minor variation (e.g., description typo) - near duplicate.
11. Expense where payer is not a member of the group on the expense date - invalid.
12. Expense where a participant is not a member of the group on the expense date - invalid.
13. Expense with split type requiring participant list but no participants provided - invalid.
14. Expense with percentage splits where individual percentage is zero - valid but unusual.
15. Expense with exact amount splits where individual amount is zero - valid.
16. Expense with currency not supported by system - should be detected as anomaly.
17. Expense where currency conversion rate is missing or invalid - should be detected as anomaly.

## CSV Import Edge Cases
1. Empty CSV file - should be handled gracefully.
2. CSV with only headers - should process zero expenses.
3. CSV with missing required columns - should be detected as anomaly.
4. CSV with extra columns - should ignore or flag as warning.
5. CSV with duplicate rows - should be detected as duplicate expense anomaly.
6. CSV with rows that are nearly identical (e.g., amount differs by $0.01) - near duplicate.
7. CSV with malformed data (e.g., text in amount column) - invalid amount anomaly.
8. CSV with future dates - future date anomaly.
9. CSV with dates in incorrect format - invalid date anomaly.
10. CSV with currency codes not in ISO 4217 - unknown currency anomaly.
11. CSV with group names that don't exist in system - invalid group anomaly.
12. CSV with user emails/IDs that don't correspond to existing users - orphan user anomaly.
13. CSV where a user is not a member of the specified group on the expense date - member not active anomaly.
14. CSV where total amount doesn't match sum of splits - total mismatch anomaly.
15. CSV where split type is invalid or unrecognized - invalid split type anomaly.
16. CSV where settlement transactions are mislabeled as expenses - settlement recorded as expense anomaly.
17. CSV with rounding issues due to currency precision - rounding issue anomaly.
18. CSV with extremely large numbers (e.g., millions) - should be handled but may warrant warning.
19. CSV with scientific notation in amounts - should be parsed correctly.
20. CSV with leading/trailing whitespace in fields - should be trimmed.

## Balance Calculation Edge Cases
1. Group with no expenses - all balances should be zero.
2. Group with only one member - all expenses should be borne by that member.
3. Group where members have complex joining/leaving patterns - balance calculation must correctly apportion expenses.
4. Expense with unequal splits where amounts are irrational numbers - should handle rounding appropriately.
5. Multiple currencies in same group - balance must be converted to group currency using appropriate rates.
6. Exchange rate fluctuations - should use rate on expense date or explicit rate provided.
7. Circular debt settlements - system should track net positions correctly.
8. Partial settlements - should update balances incrementally.
9. Settlements in different currency than expense - requires conversion.
10. Refunds recorded as negative expenses - should reduce payer's liability and increase participants' claims.

## System and Technical Edge Cases
1. Concurrent expense creation by two users - should handle with proper locking or transaction isolation.
2. Large import batch (thousands of rows) - should process efficiently with progress reporting.
3. Database connection failure during import - should retry or fail gracefully with partial rollback.
4. Audit log grows very large - should consider archiving or partitioning.
5. System clock drift - should use UTC timestamps and reliable time source.
6. Timezone differences in CSV dates - should assume UTC or specify expected timezone.
7. Unicode characters in descriptions - should handle UTF-8 properly.
8. HTML/script injection in description fields - should sanitize or escape to prevent XSS.
9. Very long descriptions - should have reasonable limits.
10. Simultaneous anomaly resolution by multiple users - should handle with locking or versioning.

## Currency-Specific Edge Cases
1. Currency hyperinflation - exchange rates changing rapidly.
2. Currency redenomination (e.g., removing zeros) - should handle with explicit rates.
3. Currency union split (e.g., Euro zone changes) - should handle historical rates.
4. Cryptocurrency-like volatility - should allow manual rate entry.
5. Currency with sub-units not based on 100 (e.g., some historic currencies) - should handle arbitrary precision.