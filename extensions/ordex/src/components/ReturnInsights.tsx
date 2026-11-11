import React from 'react';
import { ChartNoAxesCombined, RotateCcw } from 'lucide-react';
import {
  InsightPanel,
  TrendChart,
  money
} from '@components/admin/WorkspaceInsights.js';
import { RankedColumns } from '@components/admin/RankedColumns.js';
import type { DailyPoint } from '@components/admin/insights/series.js';

type ReturnRecord = {
  status: string;
  reason: string;
  refund_minor: number;
  refunded_at?: string;
  updated_at: string;
};
export function ReturnInsights({ records }: { records: ReturnRecord[] }) {
  const reasons = new Map<string, number>();
  const refunds = new Map<string, DailyPoint>();
  for (const record of records) {
    reasons.set(record.reason, (reasons.get(record.reason) || 0) + 1);
    if (record.status === 'refunded') {
      const date = (record.refunded_at || record.updated_at).slice(0, 10);
      const point = refunds.get(date) || { date, value: 0, orders: 0 };
      point.value += Number(record.refund_minor) / 100;
      point.orders++;
      refunds.set(date, point);
    }
  }
  const points = [...refunds.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const total = points.reduce((n, p) => n + p.value, 0);
  return (
    <div className="workspace-insights return-insights">
      <InsightPanel
        title="Reasons for returning"
        icon={<RotateCcw size={15} />}
        description={`${records.length} requests · all stages, including completed returns`}
      >
        <div className="insight-chart-summary">
          <div>
            <strong>{records.length}</strong>
            <span>return requests</span>
          </div>
        </div>
        <RankedColumns
          label="Return requests by reason"
          items={[...reasons.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ key: label, label, value }))}
          unit="returns"
        />
        {!records.length && (
          <div className="insight-empty">
            Reasons will appear when a customer requests a return.
          </div>
        )}
      </InsightPanel>
      <InsightPanel
        title="Completed refunds"
        icon={<ChartNoAxesCombined size={15} />}
        description="Refund value by completion date · demo payments"
      >
        <div className="insight-chart-summary">
          <div>
            <strong>{money(total)}</strong>
            <span>
              {points.reduce((n, p) => n + p.orders, 0)} refunds completed
            </span>
          </div>
        </div>
        <div className="insight-chart-key">
          <i />
          Refunded value (₹)
        </div>
        {points.length ? (
          <TrendChart
            points={points}
            metric="value"
            seriesLabel="Refunded value"
            label="Completed refund value by date"
          />
        ) : (
          <div className="insight-empty">No refunds completed yet.</div>
        )}
      </InsightPanel>
    </div>
  );
}
