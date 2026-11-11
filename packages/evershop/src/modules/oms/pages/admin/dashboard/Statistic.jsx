// Modified for Ordex on 19 October 2026.
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent
} from '@components/common/ui/Card.js';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Area,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './Statistic.scss';
import { ChartNoAxesCombined } from 'lucide-react';
import { Button } from '@components/common/ui/Button.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

export default function SaleStatistic({ api }) {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    if (typeof window !== 'undefined') {
      setFetching(true);
      setError('');
      fetch(`${api}?period=${period}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok)
            throw new Error('Sales data is temporarily unavailable.');
          return response.json();
        })
        .then((json) => {
          setData(
            json.map((row) => ({
              ...row,
              total: Number(row.total),
              count: Number(row.count)
            }))
          );
          setFetching(false);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setError(error.message);
          setFetching(false);
        });
    }
    return () => controller.abort();
  }, [api, period]);

  if (error) {
    return (
      <Card className="sales-statistic">
        <CardHeader>
          <CardTitle>Sales overview</CardTitle>
        </CardHeader>
        <p role="alert" className="chart-error">
          {error}
        </p>
      </Card>
    );
  }
  if (fetching) {
    return (
      <Card title="Sale Statistics">
        <CardHeader>
          <CardTitle>
            <ChartNoAxesCombined size={16} />
            {_('Sales overview')}
          </CardTitle>
          <CardDescription>
            {_('Order value and volume, based on placed orders')}
          </CardDescription>
        </CardHeader>
        <div className="skeleton-wrapper-statistic">
          <div className="skeleton" />
        </div>
      </Card>
    );
  } else {
    return (
      <Card className="sales-statistic">
        <CardHeader>
          <CardTitle>
            <ChartNoAxesCombined size={16} />
            {_('Sales overview')}
          </CardTitle>
          <CardDescription>
            {_('Placed order value and volume')}
          </CardDescription>
          <CardAction>
            <div
              className="chart-period-controls"
              role="group"
              aria-label="Chart period"
            >
              <Button
                onClick={() => setPeriod('daily')}
                aria-pressed={period === 'daily'}
                variant={'outline'}
              >
                {period === 'daily' ? (
                  <span className="text-primary">{_('Daily')}</span>
                ) : (
                  _('Daily')
                )}
              </Button>
              <Button
                onClick={() => setPeriod('weekly')}
                aria-pressed={period === 'weekly'}
                variant={'outline'}
              >
                {period === 'weekly' ? (
                  <span className="text-primary">{_('Weekly')}</span>
                ) : (
                  _('Weekly')
                )}
              </Button>
              <Button
                onClick={() => setPeriod('monthly')}
                aria-pressed={period === 'monthly'}
                variant={'outline'}
              >
                {period === 'monthly' ? (
                  <span className="text-primary">{_('Monthly')}</span>
                ) : (
                  _('Monthly')
                )}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="chart-total" aria-live="polite">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(data.reduce((sum, row) => sum + row.total, 0))}
            <small className="chart-order-count">
              {data.reduce((sum, row) => sum + row.count, 0)} orders
            </small>
          </div>
          <div className="chart-key">
            <span>
              <i /> Order value (₹)
            </span>
            <span>
              <i /> Orders
            </span>
          </div>
          {data.length === 0 ? (
            <p className="chart-error">No orders in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={252}>
              <ComposedChart
                data={data}
                margin={{
                  top: 5,
                  right: 0,
                  left: 0,
                  bottom: 5
                }}
              >
                <defs>
                  <linearGradient id="salesWash" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeDasharray="4 5"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                />
                <Tooltip
                  defaultIndex={Math.max(0, data.length - 2)}
                  labelStyle={{ color: '#fff', marginBottom: 7 }}
                  itemStyle={{ color: '#e4e4e7', paddingBlock: 3 }}
                  cursor={{ fill: '#e6f0f8', fillOpacity: 0.6 }}
                  contentStyle={{
                    borderRadius: 9,
                    border: '1px solid #454548',
                    background: '#282829',
                    color: 'white',
                    boxShadow:
                      '0 6px 12px #00000020, inset 0 1px 1px #ffffff26',
                    padding: '12px 15px',
                    fontSize: 12
                  }}
                  formatter={(value, name) => [
                    name === 'Order value'
                      ? new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(Number(value))
                      : value,
                    name
                  ]}
                />
                <Area
                  type="linear"
                  dataKey="total"
                  yAxisId="revenue"
                  name="Order value"
                  stroke="var(--chart-line)"
                  strokeWidth={1.8}
                  dot={{ r: 3, strokeWidth: 1.4, fill: 'white' }}
                  activeDot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                  fill="url(#salesWash)"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="count"
                  name="Orders"
                  yAxisId="orders"
                  fill="transparent"
                  legendType="none"
                  tooltipType="none"
                  activeBar={{
                    fill: 'var(--chart-bar-active)',
                    fillOpacity: 0.55
                  }}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="count"
                  name="Orders"
                  yAxisId="orders"
                  stroke="#b8bdc2"
                  strokeWidth={1.25}
                  dot={{ r: 3, fill: 'white', strokeWidth: 1 }}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <table className="sr-only">
            <caption>Order value and number of orders by period</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Order value in INR</th>
                <th scope="col">Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.time}>
                  <td>{row.time}</td>
                  <td>{row.total}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }
}

SaleStatistic.propTypes = {
  api: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'leftSide',
  sortOrder: 10
};

export const query = `
  query Query {
    api: url(routeId: "salestatistic")    
  }
`;
