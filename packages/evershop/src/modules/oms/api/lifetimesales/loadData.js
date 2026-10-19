// Modified for Ordex on 19 October 2026.
import { select } from '@evershop/postgres-query-builder';
import { getActiveLocale } from '../../../../lib/locale/localeContext.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { getStoreCurrency } from '../../../setting/services/setting.js';

export default async (request, response, next) => {
  const query = select();
  query
    .from('order')
    .select('grand_total', 'total')
    .select('payment_status')
    .select('shipment_status')
    .select('status');
  const results = await query.execute(pool);

  let total = 0;
  let cancelled = 0;
  let completed = 0;
  results.forEach((result) => {
    total += parseFloat(result.total);
    if (
      result.status === 'completed' &&
      result.shipment_status === 'delivered'
    ) {
      completed += 1;
    }
    if (result.status === 'canceled') {
      cancelled += 1;
    }
  });
  const currency = getStoreCurrency();
  // Admin request → `adminLanguage`; see getActiveLocale.
  const language = getActiveLocale();
  const formatedTotal = new Intl.NumberFormat(language, {
    style: 'currency',
    currency
  }).format(total);

  response.json({
    orders: results.length,
    total: formatedTotal,
    completed_percentage:
      results.length === 0 ? 0 : Math.round((completed / results.length) * 100),
    cancelled_percentage:
      results.length === 0 ? 0 : Math.round((cancelled / results.length) * 100)
  });
};
