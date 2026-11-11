import React from 'react';

export function Brand({ studio = false }: { studio?: boolean }) {
  return (
    <>
      <span className="brand-wordmark">
        ordex
        <span className="brand-dot" aria-hidden="true">
          .
        </span>
      </span>
      {studio && <small>STUDIO</small>}
    </>
  );
}
