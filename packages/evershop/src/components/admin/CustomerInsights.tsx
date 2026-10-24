import React, { useState } from 'react';
import { ArrowUpRight, Users, ChartNoAxesCombined } from 'lucide-react';
import {
  InsightPanel,
  InsightState,
  money,
  shortNumber,
  TrendChart,
  useInsights
} from './WorkspaceInsights.js';
import { customerOrderSeries } from './insights/series.js';
import { RankedColumns } from './RankedColumns.js';

type CustomerData = {
  mix: { status: string; count: number }[];
  leaders: { uuid: string; name: string; orders: number; value: number }[];
};
export function CustomerInsights({ url }: { url: string }) {
  const { data, error } = useInsights<CustomerData>(url, 'customers');
  const [view, setView] = useState<'chart' | 'list'>('list');
  if (!data) return <InsightState error={error} />;
  const max = Math.max(1, ...data.leaders.map((c) => c.value));
  return (
    <div className="workspace-insights customer-insights">
      <InsightPanel
        title="Customer mix"
        icon={<Users size={15} />}
        description="See how many customers are coming back"
      >
        <div className="customer-retention">
          <div>
            <strong>
              {Math.round(
                ((data.mix.find((item) => item.status === 'Returning')?.count ||
                  0) /
                  Math.max(
                    1,
                    data.mix.reduce((sum, item) => sum + item.count, 0)
                  )) *
                  100
              )}
              <span>%</span>
            </strong>
            <p>returning customers</p>
          </div>
          <div className="customer-cohort-bar" aria-hidden="true">
            {data.mix.map((item, index) => (
              <span
                key={item.status}
                style={{
                  width: `${
                    (item.count /
                      Math.max(
                        1,
                        data.mix.reduce((sum, row) => sum + row.count, 0)
                      )) *
                    100
                  }%`
                }}
                data-tone={index}
              />
            ))}
          </div>
          <ul>
            {data.mix.map((item) => (
              <li key={item.status}>
                <span>{item.status}</span>
                <strong>{item.count}</strong>
                <small>customers</small>
              </li>
            ))}
          </ul>
        </div>
        <div className="insight-payment-strip">
          Returning = more than one placed order
        </div>
      </InsightPanel>
      <InsightPanel
        title="Your most active customers"
        icon={<ChartNoAxesCombined size={15} />}
        description="Ranked by placed order value · includes refunds"
        action={
          <div
            className="insight-switch"
            role="group"
            aria-label="Customer ranking view"
          >
            <button
              type="button"
              aria-pressed={view === 'chart'}
              onClick={() => setView('chart')}
            >
              Chart
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>
        }
      >
        {view === 'chart' ? (
          <>
            <div className="insight-chart-summary">
              <div>
                <strong>
                  {money(
                    data.leaders.reduce(
                      (sum, customer) => sum + customer.value,
                      0
                    )
                  )}
                </strong>
                <span>top {data.leaders.length} customers</span>
              </div>
            </div>
            <RankedColumns
              label="Order value by customer"
              unit="in placed orders"
              formatValue={money}
              formatAxis={(value) => `₹${shortNumber(value)}`}
              items={data.leaders.map((customer) => ({
                key: customer.uuid,
                label: customer.name,
                value: customer.value,
                note: `${customer.orders} orders`,
                href: `/admin/customers/edit/${customer.uuid}`,
                monogram: customer.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
              }))}
            />
          </>
        ) : (
          <div className="customer-leaders">
            {data.leaders.map((c, i) => (
              <a href={`/admin/customers/edit/${c.uuid}`} key={c.uuid}>
                <span className={`customer-monogram monogram-${i % 3}`}>
                  {c.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="customer-leader-copy">
                  <strong>{c.name}</strong>
                  <small>{c.orders} orders</small>
                  <span className="customer-leader-bar">
                    <span style={{ width: `${(c.value / max) * 100}%` }} />
                  </span>
                </span>
                <b>{money(c.value)}</b>
                <ArrowUpRight size={13} />
              </a>
            ))}
          </div>
        )}
      </InsightPanel>
    </div>
  );
}

type HistoryOrder = {
  createdAt: { value: string | number };
  grandTotal: { value: number };
};
export function CustomerHistoryChart({ orders }: { orders: HistoryOrder[] }) {
  const [metric, setMetric] = useState<'value' | 'orders'>('value');
  const points = customerOrderSeries(orders);
  if (!points.length) return null;
  return (
    <InsightPanel
      title="Purchase history"
      description="Placed orders by date · refunds are shown on individual orders"
      icon={<ChartNoAxesCombined size={15} />}
      className="customer-purchase-chart"
      action={
        <div
          className="insight-switch"
          role="group"
          aria-label="Customer history metric"
        >
          <button
            type="button"
            aria-pressed={metric === 'value'}
            onClick={() => setMetric('value')}
          >
            Value
          </button>
          <button
            type="button"
            aria-pressed={metric === 'orders'}
            onClick={() => setMetric('orders')}
          >
            Orders
          </button>
        </div>
      }
    >
      <div className="insight-chart-summary">
        <div>
          <strong>
            {metric === 'value'
              ? money(points.reduce((n, p) => n + p.value, 0))
              : orders.length}
          </strong>
          <span>
            {metric === 'value' ? 'total order value' : 'orders placed'}
          </span>
        </div>
      </div>
      <TrendChart
        points={points}
        metric={metric}
        label={`Customer ${
          metric === 'value' ? 'order value' : 'order count'
        } by date`}
      />
    </InsightPanel>
  );
}
