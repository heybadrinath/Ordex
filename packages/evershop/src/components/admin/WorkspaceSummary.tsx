import React, { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard.js';
import {
  ArrowUpRight,
  Package,
  Truck,
  CheckCheck,
  RotateCcw,
  Users,
  Boxes,
  CircleCheck,
  Layers,
  Tags,
  SlidersHorizontal
} from 'lucide-react';

type Summary = Record<string, number>;
type Kind = 'orders' | 'products' | 'customers' | 'catalog';

const sections = {
  orders: [
    {
      key: 'to_fulfil',
      label: 'To fulfil',
      note: 'Waiting to be dispatched',
      href: '/admin/orders?shipment_status=pending',
      Icon: Package,
      tone: 'peach'
    },
    {
      key: 'in_transit',
      label: 'On the way',
      note: 'Dispatched orders',
      href: '/admin/orders?shipment_status=shipped',
      Icon: Truck,
      tone: 'lilac'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      note: 'Arrived with your customers',
      href: '/admin/orders?shipment_status=delivered',
      Icon: CheckCheck,
      tone: 'mint'
    },
    {
      key: 'open_returns',
      label: 'Open returns',
      note: 'Review and next steps',
      href: '/admin/returns',
      Icon: RotateCcw,
      tone: 'sand'
    }
  ],
  products: [
    {
      key: 'products',
      label: 'Active SKUs',
      note: 'Including product variants',
      href: '/admin/products?status=1',
      Icon: CircleCheck,
      tone: 'mint'
    },
    {
      key: 'inventory_units',
      label: 'Units on hand',
      note: 'Stock across your catalog',
      href: '/admin/products?ob=qty&od=asc',
      Icon: Boxes,
      tone: 'lilac'
    },
    {
      key: 'zero_stock',
      label: 'Zero-stock SKUs',
      note: 'Review availability',
      href: '/admin/products?qty=0',
      Icon: Package,
      tone: 'peach'
    }
  ],
  customers: [
    {
      key: 'customers',
      label: 'Customers',
      note: 'Your customer directory',
      href: '/admin/customers',
      Icon: Users,
      tone: 'lilac'
    },
    {
      key: 'active_customers',
      label: 'Active accounts',
      note: 'Customers with account access',
      href: '/admin/customers?status=1',
      Icon: CircleCheck,
      tone: 'mint'
    },
    {
      key: 'repeat_customers',
      label: 'Repeat customers',
      note: 'More than one placed order',
      href: '/admin/orders',
      Icon: RotateCcw,
      tone: 'peach'
    }
  ],
  catalog: [
    {
      key: 'categories',
      label: 'Categories',
      note: 'Organise your storefront',
      href: '/admin/categories',
      Icon: Layers,
      tone: 'mint'
    },
    {
      key: 'collections',
      label: 'Collections',
      note: 'Curate products together',
      href: '/admin/collections',
      Icon: Tags,
      tone: 'peach'
    },
    {
      key: 'attributes',
      label: 'Attributes',
      note: 'Product options and filters',
      href: '/admin/attributes',
      Icon: SlidersHorizontal,
      tone: 'lilac'
    }
  ]
};

export function WorkspaceSummary({ kind, url }: { kind: Kind; url: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Summary unavailable');
        const result = await response.json();
        if (result.error) throw new Error('Summary unavailable');
        setData(result.data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, [url]);
  return (
    <div
      className="metric-strip workspace-metrics"
      data-kind={kind}
      aria-label="Store overview"
      aria-busy={!data && !failed}
    >
      {sections[kind].map(({ key, label, note, href, Icon }, index) => (
        <MetricCard
          key={key}
          label={label}
          value={data?.[key]?.toLocaleString('en-IN') ?? '—'}
          note={failed ? 'Open to view records' : note}
          href={href}
          icon={<Icon size={18} strokeWidth={1.6} />}
          tone={['slate', 'lavender', 'sage', 'sand'][index]}
        />
      ))}
    </div>
  );
}
