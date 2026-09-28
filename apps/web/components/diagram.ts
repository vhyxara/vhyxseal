// How an agent uses a VhyxSeal site, validated with @vhyxchart/core parse().
export const AGENT_FLOW = `sequenceDiagram
  participant Agent as AI agent
  participant Site as Your site
  participant Person
  Agent->>Site: GET /__agent__/manifest.json
  Site-->>Agent: signed contracts
  Agent->>Agent: verify signature
  Agent->>Site: search products (low risk)
  Site-->>Agent: results
  Agent->>Person: place order? (high risk, confirm)
  Person-->>Agent: approve
  Agent->>Site: place-order + single-use token
  Site-->>Agent: 200 order created`;
