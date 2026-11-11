import React, { useEffect, useId, useState } from 'react';
import { groupWeeks, type DailyPoint } from './insights/series.js';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CreditCard,
  PackageCheck,
  Boxes,
  Package,
  ArrowDownToLine,
  Gauge
} from 'lucide-react';

export function useInsights<T>(url: string, view: string) {
  const [state, setState] = useState<{ data?: T; error?: boolean }>({});
  useEffect(() => {
    const controller = new AbortController();
    setState({});
    const target = new URL(url, window.location.origin);
    target.searchParams.set('view', view);
    fetch(target, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Workspace insights unavailable');
        const result = await response.json();
        setState({ data: result.data });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ error: true });
      });
    return () => controller.abort();
  }, [url, view]);
  return state;
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);
export const shortNumber = (n: number) =>
  Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
export const statusLabel = (s: string) =>
  s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

export function InsightPanel({
  title,
  description,
  icon,
  action,
  children,
  className = ''
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`insight-panel ${className}`} aria-label={title}>
      <header className="insight-panel-heading">
        <div>
          <h2>
            {icon}
            {title}
          </h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function InsightState({ error }: { error?: boolean }) {
  return (
    <div className="insight-state" role="status">
      {error
        ? 'Insights could not load. Refresh to try again.'
        : 'Loading workspace insights…'}
    </div>
  );
}

export function TrendChart({
  points,
  metric = 'orders',
  label,
  seriesLabel
}: {
  points: DailyPoint[];
  metric?: 'orders' | 'value';
  label: string;
  seriesLabel?: string;
}) {
  const gradient = useId().replaceAll(':', '');
  return (
    <div className="insight-chart" role="group" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-line)"
                stopOpacity={0.12}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-line)"
                stopOpacity={0.01}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="4 5"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={22}
            tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
            tickFormatter={(d) =>
              new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short'
              })
            }
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
            tickFormatter={shortNumber}
          />
          <Tooltip
            labelStyle={{ color: '#fff', marginBottom: 7 }}
            itemStyle={{ color: '#e4e4e7' }}
            cursor={{ stroke: '#c3c8ce', strokeWidth: 1 }}
            contentStyle={{
              border: '1px solid #454548',
              borderRadius: 9,
              background: '#282829',
              boxShadow: '0 6px 12px #00000020, inset 0 1px 1px #ffffff26',
              padding: '12px 15px',
              color: 'white',
              fontSize: 12
            }}
            labelFormatter={(d) =>
              new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short'
              })
            }
            formatter={(v) => [
              metric === 'value' ? money(Number(v)) : v,
              seriesLabel || (metric === 'value' ? 'Order value' : 'Orders')
            ]}
          />
          <Area
            isAnimationActive={false}
            type="linear"
            dataKey={metric}
            stroke="var(--chart-line)"
            fill={`url(#${gradient})`}
            strokeWidth={1.8}
            dot={{ r: 3, fill: '#fff', strokeWidth: 1.4 }}
            activeDot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>{metric === 'orders' ? 'Orders' : 'Order value'}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p[metric]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tones = ['#353638', '#a2a5a8', '#dfe1e3', '#747578', '#bbbdbf'];
