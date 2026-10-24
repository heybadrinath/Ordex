import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { cn } from '@evershop/evershop/lib/util/cn';
import React from 'react';
import '../Loading.scss';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="status"
      aria-label={_('Loading')}
      className={cn('size-4 ordex-progress-mark', className)}
      {...props}
    >
      <rect x="2" y="9" width="5" height="6" rx="1.7" />
      <rect x="9.5" y="9" width="5" height="6" rx="1.7" />
      <rect x="17" y="9" width="5" height="6" rx="1.7" />
    </svg>
  );
}

export { Spinner };
