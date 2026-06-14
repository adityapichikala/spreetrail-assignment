# User Stories

## Authentication
1. As a user, I can register an account with email and password so that I can access the system.
2. As a user, I can log in with my credentials so that I can access my groups and expenses.
3. As a user, I can log out so that I can end my session securely.
4. As a user, I can refresh my authentication token so that I can maintain access without frequent re-login.

## Group Management
5. As a user, I can create a new group with a name and description so that I can start tracking shared expenses.
6. As a user, I can view a list of groups I belong to so that I can navigate to my active groups.
7. As a user, I can view group details including name, description, and member list so that I can understand the group context.
8. As a user, I can update group name and description so that I can keep group information current.
9. As a user, I can delete a group I created (if no expenses exist) so that I can clean up unused groups.
10. As a user, I can add members to a group by inviting them via email so that I can expand the group.
11. As a user, I can remove members from a group so that I can manage membership changes.
12. As a user, I can view my membership history in a group (join date, leave date if applicable) so that I can understand my tenure.

## Expense Management
13. As a user, I can create an expense in a group with payer, amount, currency, date, description, and split type so that I can record shared costs.
14. As a user, I can view all expenses in a group so that I can review historical spending.
15. As a user, I can view details of a specific expense including splits and participants so that I can verify accuracy.
16. As a user, I can edit an expense I created (within constraints) so that I can correct mistakes.
17. As a user, I can delete an expense I created (if no settlements depend on it) so that I can remove erroneous entries.
18. As a user, I can import expenses from a CSV file so that I can bulk load historical data.
19. As a user, I can see detected anomalies during CSV import so that I can review and approve corrections.
20. As a user, I can approve or reject each anomaly resolution so that I maintain control over data modifications.
21. As a user, I can export expenses to CSV so that I can backup or share data.

## Balance and Settlements
22. As a user, I can view my current balance in a group (total owed or owed to me) so that I understand my financial position.
23. As a user, I can view my balance breakdown by expense so that I can trace how my balance was calculated (Rohan's requirement).
24. As a user, I can view group balances for all members so that I can see who owes whom.
25. As a user, I can record a settlement payment between two users so that I can document debt repayment.
26. As a user, I can view settlement history so that I can track repayment activity.
27. As a user, I can see that settlements are not treated as expenses so that balance calculations remain accurate.

## Currency Handling
28. As a user, I can specify currency when creating an expense so that I can record non-USD expenses.
29. As a user, I can view exchange rates used for currency conversion so that I can verify conversion accuracy.
30. As a user, I can see amounts displayed in both original and group currency (if different) so that I understand the values.

## Audit and Transparency
31. As a user, I can view an audit log of changes to expenses, groups, and memberships so that I can see who changed what and when (traceability).
32. As a user, I can see that imported data cannot be silently modified so that I trust the system integrity (Meera's requirement).
33. As a user, I receive notifications when action is required on anomalies so that I can promptly review them.

## Special Cases
34. As a user who joins a group mid-period, I see that my balance only includes expenses from my join date forward so that I am not charged for past expenses (Sam's requirement).
35. As a user, I can handle expenses with multiple currencies in the same group so that I can manage international groups (Priya's requirement).
36. As a user, I want a simple summary of who pays whom and how much so that I can settle debts efficiently (Aisha's requirement).

## Non-Functional
37. As a user, I expect the system to respond quickly to my actions so that I have a smooth experience.
38. As a user, I expect my data to be secure and private so that I trust the system with financial information.
39. As a user, I expect the system to be available when I need it so that I can manage expenses reliably.