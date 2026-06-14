# AI Usage Documentation

This document records how AI tools (specifically Claude Code) were used in the development of the Shared Expense Management Application, including prompts used, mistakes made, and corrections applied.

## Overview
Claude Code (the AI assistant) was used throughout Phase 1 (Product Discovery) to help create planning documents, analyze requirements, and design the system architecture. The AI acted as a collaborative partner in the software engineering process.

## Usage Summary

### Phase 1: Product Discovery
- **Document Creation:** AI assisted in creating all Phase 1 documents:
  - Product Requirements Document
  - User Stories
  - Edge Cases
  - Functional Requirements
  - Non-functional Requirements
  - Acceptance Criteria
  - Domain Model
  - Entity Relationship Diagram
  - API Requirements
  - Architecture Decision Record
- **Analysis Assistance:** AI helped analyze user requirements, identify hidden requirements, and suggest appropriate technical solutions.
- **Design Review:** AI reviewed the evolving design for consistency with requirements and engineering principles.
- **Tradeoff Analysis:** AI helped evaluate alternatives and explain tradeoffs for major decisions.

## Specific Interactions

### Initial Setup
- **Prompt:** "I need to build a Shared Expense Management Application. Help me create the Product Requirements Document, User Stories, and other Phase 1 artifacts."
- **AI Response:** Created structured documents based on the assignment description, user requirements (Aisha, Rohan, Priya, Sam, Meera), and engineering principles.
- **Outcome:** Established foundation for the project with clear requirements and scope.

### Domain Modeling
- **Prompt:** "Design a relational database schema for the expense management application including Users, Groups, Membership History, Expenses, Expense Participants, Settlements, Currencies, Exchange Rates, Import Batches, Import Anomalies, and Audit Logs."
- **AI Response:** Created detailed domain model with entities, attributes, relationships, and constraints.
- **Outcome:** Defined the core data structure that supports all requirements including membership periods and split types.

### Anomaly Detection Framework
- **Prompt:** "Build an extensible anomaly detection framework for CSV import. List possible anomaly classes including duplicate expense, near duplicate, currency mismatch, invalid amount, negative amount, missing payer, missing participant, settlement recorded as expense, invalid date, future date, member not active, split mismatch, total mismatch, orphan user, unknown currency, invalid group, rounding issue."
- **AI Response:** Defined anomaly detection approach with severity levels, detection logic, user explanations, recommended actions, and audit log entries.
- **Outcome:** Established framework that ensures no silent modification of imported data.

### Architecture Decisions
- **Prompt:** "Recommend technology stack (Frontend: React, Next.js, TypeScript; Backend: Node.js, Express/NestJS; Database: PostgreSQL; ORM: Prisma; Authentication: JWT; Deployment: Vercet + Railway/Render/Supabase). Explain tradeoffs."
- **AI Response:** Created Architecture Decision Record with multiple ADRs covering stack selection, database design, authentication, state management, balance calculation, import handling, and deployment.
- **Outcome:** Documented major technical decisions with alternatives considered and rationale.

## Mistakes and Corrections

### Mistake 1: Initial Overlooking of Membership Granularity
- **What Happened:** In early domain modeling considerations, membership was simplified to a simple join date without tracking leaves and rejoins.
- **How Detected:** AI recognized that Sam's requirement ("joined mid-April, expenses before joining should not affect me") combined with the need to handle users leaving and rejoining required more granular tracking.
- **Correction:** Implemented GroupMembership entity with join and leave timestamps to track multiple membership periods.
- **AI Usage:** AI suggested the membership history approach after reviewing the engineering principle that "Membership periods must affect balance calculations."

### Mistake 2: Currency Handling Assumption
- **What Happened:** Initially assumed all transactions would use a single group currency.
- **How Detected:** AI noted Priya's requirement for multiple currencies and the engineering principle that "Currency conversion must be explicit."
- **Correction:** Added currency field to expenses and settlements, plus exchange_rate field and ExchangeRate entity for historical conversion rates.
- **AI Usage:** AI recommended explicit currency tracking after analyzing the multi-currency requirement.

### Mistake 3: Import Process Design
- **What Happened:** Early import concept considered automatic validation and import with error reporting.
- **How Detected:** AI recognized that this violated Meera's requirement ("Detect duplicates but never auto-delete silently. I must approve modifications.") and the engineering principle about never silently modifying data.
- **Correction:** Designed import pipeline requiring explicit user approval for each anomaly resolution, preserving original CSV data.
- **AI Usage:** AI emphasized the audit trail and user control aspects after reviewing the import requirements.

### Mistake 4: Settlement Classification
- **What Happened:** Initially considered treating settlements as a type of expense.
- **How Detected:** AI identified that this would violate the engineering principle that "Settlement transactions must not be treated as expenses."
- **Correction:** Created separate Settlement entity distinct from Expense, with specific handling in balance calculations.
- **AI Usage:** AI highlighted the distinction after reviewing the engineering principles and user requirements for transparency.

## AI-Assisted Document Creation Process

For each document, the AI followed this pattern:
1. **Requirement Analysis:** Reviewed assignment description, user requirements, and engineering principles
2. **Structure Suggestion:** Proposed document outline based on standard practices
3. **Content Generation:** Wrote detailed content addressing all points
4. **Review and Refinement:** Checked for consistency with other documents and requirements
5. **Tradeoff Explanation:** Included reasoning, alternatives, and justification where appropriate

## Effectiveness of AI Usage

**Strengths:**
- Rapid generation of well-structured documents
- Consistent application of engineering principles across documents
- Ability to suggest alternatives and explain tradeoffs
- Help in identifying non-obvious requirements and edge cases
- Maintenance of consistent terminology and formatting

**Limitations:**
- Required specific prompting to dive into certain details
- Needed guidance to focus on certain aspects over others
- Occasionally suggested overly complex solutions that needed simplification
- Required human judgment to prioritize requirements and make final decisions

## Future AI Usage Plans

As we move into implementation phases, we plan to use AI for:
- Generating boilerplate code (DTOs, controllers, services)
- Creating unit test templates
- Writing API documentation
- Creating migration scripts
- Generating README sections for code modules
- Explaining complex algorithms in comments
- Reviewing code for potential improvements

All AI-generated code will be reviewed by human engineers to ensure correctness and adherence to standards.

## Conclusion
AI usage in Phase 1 significantly accelerated the planning process while maintaining quality and thoroughness. The AI served as a knowledgeable assistant that could quickly generate documents, suggest alternatives, and help think through complex requirements, allowing the human engineer to focus on judgment calls, prioritization, and creative problem-solving.
