import { describe, expect, it } from '@jest/globals';
import { customerOrderSeries, groupWeeks } from '../../insights/series.js';

describe('Workspace chart series', () => {
  it('keeps an incomplete final week and does not mutate daily data', () => {
    const days = Array.from({ length: 9 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      orders: i,
      value: i * 10
    }));
    const original = JSON.stringify(days);
    expect(groupWeeks(days)).toEqual([
      { date: '2026-10-01', orders: 21, value: 210 },
      { date: '2026-10-08', orders: 15, value: 150 }
    ]);
    expect(JSON.stringify(days)).toBe(original);
  });
  it('handles an empty store without invented points', () => {
    expect(groupWeeks([])).toEqual([]);
    expect(customerOrderSeries([])).toEqual([]);
  });
  it('sorts and combines orders placed on the same day', () => {
    expect(
      customerOrderSeries([
        {
          createdAt: { value: '2026-10-22T12:00:00Z' },
          grandTotal: { value: 900 }
        },
        {
          createdAt: { value: '2026-10-20T09:00:00Z' },
          grandTotal: { value: 100 }
        },
        {
          createdAt: { value: '2026-10-22T18:00:00Z' },
          grandTotal: { value: 300 }
        }
      ])
    ).toEqual([
      { date: '2026-10-20', orders: 1, value: 100 },
      { date: '2026-10-22', orders: 2, value: 1200 }
    ]);
  });
  it('omits invalid dates but retains zero-value orders', () => {
    expect(
      customerOrderSeries([
        { createdAt: { value: 'invalid' }, grandTotal: { value: 90 } },
        {
          createdAt: { value: Date.parse('2026-10-20T09:00:00Z') },
          grandTotal: { value: 0 }
        }
      ])
    ).toEqual([{ date: '2026-10-20', orders: 1, value: 0 }]);
  });
});
