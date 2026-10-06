'use client';

import React from 'react';
import { SearchIcon } from '@vhyxui/icons';

/** Large search field on the docs home; opens the shared Search dialog via its custom event. */
export function SearchLauncher(): React.ReactElement {
  return (
    <button type="button" className="dh-search" onClick={() => { window.dispatchEvent(new Event('vhyxseal:opensearch')); }}>
      <SearchIcon size={18} aria-hidden="true" />
      <span>Search the docs</span>
      <kbd>⌘K</kbd>
    </button>
  );
}
