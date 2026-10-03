"use client";

import { VhyxChart } from "@vhyxchart/react";

const SOURCE = `flowchart LR
  cart([Cart])
  ship["shipping<br/>low"]:::info
  pay["place-order<br/>high"]:::warning
  confirm{"A person confirms"}:::danger
  done([Order placed]):::success
  cart --> ship --> pay --> confirm --> done

scenario An agent checks out
  cart -> ship : fill-address
  ship is done
  ship -> pay : place-order
  pay is warn
  caption High safety — the contract says ask first
  pay -> confirm : ask a person
  confirm is done
  confirm -> done
  done is done
`;

/** A checkout manifest drawn as an animated VhyxChart flow. */
export function CheckoutFlow(): React.ReactElement {
  return <VhyxChart source={SOURCE} autoplay controls />;
}
