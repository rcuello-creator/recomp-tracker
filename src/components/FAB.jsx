import React from 'react';

// Floating action button — pinned bottom-right, above the bottom nav.
export const FAB = ({ onClick, label = 'Add' }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="fixed right-5 z-40 w-14 h-14 rounded-full bg-blue-500 text-white text-3xl font-light flex items-center justify-center shadow-lg active:scale-95 transition-transform"
    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0.5rem) + 5rem)' }}
  >
    +
  </button>
);
