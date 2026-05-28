import { CodeBlock } from "../../../components/CodeBlock";
import { OnThisPage } from "../../../components/OnThisPage";
import { PrevNext } from "../../../components/PrevNext";

// ── Code examples ─────────────────────────────────────────────────────────

const installCode = `npm install @vhyxseal/vue @vhyxseal/core`;

const pluginSetupCode = `// main.ts — install the plugin
import { createApp } from 'vue'
import { VhyxSealPlugin } from '@vhyxseal/vue'
import App from './App.vue'

const app = createApp(App)

app.use(VhyxSealPlugin, {
  config: {
    domain: "example.com",
    domainVerified: false,
    verificationToken: "",
    agentPolicy: {
      allowedAgents: ["*"],
      requiresConfirmation: ["place-order", "delete-account"],
    },
    cacheDurationSeconds: 3600,
  },
  dev: process.env.NODE_ENV !== "production",
})

app.mount('#app')`;

const composablesCode = `<script setup lang="ts">
import { useSeal, useContract, useCapability, useAgentAction } from '@vhyxseal/vue'

// useSeal — access the plugin context (must be inside a component setup)
const { manifest, contracts } = useSeal()

// useContract — read a specific contract by id
const checkoutContract = useContract('checkout-submit-btn')

// useCapability — read the full capability map
const capability = useCapability()
console.log(capability.counts) // { total, full, inferred }

// useAgentAction — track agent action lifecycle (standalone, no plugin needed)
const { record, initiate, complete, cancel } = useAgentAction()
</script>`;

const useSealOutsideCode = `// useSeal() throws VhyxSealError when called outside the plugin
// This is the correct behavior — document this in your app's error handling

import { useSeal } from '@vhyxseal/vue'
import { VhyxSealError } from '@vhyxseal/core'

// Inside a component setup() — correct
const { manifest } = useSeal() // works

// Outside a component setup() — throws
try {
  const result = useSeal() // throws VhyxSealError
} catch (e) {
  if (e instanceof VhyxSealError) {
    // code: VHYX_CONTRACT_VALIDATION_FAILED
    // message: "useSeal() must be called inside a Vue component setup()"
  }
}`;

const componentsCode = `<script setup lang="ts">
import { Button, Input, Form, Nav, Display, Confirmation } from '@vhyxseal/vue'
import { defineContract } from '@vhyxseal/core'

const searchContract = defineContract({
  id: "search-input",
  type: "input",
  intent: "search",
  description: "Search site content",
  requires: [], requiredPermissions: [],
  consequence: "Filters content to match query",
  affects: ["search-results"],
  reversible: true, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})
</script>

<template>
  <!-- Components accept a :contract prop -->
  <Input :contract="searchContract" placeholder="Search..." />
  <Button :contract="submitContract" type="submit">Search</Button>

  <!-- Confirmation uses a scoped slot -->
  <Confirmation :contract="deleteContract">
    <template #default="{ confirmed, isPending, confirm, cancel }">
      <dialog v-if="isPending" open>
        <p>Delete this item permanently?</p>
        <button @click="confirm">Delete</button>
        <button @click="cancel">Cancel</button>
      </dialog>
      <Button :contract="deleteContract" @click="isPending ? undefined : requestDelete()">
        Delete
      </Button>
    </template>
  </Confirmation>
</template>`;

const composableRefCode = `// All composables are re-exported from @vhyxseal/vue
import {
  useSeal,        // Access plugin context — manifest, contracts map
  useContract,    // useContract(id: string) — get contract by component id
  useCapability,  // useCapability() — full capability map with counts
  useAgentAction, // useAgentAction() — track action lifecycle (standalone)
} from '@vhyxseal/vue'`;

const typesCode = `// TypeScript types from @vhyxseal/vue
import type {
  VhyxSealPluginOptions,  // Options for app.use(VhyxSealPlugin, options)
  SealContextValue,       // Value injected by the plugin (useSeal() return type)
} from '@vhyxseal/vue'

// Core types are re-exported from @vhyxseal/core directly
import type {
  ComponentContract,
  ManifestConfig,
  VhyxSealManifest,
} from '@vhyxseal/core'`;

const example1Code = `<!-- Example 1 — Form with validation and confirmation -->
<script setup lang="ts">
import { Form, Input, Button, Confirmation } from '@vhyxseal/vue'
import { defineContract, defineRelationship } from '@vhyxseal/core'

const emailContract = defineContract({
  id: "newsletter-email-input", type: "input", intent: "collect-email",
  description: "Email address for newsletter subscription",
  requires: [], requiredPermissions: [],
  consequence: "Stores email for newsletter",
  affects: ["newsletter-subscribers"],
  reversible: true, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})

const subscribeContract = defineContract({
  id: "newsletter-subscribe-btn", type: "action", intent: "submit-form",
  description: "Subscribe to the newsletter",
  requires: [{ field: "email.isValid", operator: "===", value: true, description: "Email must be valid" }],
  requiredPermissions: [],
  consequence: "Adds email to newsletter list",
  affects: ["newsletter-subscribers"],
  reversible: false, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})
</script>

<template>
  <Form :contract="newsletterFormContract">
    <Input :contract="emailContract" type="email" v-model="email" />
    <Button :contract="subscribeContract" type="submit" :disabled="!emailValid">
      Subscribe
    </Button>
  </Form>
</template>`;

