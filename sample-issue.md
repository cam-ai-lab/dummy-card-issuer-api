# Add Minimum Payment Due Amount to Credit Card Account API

## Summary
Add a `minimumDue` field to the credit card account endpoint response to inform account holders of the minimum payment amount required by the payment due date.

## Business Context
Credit card account holders need to know the minimum payment amount they must pay by the due date to:
- Avoid late payment fees
- Prevent negative credit reporting
- Maintain their account in good standing
- Plan their monthly finances effectively

The minimum payment is typically calculated as the greater of:
- A fixed minimum amount (e.g., $25)
- A percentage of the total balance (e.g., 1-3%)
- The full balance if below the fixed minimum

## Current Behavior
The `/credit-cards/{accountId}` endpoint currently returns:
```json
{
  "accountId": "001234567890123",
  "totalBalance": 1250.75,
  "membershipRewardPoints": 15420,
  "paymentDueDate": "2025-08-15"
}
```

Account holders can see their total balance and payment due date but must calculate or guess the minimum payment amount.

## Proposed Solution
Add a `minimumDue` field to the existing response:
```json
{
  "accountId": "001234567890123",
  "totalBalance": 1250.75,
  "minimumDue": 37.52,
  "membershipRewardPoints": 15420,
  "paymentDueDate": "2025-08-15"
}
```

## Technical Implementation Details

### API Changes
1. Update the `CreditCardAccount` TypeScript interface
2. Modify the OpenAPI schema for the 200 response
3. Update mock data to include realistic minimum due calculations
4. Ensure the field follows camelCase naming convention per Spectral rules

### Business Logic
- If `totalBalance` ≤ $25: `minimumDue` = `totalBalance`
- If `totalBalance` > $25: `minimumDue` = max($25, `totalBalance` * 0.03)
- Round to 2 decimal places

## Acceptance Criteria

### Functional Requirements
- [ ] The `/credit-cards/{accountId}` endpoint returns a `minimumDue` field in the response
- [ ] The `minimumDue` value is calculated correctly based on the business logic rules
- [ ] The `minimumDue` is always a positive number with exactly 2 decimal places
- [ ] The `minimumDue` is never greater than the `totalBalance`
- [ ] If `totalBalance` is 0, then `minimumDue` is 0

### Technical Requirements
- [ ] The `minimumDue` property is added to the `CreditCardAccount` interface
- [ ] The OpenAPI schema is updated with the new field including proper description
- [ ] The field follows camelCase naming convention (passes Spectral validation)
- [ ] All existing tests continue to pass
- [ ] The response example in the API documentation includes the new field

### Testing Requirements
- [ ] Unit tests are added for the minimum payment calculation logic
  - [ ] Test when balance is $0
  - [ ] Test when balance is less than $25
  - [ ] Test when balance equals $25
  - [ ] Test when balance is greater than $25
  - [ ] Test decimal rounding scenarios
- [ ] Integration tests are updated to verify the new field in API responses
  - [ ] Test successful response includes `minimumDue`
  - [ ] Test the field is present for all test accounts
  - [ ] Test the field type is number
- [ ] Test coverage remains at or above 80%

### Documentation Requirements
- [ ] OpenAPI schema includes description: "Minimum payment amount due by the payment due date"
- [ ] Field is marked as required in the schema
- [ ] API documentation is regenerated and accessible at `/docs`
- [ ] README is updated if necessary

### Definition of Done
- [ ] Code is implemented following the patterns in COPILOT-INSTRUCTIONS.md
- [ ] All acceptance criteria are met
- [ ] Code passes all linting rules (`npm run lint` and `npm run lint:spectral`)
- [ ] All tests pass (`npm test`)
- [ ] Code is peer-reviewed and approved
- [ ] Changes are tested manually in development environment
- [ ] API documentation at `/docs` correctly displays the new field

## Additional Notes
- This is a backward-compatible change (adding a new field)
- No database schema changes required for this MVP (using mock data)
- Future consideration: Add `minimumDueBreakdown` to show how the minimum was calculated

## Dependencies
None - this is a self-contained enhancement to the existing endpoint

## Estimated Effort
- Development: 2-3 hours
- Testing: 1-2 hours
- Code Review: 1 hour
- **Total: 4-6 hours**

## Labels
`enhancement` `api` `good-first-issue` `credit-cards`

## Priority
Medium - This directly impacts user experience and financial planning capabilities

---
*Please assign this issue to me if you'd like me to work on it. I'll ensure all tests are included as per our development standards.*
