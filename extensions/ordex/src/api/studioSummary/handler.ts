import { pool } from '@evershop/evershop/lib/postgres';
import { apiError } from '../../services/returns.js';
import { workspaceInsights } from '../../services/workspaceInsights.js';

export default async (request, response) => {
  try {
    if (request.query.view) {
      const data = await workspaceInsights(String(request.query.view));
      if (!data)
        return response
          .status(400)
          .json({ error: { message: 'Unknown workspace.' } });
      return response.json({ data });
    }
    const [totals, orders, activity] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*)::int FROM "order") AS orders,
        (SELECT COALESCE(SUM(grand_total),0)::float FROM "order") AS order_value,
        (SELECT COUNT(*)::int FROM customer) AS customers,
        (SELECT COUNT(*)::int FROM product WHERE status=true) AS products,
        (SELECT COUNT(*)::int FROM customer_return WHERE status NOT IN ('refunded','rejected')) AS open_returns,
        (SELECT COUNT(*)::int FROM "order" WHERE shipment_status='delivered') AS delivered,
        (SELECT COUNT(*)::int FROM "order" WHERE shipment_status='pending') AS to_fulfil,
        (SELECT COUNT(*)::int FROM "order" WHERE shipment_status='shipped') AS in_transit,
        (SELECT COALESCE(SUM(qty),0)::int FROM product_inventory) AS inventory_units,
        (SELECT COUNT(*)::int FROM product_inventory WHERE qty=0) AS zero_stock,
        (SELECT COUNT(*)::int FROM customer WHERE status=1) AS active_customers,
        (SELECT COUNT(*)::int FROM (SELECT customer_id FROM "order" WHERE customer_id IS NOT NULL GROUP BY customer_id HAVING COUNT(*)>1) repeat_buyers) AS repeat_customers,
        (SELECT COUNT(*)::int FROM category) AS categories,
        (SELECT COUNT(*)::int FROM collection) AS collections,
        (SELECT COUNT(*)::int FROM attribute) AS attributes`),
      pool.query(`SELECT o.uuid, o.order_number, o.customer_full_name, o.grand_total::float, o.payment_status, o.shipment_status, o.created_at,
        item.thumbnail, item.product_name, item.qty AS item_qty
        FROM "order" o LEFT JOIN LATERAL (SELECT thumbnail, product_name, qty FROM order_item
          WHERE order_item_order_id=o.order_id ORDER BY order_item_id LIMIT 1) item ON true
        ORDER BY o.created_at DESC, o.order_id DESC LIMIT 5`),
      pool.query(`SELECT a.activity_id, a.message, a.created_at, o.order_number
        FROM return_activity a JOIN customer_return r ON r.return_id=a.return_id
        JOIN "order" o ON o.order_id=r.order_id ORDER BY a.created_at DESC LIMIT 4`)
    ]);
    response.json({
      data: {
        ...totals.rows[0],
        recentOrders: orders.rows,
        activity: activity.rows
      }
    });
  } catch (error) {
    apiError(response, error);
  }
};
