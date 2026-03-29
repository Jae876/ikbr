# Backend API Integration Guide

This document specifies the API endpoints required to fully integrate this frontend with a backend system.

## API Base URL

The frontend expects the API at:

```
VITE_API_URL environment variable (default: /api)
```

Example:
```
http://localhost:3000/api        (Development)
https://yourdomain.com/api       (Production)
https://api.yourdomain.com       (Subdomain)
```

## Authentication

### JWT Token Flow

1. Frontend calls `POST /auth/login` with credentials
2. Backend returns JWT token
3. Frontend stores in `localStorage['auth_token']`
4. All requests include header: `Authorization: Bearer <token>`
5. Backend validates token in each request

### Login Request

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Login Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Smith",
    "accountType": "individual",
    "status": "active"
  }
}
```

### Register Request

```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Smith",
  "accountType": "individual"
}
```

### Logout

```
POST /auth/logout
Authorization: Bearer <token>
```

## Response Format

### Success Response (200-299)

```json
{
  "data": { /* response data */ },
  "status": 200,
  "message": "Success"
}
```

Or for single objects:

```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John"
}
```

Arrays are returned directly:

```json
[
  { "id": "1", "name": "Account 1" },
  { "id": "2", "name": "Account 2" }
]
```

### Error Response (400+)

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {}
  },
  "status": 401
}
```

## Endpoints Required

### Authentication Endpoints

#### 1. Login

```
POST /api/auth/login
Authorization: None
Content-Type: application/json

Request:
{
  "email": string,
  "password": string
}

Response (200):
{
  "token": string,
  "user": User
}

Error: 401 Invalid credentials
```

#### 2. Register

```
POST /api/auth/register
Authorization: None
Content-Type: application/json

Request:
{
  "email": string,
  "password": string,
  "name": string,
  "accountType": "individual" | "joint" | "ira" | "corporate"
}

Response (201):
User object

Error: 400 Validation error, 409 Email exists
```

#### 3. Logout

```
POST /api/auth/logout
Authorization: Bearer {token}

Response (200): { "message": "Logged out successfully" }
```

---

### Account Endpoints

#### 4. Get All Accounts

```
GET /api/accounts
Authorization: Bearer {token}

Response (200): Account[]

Returns all accounts for the authenticated user.

[
  {
    "id": "acc123",
    "userId": "user123",
    "accountNumber": "DU123456",
    "type": "Individual",
    "balance": 125340.50,
    "buyingPower": 45670.23,
    "cashBalance": 12340.50,
    "marginLevel": 2.0
  }
]
```

#### 5. Get Account Details

```
GET /api/accounts/{accountId}
Authorization: Bearer {token}

Response (200): Account

Error: 404 Account not found
```

---

### Position Endpoints

#### 6. Get Positions

```
GET /api/accounts/{accountId}/positions
Authorization: Bearer {token}
Query Params: optional
  - sort: "symbol" | "value" | "unrealizedPL"
  - order: "asc" | "desc"

Response (200): Position[]

[
  {
    "id": "pos123",
    "accountId": "acc123",
    "symbol": "AAPL",
    "quantity": 50,
    "avgCost": 185.20,
    "currentPrice": 189.95,
    "unrealizedPL": 237.50,
    "unrealizedPLPercent": 2.56,
    "marketValue": 9497.50
  }
]
```

#### 7. Close Position

```
DELETE /api/accounts/{accountId}/positions/{positionId}
Authorization: Bearer {token}
Content-Type: application/json

Request (optional):
{
  "price": number (optional - execution price)
}

Response (200):
{
  "message": "Position closed",
  "trade": Trade (resulting trade object)
}

Error: 404 Position not found
```

---

### Trade Endpoints

#### 8. Get Trades

```
GET /api/accounts/{accountId}/trades
Authorization: Bearer {token}
Query Params:
  - limit: number (default: 100)
  - offset: number (default: 0)
  - status: "filled" | "pending" | "cancelled"
  - symbol: string (filter by symbol)
  - startDate: ISO date
  - endDate: ISO date

Response (200): Trade[]

[
  {
    "id": "trade123",
    "accountId": "acc123",
    "symbol": "AAPL",
    "type": "buy",
    "quantity": 50,
    "price": 185.20,
    "commission": 2.50,
    "timestamp": "2024-02-20T10:30:00Z",
    "status": "filled"
  }
]
```

#### 9. Place Trade (Buy/Sell)

```
POST /api/accounts/{accountId}/trades
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "symbol": string,
  "type": "buy" | "sell",
  "quantity": number,
  "price": number,
  "commission": number (backend calculated if not provided)
}

Response (201): Trade

Error: 400 Invalid trade, 403 Insufficient funds
```

---

### Order Endpoints

#### 10. Get Orders

```
GET /api/accounts/{accountId}/orders
Authorization: Bearer {token}
Query Params:
  - status: "pending" | "active" | "filled" | "cancelled"
  - symbol: string

Response (200): Order[]

[
  {
    "id": "order123",
    "accountId": "acc123",
    "symbol": "AAPL",
    "type": "limit",
    "action": "buy",
    "quantity": 50,
    "price": 185.00,
    "stopPrice": null,
    "timeInForce": "day",
    "status": "active",
    "createdAt": "2024-02-20T10:30:00Z"
  }
]
```

#### 11. Place Order

```
POST /api/accounts/{accountId}/orders
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "symbol": string,
  "type": "market" | "limit" | "stop" | "bracket",
  "action": "buy" | "sell",
  "quantity": number,
  "price": number (required for limit orders),
  "stopPrice": number (for stop orders),
  "timeInForce": "day" | "gtc" | "opg"
}

Response (201): Order

Error: 400 Invalid order, 403 Market closed
```

