# Copilot Instructions for Credit Card Issuer API

## Business Context

### What is a Credit Card Issuer?
A credit card issuer is a financial institution (typically a bank or credit union) that provides credit cards to consumers. The issuer is responsible for:
- Approving credit card applications
- Setting credit limits and interest rates
- Processing transactions
- Managing customer accounts
- Sending monthly statements
- Collecting payments
- Providing customer service
- Managing rewards programs

### Key Business Concepts

#### 1. Total Balance
The total balance represents the complete amount owed on a credit card account at any given time. This includes:
- **Principal Balance**: Purchases, cash advances, and balance transfers
- **Interest Charges**: Accrued interest on unpaid balances
- **Fees**: Annual fees, late payment fees, over-limit fees, foreign transaction fees
- **Pending Transactions**: Authorized but not yet posted transactions

The total balance is crucial for:
- Determining minimum payment requirements
- Calculating interest charges
- Assessing credit utilization
- Setting spending limits

#### 2. Membership Reward Points
Reward points are incentives offered by credit card issuers to encourage card usage. Points are typically earned based on:
- Purchase amounts (e.g., 1 point per dollar spent)
- Bonus categories (e.g., 3x points on dining, 2x on travel)
- Sign-up bonuses
- Special promotions

Points can be redeemed for:
- Statement credits
- Travel bookings
- Gift cards
- Merchandise
- Cash back
- Transfer to partner loyalty programs

#### 3. Payment Due Date
The payment due date is the deadline by which the cardholder must make at least the minimum payment to avoid late fees and potential negative credit reporting. Key aspects:
- Typically 21-25 days after the statement closing date
- Same day each month for predictability
- Payments must be received by this date, not just sent
- Missing the due date results in late fees and potentially increased APR

## Technical Implementation Standards

### API Design Principles

1. **RESTful Design**: Follow REST conventions for resource naming and HTTP methods
2. **OpenAPI 3.0**: All endpoints must be documented with OpenAPI/Swagger specifications
3. **Consistent Error Handling**: Use standardized error response schemas
4. **Versioning**: Prepare for future API versions through proper URL structuring

### Code Style Guidelines

#### Naming Conventions (Enforced by Spectral)

1. **Property Names**: Use camelCase
   - ✅ `accountId`, `totalBalance`, `membershipRewardPoints`
   - ❌ `account_id`, `total-balance`, `MembershipRewardPoints`

2. **Schema Names**: Use PascalCase
   - ✅ `CreditCardAccount`, `ErrorResponse`, `PaymentHistory`
   - ❌ `creditCardAccount`, `error_response`, `payment-history`

3. **Operation IDs**: Use camelCase
   - ✅ `getCreditCard`, `updateBalance`, `redeemPoints`
   - ❌ `get-credit-card`, `UpdateBalance`, `redeem_points`

4. **Path Parameters**: Use camelCase
   - ✅ `/credit-cards/{accountId}`
   - ❌ `/credit-cards/{account-id}` or `/credit-cards/{account_id}`

#### Documentation Requirements

1. **Schemas**: Every schema must have a description and ideally an example
2. **Properties**: All properties should have descriptions
3. **Operations**: Must include:
   - `operationId`
   - `summary` (required)
   - `description` (recommended)
   - `tags` (required)

#### Response Requirements

1. **Success Responses**: Every operation must have at least one 2xx response
2. **Error Responses**: Operations should include 4xx responses where applicable
3. **Error Schema**: All 4xx and 5xx responses must use the `ErrorResponse` schema

### Testing Requirements

**IMPORTANT**: Every code change must include corresponding tests. No exceptions.

#### Test Coverage Expectations

1. **Unit Tests** (Minimum 80% coverage):
   - Test all business logic functions
   - Test data validation
   - Test error handling paths
   - Mock external dependencies

2. **Integration Tests**:
   - Test all API endpoints
   - Test both success and error scenarios
   - Validate response schemas
   - Test authentication/authorization

3. **Test File Structure**:
   ```
   tests/
   ├── unit/
   │   ├── services/
   │   ├── utils/
   │   └── validators/
   └── integration/
       ├── credit-cards/
       └── health/
   ```

4. **Test Naming Convention**:
   - Use descriptive test names: `should return 404 when account not found`
   - Group related tests with `describe` blocks
   - Use `it` or `test` consistently

### Development Workflow

1. **Before Writing Code**:
   - Review existing patterns in the codebase
   - Check Spectral rules compliance
   - Plan test cases

2. **While Coding**:
   - Write tests first (TDD approach preferred)
   - Ensure all Spectral rules pass
   - Document new endpoints in OpenAPI spec
   - Use TypeScript interfaces for type safety

3. **Before Committing**:
   - Run `npm test` to ensure all tests pass
   - Run `npm run lint:spectral` to validate API spec
   - Run `npm run lint` for code style
   - Ensure new code has test coverage

### Common Patterns

#### Error Response Format
```typescript
{
  error: string;      // Error type (e.g., "Not Found", "Bad Request")
  message: string;    // Human-readable error description
  code?: string;      // Optional application-specific error code
  details?: any;      // Optional additional error details
}
```

#### Successful Response Pattern
```typescript
// Single resource
{
  accountId: string;
  totalBalance: number;
  membershipRewardPoints: number;
  paymentDueDate: string;
}

// Collection
{
  data: Array<Resource>;
  total: number;
  page?: number;
  pageSize?: number;
}
```

#### Date Formatting
- Use ISO 8601 format: `YYYY-MM-DD` for dates
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ` for timestamps

### Security Considerations

1. **Account ID Format**: Must match pattern `^00[0-9]{13}$`
2. **Input Validation**: Validate all inputs before processing
3. **Rate Limiting**: Implement appropriate rate limits
4. **Authentication**: Use industry-standard authentication methods
5. **PCI Compliance**: Never log or store full credit card numbers

### Performance Guidelines

1. **Response Times**:
   - GET operations: < 200ms
   - POST/PUT operations: < 500ms
   - Bulk operations: < 2000ms

2. **Pagination**: Required for any endpoint returning collections
3. **Caching**: Implement appropriate cache headers
4. **Database Queries**: Optimize queries, use indexes

### Monitoring and Logging

1. **Structured Logging**: Use JSON format for all logs
2. **Log Levels**: Use appropriate levels (error, warn, info, debug)
3. **Correlation IDs**: Include request ID in all logs
4. **Metrics**: Track response times, error rates, and throughput

## Quick Reference

### Available Tags
- `Credit Cards` - Credit card account operations
- `Health` - System health and monitoring

### Environment Variables
```bash
PORT=3000                    # Server port
HOST=0.0.0.0               # Server host
LOG_LEVEL=info              # Logging level
NODE_ENV=development        # Environment
```

### Common Commands
```bash
npm run dev          # Start development server
npm test            # Run all tests
npm run test:unit   # Run unit tests only
npm run test:int    # Run integration tests only
npm run lint        # Run code linter
npm run lint:spectral # Validate OpenAPI spec
npm run build       # Build for production
npm start           # Start production server
```

## Getting Help

1. Check existing code patterns in the repository
2. Refer to the OpenAPI specification at `/docs`
3. Review Spectral rules in `.spectral.yaml`
4. Consult team lead for business logic questions
5. Follow PCI-DSS guidelines for payment card data

Remember: When in doubt, look at existing implementations and maintain consistency!