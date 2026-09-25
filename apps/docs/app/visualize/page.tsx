"use client";

import React from "react";
import { VhyxChart } from "@vhyxchart/react";
import { Alert, Badge, HStack, Stack, Text, VhyxUIProvider } from "@vhyxui/react";
import { CodeBlock } from "../../components/CodeBlock";

const MAP = `---
title: shop.example — agent contract map
---
flowchart LR
  search[/search<br/>low/]:::success
  cart[add-to-cart<br/>medium]:::info
  checkout[place-order<br/>high · confirm]:::warn
  pay{make-payment<br/>critical · confirm}:::danger
  done(display-data<br/>low):::success
  search -->|ok| cart -->|ok| checkout -->|ok| pay -->|ok| done
  checkout -.->|fail| cart
  pay -.->|fail| checkout

scenario Purchase an item (what an agent does)
  search is active
  search -> cart : ok
  search is done
  cart -> checkout
  checkout is warn
  note checkout : human confirmation required
  wait 700ms
  checkout -> pay
  pay is warn
  note pay : critical — always ask the human
  wait 700ms
  pay -> done : paid
  pay, checkout are done
  done is done

scenario Payment declined
  cart -> checkout
  checkout -> pay
  pay is error
  pay -> checkout : fail
  note checkout : recovery: update payment method`;

export default function VisualizePage(): React.ReactElement {
  return (
    <VhyxUIProvider skipLink={false}>
      <Stack gap={5}>
        <Stack gap={2}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--docs-text)", margin: 0 }}>Visualize contracts</h1>
          <Text tone="subtle">
            <code>vhyxseal visualize manifest.json</code> turns any manifest into an animated VhyxChart diagram: components
            coloured by safety level, relationships as edges, and every sequence relationship as a scenario you can play.
          </Text>
          <HStack gap={2} wrap>
            <Badge variant="success">low</Badge><Badge variant="info">medium</Badge><Badge variant="warning">high</Badge><Badge variant="danger">critical</Badge>
          </HStack>
        </Stack>
        <VhyxChart source={MAP} />
        <Alert variant="info" title="Try it with your own manifest">The playground has a live visualizer: paste JSON or load a site&apos;s /__agent__/manifest.json.</Alert>
        <CodeBlock lang="bash" code={`npx vhyxseal visualize public/__agent__/manifest.json -o contracts.vhyx
npx vhyxchart render contracts.vhyx          # animated SVG for your README
code contracts.vhyx                          # live preview with the VhyxChart VS Code extension`} />
      </Stack>
    </VhyxUIProvider>
  );
}
