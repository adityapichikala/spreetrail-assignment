# Entity Relationship Diagram

The following diagram represents the entity relationships for the Shared Expense Management Application.

```mermaid
erDiagram
    USER ||..o GROUP_MEMBERSHIP : "has"
    GROUP ||..o GROUP_MEMBERSHIP : "has"
    USER ||..o EXPENSE : "pays"
    USER ||..o EXPENSE_PARTICIPANT : "participates in"
    EXPENSE ||..o EXPENSE_PARTICIPANT : "has"
    GROUP ||..o EXPENSE : "contains"
    GROUP ||..o SETTLEMENT : "contains"
    USER ||..o SETTLEMENT : "from"
    USER ||..o SETTLEMENT : "to"
    USER ||..o IMPORT_BATCH : "initiates"
    IMPORT_BATCH ||..o IMPORTED_EXPENSE : "processes"
    IMPORTED_EXPENSE ||..o EXPENSE : "maps to"
    IMPORTED_EXPENSE ||..o IMPORTED_ANOMALY : "has"
    EXCHANGE_RATE ||..o EXPENSE : "used for conversion"
    EXCHANGE_RATE ||..o SETTLEMENT : "used for conversion"
    USER ||..o AUDIT_LOG : "performs"
    GROUP ||..o AUDIT_LOG : "affects"
    EXPENSE ||..o AUDIT_LOG : "affects"
    SETTLEMENT ||..o AUDIT_LOG : "affects"
    GROUP_MEMBERSHIP ||..o AUDIT_LOG : "affects"

    USER {
        uuid id PK
        string email
        string name
        string password_hash
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    GROUP {
        uuid id PK
        string name
        string description
        timestamp created_at
        timestamp updated_at
        uuid created_by FK
        string currency
    }
    GROUP_MEMBERSHIP {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        timestamp joined_at
        timestamp left_at
        timestamp created_at
    }
    EXPENSE {
        uuid id PK
        uuid group_id FK
        uuid payer_id FK
        decimal amount
        string currency
        timestamp date
        string description
        string split_type
        timestamp created_at
        uuid created_by FK
        decimal exchange_rate
    }
    EXPENSE_PARTICIPANT {
        uuid id PK
        uuid expense_id FK
        uuid user_id FK
        decimal percentage
        decimal amount
        string notes
    }
    SETTLEMENT {
        uuid id PK
        uuid group_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        decimal amount
        string currency
        timestamp date
        string description
        timestamp created_at
        uuid created_by FK
        decimal exchange_rate
    }
    EXCHANGE_RATE {
        uuid id PK
        string from_currency
        string to_currency
        decimal rate
        timestamp date
        string source
    }
    IMPORT_BATCH {
        uuid id PK
        uuid user_id FK
        timestamp started_at
        timestamp completed_at
        string status
        integer row_count
        integer imported_count
        integer anomaly_count
        json metadata
    }
    IMPORTED_EXPENSE {
        uuid id PK
        uuid import_batch_id FK
        json raw_data
        uuid expense_id FK
        string status
        array<uuid> anomaly_ids
    }
    IMPORTED_ANOMALY {
        uuid id PK
        uuid import_batch_id FK
        uuid imported_expense_id FK
        string anomaly_type
        string severity
        string description
        string detection_logic
        string suggested_resolution
        string user_resolution
        json manual_correction_data
        timestamp created_at
        timestamp resolved_at
        uuid resolved_by FK
    }
    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id FK
        json changes
        string ip_address
        string user_agent
        timestamp created_at
    }
```

Note: 
- FK indicates foreign key relationship
- PK indicates primary key
- Relationships are labeled with cardinality where appropriate
- The diagram shows the core entities and their relationships as described in the domain model