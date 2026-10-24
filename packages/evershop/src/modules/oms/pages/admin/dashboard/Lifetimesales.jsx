// Modified for Ordex on 19 October 2026.
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Gauge } from 'lucide-react';
import { SegmentedGauge } from '@components/admin/SegmentedGauge.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@components/common/ui/Card.js';
const COLORS = ['var(--foreground)', 'var(--destructive)', '#dfe1e3'];
export default function LifetimeSale({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(api, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load order health.');
        setData(await response.json());
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      });
    return () => controller.abort();
  }, [api]);
  const completed = Number(data?.completed_percentage || 0);
  const cancelled = Number(data?.cancelled_percentage || 0);
  const segments = [
    { name: 'Completed & delivered', value: completed },
    { name: 'Cancelled', value: cancelled },
    { name: 'Other orders', value: Math.max(0, 100 - completed - cancelled) }
  ];
  return (
    <Card className="order-health-card">
      <CardHeader>
        <CardTitle>
          <Gauge size={16} /> Order performance
        </CardTitle>
        <CardDescription>All-time fulfilment</CardDescription>
        <a
          className="panel-open"
          href="/admin/orders"
          aria-label="View order performance"
        >
          <ArrowUpRight size={16} />
        </a>
      </CardHeader>
      <CardContent>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Loading order health…</p>}
        {data && (
          <>
            <SegmentedGauge
              value={data.orders}
              caption="Total orders"
              label={`${data.orders} total orders, ${completed}% completed and delivered, ${cancelled}% cancelled`}
              segments={segments.map((entry, index) => ({
                label: entry.name,
                value: entry.value,
                color: index === 1 ? COLORS[1] : undefined
              }))}
            />
            <div className="health-legend">
              {segments.map((entry, index) => (
                <div key={entry.name}>
                  <i style={{ background: COLORS[index] }} />
                  {entry.name}
                  <b>{entry.value}%</b>
                </div>
              ))}
            </div>
            <div className="health-total">
              <span>Total order value</span>
              <strong>{data.total}</strong>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
export const layout = { areaId: 'rightSide', sortOrder: 10 };
export const query = `query { api: url(routeId:"lifetimesales") }`;