#### 12. Cancel Order

```
DELETE /api/accounts/{accountId}/orders/{orderId}
Authorization: Bearer {token}

Response (200):
{
  "message": "Order cancelled",
  "order": Order
}

Error: 404 Order not found, 400 Cannot cancel filled order
```

---

### Market Data Endpoints

#### 13. Get Quote

```
GET /api/market/quote/{symbol}
Authorization: Optional (token if available for real-time data)
Query Params:
  - realtime: boolean (default: false - returns delayed data for demo)

Response (200): MarketData

{
  "symbol": "AAPL",
  "price": 189.95,
  "open": 188.50,
  "high": 191.25,
  "low": 187.80,
  "volume": 52341000,
  "change": 1.45,
  "changePercent": 0.77,
  "timestamp": "2024-02-20T16:00:00Z"
}

Error: 404 Symbol not found
```

#### 14. Search Symbols

```
GET /api/market/search
Authorization: None
Query Params:
  - q: string (search query)
  - limit: number (default: 10)

Response (200):

[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "type": "equity",
    "currency": "USD"
  },
  {
    "symbol": "AAPL220318C150",
    "name": "Apple Apr 20 2024 150 Call",
    "type": "option"
  }
]
```

#### 15. Get Historical Data

```
GET /api/market/history/{symbol}
Authorization: Bearer {token} (for real-time, none for delayed)
Query Params:
  - period: "1d" | "1w" | "1mo" | "3mo" | "6mo" | "1y" | "5y"
  - interval: "1m" | "5m" | "1h" | "1d" (default: depends on period)

Response (200):

[
  {
    "timestamp": "2024-02-20T00:00:00Z",
    "open": 188.50,
    "high": 191.25,
    "low": 187.80,
    "close": 189.95,
    "volume": 52341000
  }
]

Error: 404 Symbol not found
```

---

## Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Process response |
| 204 | No Content | Success, no data |
| 400 | Bad Request | Show validation error to user |
| 401 | Unauthorized | Clean token, redirect to login |
| 403 | Forbidden | Show "Insufficient permissions" |
| 404 | Not Found | Show "Resource not found" |
| 409 | Conflict | Show "Already exists" error |
| 429 | Too Many Requests | Implement exponential backoff |
| 500 | Server Error | Show generic error, retry |
| 503 | Service Unavailable | Show maintenance message |

## Error Handling

The frontend API client handles:

```typescript
// Response interceptor handles errors
error.response?.status === 401 → Clear token, redirect to /login
error.response?.status === 500 → Show error notification
error.message === Network Error → Show "Connection failed"
```

## Rate Limiting

Implement:
- Rate limiting headers: `X-RateLimit-*`
- Error 429 with retry-after header
- Frontend polling: 5-second minimum for live data

## CORS Configuration

Backend must allow:

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

## Pagination

For list endpoints (trades, orders, positions):

```
Query Params:
- limit: 50 (default)
- offset: 0 (default)

Response:
{
  "data": [],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "pages": 5
  }
}
```

## Real-Time Updates (Optional)

For live market data, implement WebSocket:

```javascript
const ws = new WebSocket('wss://yourdomain.com/market')

ws.onmessage = (event) => {
  const quote = JSON.parse(event.data)
  // Update UI with real-time quote
}
```

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Accounts
curl -X GET http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <token>"

# Place Trade
curl -X POST http://localhost:3000/api/accounts/acc123/trades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"symbol":"AAPL","type":"buy","quantity":10,"price":189.95}'
```

### Using Postman

1. Create collection "Interactive Brokers API"
2. Add requests for each endpoint
3. Use environment variables for token and base URL
4. Save responses as test cases

## Implementation Checklist

- [ ] Implement all 15 endpoints
- [ ] Add request validation
- [ ] Add response validation
- [ ] Implement error handling
- [ ] Add CORS headers
- [ ] Add rate limiting
- [ ] Add logging
- [ ] Add authentication
- [ ] Add authorization
- [ ] Test each endpoint
- [ ] Document any differences
- [ ] Set up monitoring
- [ ] Load test the API

## Backend Technology Recommendations

Choose based on your needs:

### Node.js/Express
- **Pros**: JavaScript, fast, many libraries
- **Learning curve**: Low
- **Deployment**: Easy on most hosts

### Python/Django
- **Pros**: Robust ORM, great for data
- **Learning curve**: Medium
- **Deployment**: Requires Python hosting

### Go/Gin
- **Pros**: Fast, compiled, concurrent
- **Learning curve**: Medium
- **Deployment**: Single binary

### C#/.NET
- **Pros**: Enterprise features, type-safe
- **Learning curve**: Medium-High
- **Deployment**: Windows compatible

### PHP (cPanel Native)
- **Pros**: cPanel native, easy deployment
- **Learning curve**: Easy
- **Deployment**: Simplest on cPanel

## Deployment Considerations

1. **HTTPS Required** - All API calls must be HTTPS
2. **Token Expiry** - Implement token refresh endpoint
3. **Backup Tokens** - Implement refresh token flow
4. **Data Privacy** - Encrypt sensitive data
5. **Audit Logs** - Log all trading activities
6. **Backup** - Implement regular backups
7. **Testing** - Test failure scenarios
8. **Monitoring** - Set up error alerting

---

This comprehensive specification ensures smooth integration between the frontend and any backend system.