export function Distribution({
  items,
  totalLabel,
  total,
  href
}: {
  items: { status: string; count: number }[];
  totalLabel: string;
  total: number;
  href?: (status: string) => string;
}) {
  return (
    <div className="insight-distribution">
      <div className="distribution-total">
        <strong>{total}</strong>
        <span>{totalLabel}</span>
      </div>
      <div className="distribution-strip" aria-hidden="true">
        {items.map((item, index) => (
          <span
            key={item.status}
            style={{
              width: `${total ? (item.count / total) * 100 : 0}%`,
              background: tones[index % tones.length]
            }}
          />
        ))}
      </div>
      <ul className="insight-legend">
        {items.map((item, index) => {
          const contents = (
            <>
              <i style={{ background: tones[index % tones.length] }} />
              <span>{statusLabel(item.status)}</span>
              <strong>{item.count}</strong>
              <small>
                {total ? Math.round((item.count / total) * 100) : 0}%
              </small>
              {href && <ArrowUpRight size={12} aria-hidden="true" />}
            </>
          );
          return (
            <li key={item.status}>
              {href ? (
                <a href={href(item.status)}>{contents}</a>
              ) : (
                <div>{contents}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type OrderData = {
  daily: DailyPoint[];
  dispatch: { status: string; count: number }[];
  payments: { status: string; count: number }[];
};

export function RankedBars({
  items,
  unit
}: {
  items: {
    key: string;
    label: string;
    value: number;
    note?: string;
    href?: string;
  }[];
  unit: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="insight-ranked-bars">
      {items.map((item, i) => (
        <li key={item.key}>
          <a
            href={item.href}
            className={!item.href ? 'is-static' : undefined}
            aria-label={`${item.label}: ${item.value} ${unit}${
              item.href ? '. View products' : ''
            }`}
          >
            <span className="rank-label">
              {item.label}
              <small>{item.note}</small>
            </span>
            <span className="rank-track">
              <span
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: i === 0 ? '#454648' : '#b9babc'
                }}
              />
            </span>
            <strong>{item.value.toLocaleString('en-IN')}</strong>
            {item.href && <ArrowUpRight size={12} />}
          </a>
        </li>
      ))}
    </ul>
  );
}

type ProductRecord = {
  uuid: string;
  name: string;
  sku: string;
  qty: number;
  image?: string;
};
type ProductData = {
  categories: { id?: number; name: string; products: number; units: number }[];
  lowStock: ProductRecord[];
  bestSellers: ProductRecord[];
};
export function ProductInsights({ url }: { url: string }) {
  const { data, error } = useInsights<ProductData>(url, 'products');
  const [view, setView] = useState<'stock' | 'sales'>('stock');
  if (!data) return <InsightState error={error} />;
  const items = view === 'stock' ? data.lowStock : data.bestSellers;
  return (
    <div className="workspace-insights product-insights">
      <InsightPanel
        title="Inventory by category"
        icon={<Boxes size={15} />}
        description="Largest categories by active stock · select to view"
      >
        <div className="insight-chart-summary">
          <div>
            <strong>
              {data.categories
                .reduce((total, category) => total + category.units, 0)
                .toLocaleString('en-IN')}
            </strong>
            <span>units in active SKUs</span>
          </div>
          <span className="insight-summary-badge">
            Top {Math.min(5, data.categories.length)} of{' '}
            {data.categories.length}
          </span>
        </div>
        <RankedBars
          items={data.categories.slice(0, 5).map((category) => ({
            key: String(category.id),
            label: category.name,
            value: category.units,
            note: `${category.products} SKUs`,
            href: category.id ? `/admin/products?cat=${category.id}` : undefined
          }))}
          unit="units"
        />
      </InsightPanel>
      <InsightPanel
        title={view === 'stock' ? 'Stock watch' : 'Best sellers'}
        icon={<ArrowDownToLine size={15} />}
        description={
          view === 'stock'
            ? 'Available stock, lowest first'
            : 'Units ordered · excludes cancelled orders'
        }
        action={
          <div
            className="insight-switch"
            role="group"
            aria-label="Product insights"
          >
            <button
              type="button"
              aria-pressed={view === 'stock'}
              onClick={() => setView('stock')}
            >
              Stock levels
            </button>
            <button
              type="button"
              aria-pressed={view === 'sales'}
              onClick={() => setView('sales')}
            >
              Best sellers
            </button>
          </div>
        }
      >
        <div className="insight-product-list">
          {items.length ? (
            items.slice(0, 4).map((p) => (
              <a
                href={`/admin/products/edit/${p.uuid}${
                  view === 'stock' ? '#product-inventory' : ''
                }`}
                key={p.uuid}
                className="insight-product"
              >
                <span className="insight-product-image">
                  {p.image ? (
                    <img src={p.image} alt="" />
                  ) : (
                    <Package size={22} />
                  )}
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.sku}</small>
                </span>
                <span
                  className={`insight-product-qty ${
                    view === 'stock' && p.qty <= 3 ? 'stock-warning' : ''
                  }`}
                >
                  <b>{p.qty}</b>
                  <small>{view === 'stock' ? 'on hand' : 'ordered'}</small>
                </span>
                <ArrowUpRight size={13} />
              </a>
            ))
          ) : (
            <div className="insight-empty">
              <PackageCheck size={28} />
              <strong>No active products</strong>
              <span>Add a product to start tracking stock.</span>
            </div>
          )}
        </div>
      </InsightPanel>
    </div>
  );
}
export function OrderInsights({ url }: { url: string }) {
  const { data, error } = useInsights<OrderData>(url, 'orders');
  const [metric, setMetric] = useState<'orders' | 'value'>('orders');
  const [period, setPeriod] = useState<'weeks' | 'days'>('weeks');
  if (!data) return <InsightState error={error} />;
  const points =
    period === 'weeks' ? groupWeeks(data.daily) : data.daily.slice(-14);
  const total = points.reduce((sum, p) => sum + Number(p[metric]), 0);
  return (
    <div className="workspace-insights order-insights">
      <InsightPanel
        className="order-activity-panel"
        title="Order activity"
        icon={<ChartNoAxesCombined size={15} />}
        description={
          period === 'weeks'
            ? '8 weeks · placed orders, including refunded orders'
            : '14 days · placed orders, including refunded orders'
        }
        action={
          <div
            className="insight-switch"
            role="group"
            aria-label="Order chart period"
          >
            {(['weeks', 'days'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p === 'weeks' ? '8 weeks' : '14 days'}
              </button>
            ))}
          </div>
        }
      >
        <div className="insight-chart-summary">
          <div>
            <strong>{metric === 'value' ? money(total) : total}</strong>
            <span>{metric === 'value' ? 'order value' : 'orders placed'}</span>
          </div>
          <div
            className="insight-switch"
            role="group"
            aria-label="Order chart metric"
          >
            <button
              type="button"
              aria-pressed={metric === 'orders'}
              onClick={() => setMetric('orders')}
            >
              Orders
            </button>
            <button
              type="button"
              aria-pressed={metric === 'value'}
              onClick={() => setMetric('value')}
            >
              Value
            </button>
          </div>
        </div>
        <div className="insight-chart-key">
          <i />
          {metric === 'value' ? 'Order value (₹)' : 'Orders placed'}
        </div>
        <TrendChart
          points={points}
          metric={metric}
          label={`${period === 'weeks' ? 'Eight-week' : 'Fourteen-day'} ${
            metric === 'value' ? 'order value' : 'order volume'
          }`}
        />
      </InsightPanel>
      <InsightPanel
        className="order-flow-panel"
        title="Fulfilment overview"
        icon={<Gauge size={15} />}
        description="All orders · select a stage to open its queue"
      >
        <Distribution
          items={data.dispatch}
          total={data.dispatch.reduce((s, d) => s + d.count, 0)}
          totalLabel="orders"
          href={(s) => `/admin/orders?shipment_status=${encodeURIComponent(s)}`}
        />
        <div className="insight-payment-strip">
          <CreditCard size={14} />
          <span>
            {data.payments
              .filter((p) => p.status.includes('refund'))
              .reduce((s, p) => s + p.count, 0)}{' '}
            orders include refunds
          </span>
          <a href="/admin/returns">
            Review returns <ArrowUpRight size={12} />
          </a>
        </div>
      </InsightPanel>
    </div>
  );
}
