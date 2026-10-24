import React, { useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInsights, money } from '@components/admin/WorkspaceInsights.js';

type Day = { date: string; orders: number; value: number };

export default function OrderCalendar({ url }: { url: string }) {
  const { data, error } = useInsights<{ daily: Day[] }>(url, 'orders');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string>();
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const days =
    data?.daily.slice(page === 0 ? -28 : 0, page === 0 ? undefined : 28) || [];
  const current =
    days.find((d) => d.date === selected) || days[days.length - 1];
  const max = Math.max(1, ...days.map((d) => d.orders));
  const weekday = days[0]
    ? new Date(`${days[0].date}T12:00:00Z`).getUTCDay()
    : 0;
  const date = (value: string) =>
    new Date(`${value}T12:00:00Z`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    });
  const total = days.reduce((sum, d) => sum + d.orders, 0);
  return (
    <section
      className="order-calendar"
      data-slot="card"
      aria-label="Order calendar"
    >
      <div data-slot="card-header">
        <h2 data-slot="card-title">
          <CalendarDays size={16} /> Order calendar
        </h2>
        <div className="calendar-pager">
          <button
            type="button"
            aria-label="Previous four weeks"
            disabled={page === 1}
            onClick={() => {
              setPage(1);
              setSelected(undefined);
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Latest four weeks"
            disabled={page === 0}
            onClick={() => {
              setPage(0);
              setSelected(undefined);
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div data-slot="card-content">
        {!data ? (
          <p role="status" className="dashboard-empty">
            {error
              ? 'Order activity is unavailable.'
              : 'Loading order activity…'}
          </p>
        ) : (
          <>
            <div className="calendar-total">
              <strong>{total}</strong>
              <span>orders in four weeks</span>
            </div>
            <div className="calendar-weekdays" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][(weekday + i) % 7]}
                </span>
              ))}
            </div>
            <div className="calendar-grid" aria-label="Daily order activity">
              {days.map((day, i) => (
                <button
                  ref={(node) => {
                    cells.current[i] = node;
                  }}
                  key={day.date}
                  type="button"
                  tabIndex={current?.date === day.date ? 0 : -1}
                  aria-pressed={current?.date === day.date}
                  aria-label={`${date(day.date)}: ${day.orders} orders, ${money(
                    day.value
                  )}`}
                  title={`${date(day.date)} · ${day.orders} orders`}
                  data-level={
                    day.orders === 0 ? 0 : Math.ceil((day.orders / max) * 4)
                  }
                  onClick={() => setSelected(day.date)}
                  onFocus={() => setSelected(day.date)}
                  onKeyDown={(event) => {
                    const offset = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7
                    }[event.key];
                    if (offset === undefined) return;
                    event.preventDefault();
                    cells.current[
                      Math.max(0, Math.min(days.length - 1, i + offset))
                    ]?.focus();
                  }}
                >
                  <span>{Number(day.date.slice(-2))}</span>
                </button>
              ))}
            </div>
            <div className="calendar-detail" aria-live="polite">
              <span>{current ? date(current.date) : 'No orders'}</span>
              <strong>{current?.orders ?? 0} orders</strong>
              <span>{money(current?.value ?? 0)}</span>
            </div>
            <div className="calendar-key">
              <span>
                {days[0] && date(days[0].date)} –{' '}
                {days.at(-1) && date(days.at(-1)!.date)}
              </span>
              <span>
                Less <i data-level="0" />
                <i data-level="2" />
                <i data-level="4" /> More
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
