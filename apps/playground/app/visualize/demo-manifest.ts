import { defineContract, generateManifest, type ComponentContract, type VhyxSealManifest } from '@vhyxseal/core';

const base = {
  requires: [],
  requiredPermissions: [],
  affects: [],
  reversible: true,
  requiresConfirmation: false,
  destructive: false,
  contractVersion: '1.0.0',
} as const;

const c = (overrides: Partial<ComponentContract> & Pick<ComponentContract, 'id' | 'type' | 'intent' | 'description' | 'consequence' | 'safetyLevel'>): ComponentContract =>
  defineContract({ ...base, ...overrides });

/** A realistic e-commerce manifest used as the default visualizer input. */
export function demoManifest(): VhyxSealManifest {
  const components = [
    c({ id: 'search-input', type: 'input', intent: 'search', description: 'Search the catalogue', consequence: 'Filters results', safetyLevel: 'low' }),
    c({ id: 'add-to-cart', type: 'action', intent: 'add-to-cart', description: 'Add item to cart', consequence: 'Cart changes', safetyLevel: 'medium', affects: ['cart'] }),
    c({ id: 'checkout-btn', type: 'action', intent: 'place-order', description: 'Place the order', consequence: 'Creates an order', safetyLevel: 'high', requiresConfirmation: true, affects: ['orders'] }),
    c({ id: 'confirm-payment', type: 'confirmation', intent: 'make-payment', description: 'Confirm and pay', consequence: 'Charges the card', safetyLevel: 'critical', requiresConfirmation: true, reversible: false }),
    c({ id: 'order-status', type: 'display', intent: 'display-data', description: 'Order confirmation', consequence: 'None', safetyLevel: 'low' }),
    c({ id: 'delete-account', type: 'action', intent: 'delete-account', description: 'Delete the account', consequence: 'Removes all data', safetyLevel: 'critical', requiresConfirmation: true, destructive: true, reversible: false }),
  ];
  const manifest = generateManifest(components, { domain: 'shop.example', domainVerified: false, verificationToken: '' });
  return {
    ...manifest,
    relationships: [
      {
        type: 'sequence',
        id: 'purchase',
        description: 'Purchase an item',
        linear: true,
        steps: [
          { order: 1, componentId: 'search-input', canSkip: true, onComplete: 'add-to-cart', onFail: 'search-input' },
          { order: 2, componentId: 'add-to-cart', canSkip: false, onComplete: 'checkout-btn', onFail: 'search-input' },
          { order: 3, componentId: 'checkout-btn', canSkip: false, onComplete: 'confirm-payment', onFail: 'add-to-cart' },
          { order: 4, componentId: 'confirm-payment', canSkip: false, onComplete: 'order-status', onFail: 'checkout-btn' },
        ],
      },
      {
        type: 'dependency',
        id: 'cart-enables-checkout',
        source: 'add-to-cart',
        target: 'checkout-btn',
        condition: { field: 'cart.hasItems', operator: '===', value: true, description: 'Cart must have items' },
        effect: 'enables',
        description: 'Checkout is enabled once the cart has items',
      },
    ],
  };
}
