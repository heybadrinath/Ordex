// Modified for Ordex on 20 October 2026.
import { cn } from '@evershop/evershop/lib/util/cn';
import {
  Store,
  Users,
  Package,
  Truck,
  Route,
  CircleDollarSign,
  Settings
} from 'lucide-react';
import React from 'react';

export interface SettingMenuItemProps {
  /** Destination, resolved server-side via the `url(routeId:)` GraphQL field. */
  url: string;
  title: string;
  description: string;
}

/** Navigation shared by the active settings pages. */
export function SettingMenuItem({
  url,
  title,
  description
}: SettingMenuItemProps) {
  // Resolved after mount, not during render: `window` is undefined during SSR,
  // so computing this inline renders inactive on the server and active on the
  // client — a hydration mismatch. Same pattern as `NavigationItem`.
  const [isActive, setIsActive] = React.useState(false);
  const itemRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const active =
      new URL(url, window.location.origin).pathname ===
      window.location.pathname;
    setIsActive(active);
    if (active && window.matchMedia('(max-width: 760px)').matches) {
      const item = itemRef.current;
      const menu = item?.parentElement;
      if (item && menu) {
        menu.scrollLeft +=
          item.getBoundingClientRect().left -
          menu.getBoundingClientRect().left -
          (menu.clientWidth - item.offsetWidth) / 2;
      }
    }
  }, [url]);

  const section = new URL(url, 'http://localhost').pathname.split('/').pop();
  const icons: Record<string, typeof Store> = {
    store: Store,
    customer: Users,
    catalog: Package,
    shipping: Truck,
    shippingProviders: Route,
    tax: CircleDollarSign
  };
  const Icon = icons[section || ''] || Settings;
  return (
    <a
      ref={itemRef}
      href={url}
      title={description}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive ? 'true' : 'false'}
      className={cn(
        'settings-nav-item group flex items-start gap-3 px-4 py-3 outline-none transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:ring-inset',
        isActive
          ? 'bg-primary/5 dark:bg-primary/10'
          : 'hover:bg-muted/60 active:bg-muted'
      )}
    >
      <span className="settings-nav-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-sm leading-snug',
            isActive
              ? 'text-primary font-semibold'
              : 'text-foreground font-medium'
          )}
        >
          {title}
        </span>
      </span>
    </a>
  );
}
