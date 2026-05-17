export { verifyContracts } from "./verify-contracts.js";
export type { ContractHealthReport, VerifyContractsResult } from "./verify-contracts.js";

export { detectDrift, isDriftWarning } from "./drift-detection.js";

export { toHaveValidContract, toHaveIntent, toBeAgentSafe, vhyxSealMatchers } from "./matchers.js";
export type { MatcherResult } from "./matchers.js";

export { mockAgentSession } from "./mock-agent.js";
export type { MockAgentAction, MockAgentSession } from "./mock-agent.js";
