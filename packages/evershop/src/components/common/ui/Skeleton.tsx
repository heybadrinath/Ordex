import { cn } from '@evershop/evershop/lib/util/cn';
import React from 'react';
import '../Loading.scss';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('ordex-skeleton rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
