// Modified for Ordex on 19 October 2026.
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent
} from '@components/common/ui/Card.js';
import { toast } from '@components/common/ui/Sonner.js';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Area,
  ComposedChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './Statistic.scss';
import { ButtonGroup } from '@components/common/ui/ButtonGroup.js';
import { Button } from '@components/common/ui/Button.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

export default function SaleStatistic({ api }) {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (window !== undefined) {
      setFetching(true);
      fetch(`${api}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((json) => {
          setData(json.map((row) => ({
            ...row,
            total: Number(row.total),
            count: Number(row.count)
          })));
          setFetching(false);
        })
        .catch((error) => {
          toast.error(error.message);
          setFetching(false);
        });
    }
  }, [period]);

  if (fetching) {
    return (
      <Card title="Sale Statistics">
        <CardHeader>
          <CardTitle>{_('Sales overview')}</CardTitle>
          <CardDescription>
            {_('Order value and volume from your store')}
          </CardDescription>
        </CardHeader>
        <div className="skeleton-wrapper-statistic">
          <div className="skeleton" />
        </div>
      </Card>
    );
  } else {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{_('Sales overview')}</CardTitle>
          <CardDescription>
            {_('Order value and volume from your store')}
          </CardDescription>
          <CardAction>
            <ButtonGroup>
              <Button onClick={() => setPeriod('daily')} variant={'outline'}>
                {period === 'daily' ? (
                  <span className="text-primary">{_('Daily')}</span>
                ) : (
                  _('Daily')
                )}
              </Button>
              <Button onClick={() => setPeriod('weekly')} variant={'outline'}>
                {period === 'weekly' ? (
                  <span className="text-primary">{_('Weekly')}</span>
                ) : (
                  _('Weekly')
                )}
              </Button>
              <Button onClick={() => setPeriod('monthly')} variant={'outline'}>
                {period === 'monthly' ? (
                  <span className="text-primary">{_('Monthly')}</span>
                ) : (
                  _('Monthly')
                )}
              </Button>
            </ButtonGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="chart-key">
            <span>
              <i /> Order value (₹)
            </span>
            <span>
              <i /> Orders
            </span>
          </div>
          {data.length === 0 ? null : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={data}
                margin={{
                  top: 5,
                  right: 0,
                  left: -25,
                  bottom: 5
                }}
              >
                <CartesianGrid vertical={false} stroke="#edf1e6" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#80906f', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#80906f', fontSize: 10 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#80906f', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #dce4ce',
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  yAxisId="revenue"
                  name="Order value"
                  stroke="#617f50"
                  strokeWidth={2}
                  fill="#edf3e0"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="count"
                  name="Orders"
                  yAxisId="orders"
                  fill="#c7d7ad"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
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