const example2Code = `<!-- Example 2 — Navigation with active state -->
<script setup lang="ts">
import { Nav } from '@vhyxseal/vue'
import { defineContract } from '@vhyxseal/core'
import { useRoute } from 'vue-router'

const route = useRoute()

const navContract = defineContract({
  id: "main-navigation",
  type: "navigation",
  intent: "navigate",
  description: "Main site navigation",
  requires: [], requiredPermissions: [],
  consequence: "Navigates to selected section",
  affects: ["current-page"],
  reversible: true, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})
</script>

<template>
  <Nav :contract="navContract" aria-label="Main navigation">
    <a v-for="link in navLinks" :key="link.href"
       :href="link.href"
       :aria-current="route.path === link.href ? 'page' : undefined">
      {{ link.label }}
    </a>
  </Nav>
</template>`;

// ── Styles ────────────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--docs-text)", marginBottom: "8px", marginTop: 0 };
const h2Style: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--docs-text)", marginBottom: "16px", marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--docs-border)" };
const h3Style: React.CSSProperties = { fontSize: "1rem", fontWeight: 600, color: "var(--docs-text)", marginBottom: "8px", marginTop: "24px" };
const leadStyle: React.CSSProperties = { fontSize: "1.0625rem", color: "var(--docs-text-muted)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "660px" };
const noteStyle: React.CSSProperties = { fontSize: "13px", color: "var(--docs-text-muted)", lineHeight: 1.7, marginBottom: "12px" };

/**
 * Vue adapter guide — nine sections.
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function VueGuidePage(): React.ReactElement {
  return (
    <>
      <OnThisPage />
      <h1 style={h1Style}>Vue Adapter</h1>
      <p style={leadStyle}>
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>@vhyxseal/vue</code>{" "}
        provides composables, headless components, and a Vue plugin for
        integrating VhyxSeal into Vue 3 applications. The adapter mirrors
        the React adapter API — developers familiar with the React adapter
        will find the Vue API immediately familiar.
      </p>

      {/* 1 */}
      <section>
        <h2 style={h2Style}>What the Adapter Provides</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li><strong style={{ color: "var(--docs-text)" }}>VhyxSealPlugin</strong> — Vue plugin (app.use) that installs the contract context</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useSeal()</strong> — access manifest and contracts map from any component</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useContract(id)</strong> — read a registered contract by component id</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useCapability()</strong> — read the full capability map with counts</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useAgentAction()</strong> — track agent action lifecycle (standalone, no plugin needed)</li>
          <li><strong style={{ color: "var(--docs-text)" }}>Button, Input, Form, Nav, Display, Confirmation</strong> — headless components with contract registration</li>
        </ul>
      </section>

      {/* 2 */}
      <section>
        <h2 style={h2Style}>Installation</h2>
        <CodeBlock code={installCode} lang="bash" />
        <p style={{ ...noteStyle, marginTop: "8px" }}>Vue ≥ 3.3.0 required.</p>
      </section>

      {/* 3 */}
      <section>
        <h2 style={h2Style}>Full Setup</h2>
        <CodeBlock code={pluginSetupCode} lang="typescript" filename="main.ts" />
      </section>

      {/* 4 */}
      <section>
        <h2 style={h2Style}>VhyxSealPlugin Configuration</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
            <thead>
              <tr>
                {["Option", "Type", "Description"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--docs-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["config", "ManifestConfig", "Required. Same shape as React SealProvider config"],
                ["dev", "boolean", "Optional. Enable verbose logging and DevTools"],
              ].map(([opt, type, desc]) => (
                <tr key={String(opt)}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--vhyxseal-color-info)" }}>{opt}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--docs-text-muted)" }}>{type}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "13px", color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 */}
      <section>
        <h2 style={h2Style}>Composables Usage</h2>
        <CodeBlock code={composablesCode} lang="typescript" />
        <h3 style={h3Style}>useSeal() outside plugin context</h3>
        <p style={{ ...noteStyle, border: "1px solid var(--vhyxseal-color-inferred)", borderRadius: "6px", padding: "12px 16px", backgroundColor: "var(--docs-surface)" }}>
          <strong style={{ color: "var(--docs-text)" }}>Important:</strong>{" "}
          useSeal() throws a VhyxSealError (not a plain Error) when called outside
          a component setup() or when called without the plugin installed. This is
          the correct behavior — it means the component is missing its contract
          infrastructure. Catch VhyxSealError specifically in error boundaries.
        </p>
        <CodeBlock code={useSealOutsideCode} lang="typescript" />
      </section>

      {/* 6 */}
      <section>
        <h2 style={h2Style}>Composables Reference</h2>
        <CodeBlock code={composableRefCode} lang="typescript" />
        <h3 style={h3Style}>Component Usage</h3>
        <CodeBlock code={componentsCode} lang="html" />
      </section>

      {/* 7 */}
      <section>
        <h2 style={h2Style}>TypeScript Types</h2>
        <CodeBlock code={typesCode} lang="typescript" />
      </section>

      {/* 8 */}
      <section>
        <h2 style={h2Style}>Common Patterns</h2>
        <h3 style={h3Style}>Form with validation and confirmation</h3>
        <CodeBlock code={example1Code} lang="html" />
        <h3 style={{ ...h3Style, marginTop: "32px" }}>Navigation with active state</h3>
        <CodeBlock code={example2Code} lang="html" />
      </section>

      {/* 9 */}
      <section style={{ paddingBottom: "80px" }}>
        <h2 style={h2Style}>Known Limitations</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>useSeal() throws VhyxSealError (not raw Error) when called outside plugin — catch specifically</li>
          <li>Vue components are implemented as TypeScript files using defineComponent and h() render functions — not .vue SFC files. The API is identical from the consumer perspective</li>
          <li>Vue devtools integration (separate from @vhyxseal/devtools) is planned for a future release</li>
          <li>useAgentAction() is standalone — it does not require VhyxSealPlugin to be installed</li>
        </ul>
      </section>
      <PrevNext />
    </>
  );
}
