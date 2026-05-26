/**
 * Ambient type declarations for @vhyxseal/style CSS package.
 *
 * @vhyxseal/style is a CSS-only package with no TypeScript exports.
 * These declarations tell TypeScript the modules exist so that
 * `import '@vhyxseal/style'` in index.ts compiles without error.
 *
 * No build step required — this is a type hint only.
 * The actual CSS injection is handled by the consumer's bundler
 * (Vite, webpack, etc.) when it processes the side-effect import.
 */
declare module '@vhyxseal/style' {}
declare module '@vhyxseal/style/colors' {}
declare module '@vhyxseal/style/safety' {}
