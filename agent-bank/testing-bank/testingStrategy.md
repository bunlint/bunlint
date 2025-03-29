# Testing Strategy: BunLint

## 1. Core Philosophy & Goal

TDD drives development. **Goal:** Verify functional requirements & user
behaviors (`productContext.md`). Behavioral correctness > Code coverage.

## 2. Testing Priorities

1. **E2E:** (Highest) Verify user flows with real browser interactions.
2. **Integration:** (Medium) Verify module interactions with actual
   implementations.
3. **Unit:** (Low/Support) Verify clean isolated logic with no mocking.

## 3. Test Development & Review

- **Guidance:** Base tests on user actions/outcomes (Given-When-Then).
- **Mindset:** Use BDD-style descriptions in `testing-bank/*.md` files to define
  targets.
- **Mandatory Prerequisite:** **Test scenario MUST be documented in the relevant
  `testing-bank/*.md` file BEFORE creating `.test.ts`.**
- **Lint Compliance:** Use `bun lint` as the compass for every test code change to ensure compliance with established lint rules.
- **Crucial Review:** Human review validates tests against **documented
  scenario** for functional relevance, correctness. Reject/refine tests
  implemented without prior `.md` documentation or irrelevant tests.
- **Real Implementations:** Prefer real components/services over mocks when
  possible. Only mock:
  - External APIs/Services
  - Non-deterministic sources (Date/Random)
  - Performance-sensitive operations
- **Isolation:** Tests must not share state. Each test:
  - Uses fresh instances
  - Cleans up resources
  - Runs in isolated environment
- **DRY Enforcement:**
  - Create `test/utils` directory for shared test utilities
  - Use factory functions for test data creation
  - Extract common assertions into custom matchers

## 4. Tooling (Initial)

- **E2E:** .
- **Integration/Unit:** `bun test`. Consider RTL.

## 5. Coverage

Focus on meaningful scenario coverage. Metrics secondary.
