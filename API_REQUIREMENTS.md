# API Requirements

## Overview
The Shared Expense Management Application will expose a RESTful API for frontend consumption. The API follows REST principles with JSON as the primary data format.

## Base URL
```
/api/v1
```

## Authentication
- All endpoints (except auth) require a valid JWT token in the Authorization header: `Authorization: Bearer <token>`
- Auth endpoints: `/auth/*`
- Token expiration: 24 hours
- Refresh token endpoint available

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... } // Optional validation details
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Endpoints

### 1. Authentication
#### POST /auth/register
Register a new user
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe"
}
```
**Response:** 201 Created with user object (excluding password)

#### POST /auth/login
Login user
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```
**Response:** 200 OK with `{ access_token, refresh_token, expires_in }`

#### POST /auth/refresh
Refresh access token
**Request:**
```json
{
  "refresh_token": "valid_refresh_token"
}
```
**Response:** 200 OK with new access token

#### POST /auth/logout
Logout user (invalidate token)
**Request:** None
**Response:** 200 OK

### 2. Users
#### GET /users/me
Get current user profile
**Response:** 200 OK with user object

#### PUT /users/me
Update current user profile
**Request:**
```json
{
  "name": "Updated Name"
}
```
**Response:** 200 OK with updated user object

### 3. Groups
#### GET /groups
Get list of groups for current user
**Query Parameters:** 
- page (int, default 1)
- limit (int, default 20)
**Response:** 200 OK with paginated list of group objects

#### POST /groups
Create a new group
**Request:**
```json
{
  "name": "Trip to Spain",
  "description": "Summer vacation group",
  "currency": "EUR"
}
```
**Response:** 201 Created with group object

#### GET /groups/:groupId
Get group details
**Response:** 200 OK with group object including member list

#### PUT /groups/:groupId
Update group details
**Request:**
```json
{
  "name": "Updated Group Name",
  "description": "Updated description",
  "currency": "GBP"
}
```
**Response:** 200 OK with updated group object

#### DELETE /groups/:groupId
Delete group (only if no expenses exist)
**Response:** 204 No Content

#### GET /groups/:groupId/members
Get group members with membership details
**Response:** 200 OK with array of member objects including join/leave dates

#### POST /groups/:groupId/members
Invite user to group by email
**Request:**
```json
{
  "email": "friend@example.com"
}
```
**Response:** 202 Accepted with invitation details

#### DELETE /groups/:groupId/members/:userId
Remove user from group
**Response:** 200 OK with removal confirmation

### 4. Expenses
#### GET /groups/:groupId/expenses
Get expenses for a group
**Query Parameters:**
- page (int, default 1)
- limit (int, default 20)
- startDate (ISO date string)
- endDate (ISO date string)
- payerId (UUID)
- participantId (UUID)
**Response:** 200 OK with paginated list of expense objects including split details

#### POST /groups/:groupId/expenses
Create a new expense
**Request:**
```json
{
  "payerId": "user-uuid",
  "amount": 100.00,
  "currency": "USD",
  "date": "2024-04-15T10:30:00Z",
  "description": "Groceries",
  "splitType": "EQUAL",
  "participants": [
    { "userId": "user1-uuid" },
    { "userId": "user2-uuid" },
    { "userId": "user3-uuid" }
  ]
}
```
**Note:** For PERCENTAGE split, include percentage field; for EXACT, include amount field
**Response:** 201 Created with expense object

#### GET /groups/:groupId/expenses/:expenseId
Get expense details
**Response:** 200 OK with expense object including participants and splits

#### PUT /groups/:groupId/expenses/:expenseId
Update expense (only by creator, with restrictions)
**Request:** Same structure as creation
**Response:** 200 OK with updated expense object

#### DELETE /groups/:groupId/expenses/:expenseId
Delete expense (only by creator, if no settlements depend on it)
**Response:** 204 No Content

### 5. Import
#### POST /groups/:groupId/expenses/import
Import expenses from CSV
**Request:** multipart/form-data with file field named "file"
**Response:** 202 Accepted with import batch ID and status URL

#### GET /import/batches/:batchId
Get import batch status and results
**Response:** 200 OK with import batch object including anomaly details

#### POST /import/batches/:batchId/anomalies/:anomalyId/resolve
Resolve an anomaly
**Request:**
```json
{
  "action": "APPROVE_SUGGESTED", // or MANUAL_CORRECTION or SKIP_ROW
  "manualData": { ... } // Required if action is MANUAL_CORRECTION
}
```
**Response:** 200 OK with resolution confirmation

#### GET /import/batches/:batchId/report
Get import report
**Response:** 200 OK with import report details (can be exported as CSV/PDF)

### 6. Balances
#### GET /groups/:groupId/balances
Get current balances for all members in group
**Response:** 200 OK with array of balance objects:
```json
[
  {
    "userId": "uuid",
    "userName": "John Doe",
    "balance": 45.50, // Positive = owed to user, Negative = user owes
    "currency": "USD",
    "breakdown": [ // Optional detailed breakdown
      {
        "expenseId": "uuid",
        "description": "Groceries",
        "amount": 100.00,
        "share": -25.00, // This user's share
        "settlements": [ // Related settlements
          {
            "amount": 20.00,
            "date": "2024-04-16T00:00:00Z"
          }
        ]
      }
    ]
  }
]
```

#### GET /users/:userId/balances
Get balances for a user across all groups
**Response:** 200 OK with array of group balance objects

### 7. Settlements
#### POST /groups/:groupId/settlements
Record a settlement
**Request:**
```json
{
  "fromUserId": "payer-uuid",
  "toUserId": "payee-uuid",
  "amount": 50.00,
  "currency": "USD",
  "date": "2024-04-16T14:30:00Z",
  "description": "Paid for dinner"
}
```
**Response:** 201 Created with settlement object

#### GET /groups/:groupId/settlements
Get settlement history for group
**Query Parameters:** page, limit, startDate, endDate
**Response:** 200 OK with paginated list of settlement objects

### 8. Exchange Rates
#### GET /exchange-rates
Get exchange rates (optional filtering)
**Query Parameters:** fromCurrency, toCurrency, date
**Response:** 200 OK with array of rate objects

#### POST /exchange-rates
Add manual exchange rate (admin only)
**Request:**
```json
{
  "fromCurrency": "EUR",
  "toCurrency": "USD",
  "rate": 1.08,
  "date": "2024-04-15T00:00:00Z",
  "source": "Manual"
}
```
**Response:** 201 Created

### 9. Audit
#### GET /audit/log
Get audit log entries (admin only)
**Query Parameters:** entityType, entityId, userId, startDate, endDate, page, limit
**Response:** 200 OK with paginated audit log entries

## Headers
- Content-Type: application/json (for JSON requests)
- Authorization: Bearer <jwt_token>
- Accept: application/json

## Status Codes
- 200: OK
- 201: Created
- 202: Accepted (for async operations like import start)
- 204: No Content
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (e.g., duplicate email)
- 422: Unprocessable Entity (semantic error)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error
- 503: Service Unavailable

## Versioning
- API version is in the path: `/api/v1/*`
- Version increments for breaking changes
- Minor versions may be added via headers if needed

## Rate Limiting
- Auth endpoints: 5 attempts per minute per IP
- General API: 100 requests per minute per user
- Import endpoints: 10 imports per hour per user

## Security
- All passwords are hashed using bcrypt
- JWT tokens are signed with HS256 using server secret
- Input validation prevents SQL injection and XSS
- Rate limiting mitigates brute force attacks
- CORS policies restrict origins to trusted domains