export type DailyPoint = { date: string; orders: number; value: number };

export function groupWeeks(daily: DailyPoint[]): DailyPoint[] {
  const points: DailyPoint[] = [];
  daily.forEach((day, i) => {
    if (i % 7 === 0) points.push({ date: day.date, orders: 0, value: 0 });
    points[points.length - 1].orders += Number(day.orders);
    points[points.length - 1].value += Number(day.value);
  });
  return points;
}

export function customerOrderSeries(
  orders: {
    createdAt: { value: string | number };
    grandTotal: { value: number };
  }[]
): DailyPoint[] {
  const dates = new Map<string, DailyPoint>();
  for (const order of orders) {
    const raw = order.createdAt.value;
    const timestamp =
      typeof raw === 'number' || /^\d+$/.test(String(raw))
        ? Number(raw)
        : Date.parse(raw);
    if (!Number.isFinite(timestamp)) continue;
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const point = dates.get(date) || { date, orders: 0, value: 0 };
    point.orders += 1;
    point.value += Number(order.grandTotal.value) || 0;
    dates.set(date, point);
  }
  return [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
}
