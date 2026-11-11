import React from 'react';
import { Spinner } from './ui/Spinner.js';
import { Skeleton } from './ui/Skeleton.js';

export function LoadingState({
  label,
  detail,
  rows = 3
}: {
  label: string;
  detail?: string;
  rows?: number;
}) {
  return (
    <div className="ordex-loading-panel" role="status" aria-live="polite">
      <div className="ordex-loading-caption">
        <Spinner aria-hidden="true" />
        <div>
          <strong>{label}</strong>
          {detail && <p>{detail}</p>}
        </div>
      </div>
      <div className="ordex-loading-rows" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div className="ordex-loading-row" key={index}>
            <Skeleton />
            <div className="ordex-loading-lines">
              <Skeleton />
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
