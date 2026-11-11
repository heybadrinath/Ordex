import { pool } from '@evershop/evershop/lib/postgres';

export async function workspaceInsights(view: string) {
  if (view === 'attributes') {
    const attributes = await pool.query(`SELECT a.uuid,a.attribute_code AS code,a.attribute_name AS name,a.type,a.is_filterable AS filterable,
      (SELECT count(DISTINCT product_id)::int FROM product_attribute_value_index v WHERE v.attribute_id=a.attribute_id) AS products,
      (SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.attribute_option_id,'text',o.option_text) ORDER BY o.attribute_option_id),'[]') FROM attribute_option o WHERE o.attribute_id=a.attribute_id) AS options
      FROM attribute a ORDER BY a.sort_order,a.attribute_id`);
    return { attributes: attributes.rows };
  }
  if (view === 'collections') {
    const collections = await pool.query(`SELECT c.uuid,c.name,c.code,
      (SELECT count(*)::int FROM product_collection pc JOIN product p ON p.product_id=pc.product_id WHERE pc.collection_id=c.collection_id AND p.status=true) AS products,
      ARRAY(SELECT pi.origin_image FROM product_collection pc JOIN product p ON p.product_id=pc.product_id JOIN product_image pi ON pi.product_image_product_id=p.product_id AND pi.is_main=true WHERE pc.collection_id=c.collection_id AND p.status=true ORDER BY p.product_id LIMIT 4) AS images
      FROM collection c ORDER BY products DESC,c.name`);
    return { collections: collections.rows };
  }
  if (view === 'categories') {
    const categories = await pool.query(`SELECT c.uuid,c.category_id AS id,cd.name,cd.image,c.status,
      (SELECT count(*)::int FROM product p WHERE p.category_id=c.category_id AND p.status=true) AS products,
      ARRAY(SELECT pi.origin_image FROM product p JOIN product_image pi ON pi.product_image_product_id=p.product_id AND pi.is_main=true WHERE p.category_id=c.category_id AND p.status=true ORDER BY p.product_id LIMIT 3) AS images
      FROM category c JOIN category_description cd ON cd.category_description_category_id=c.category_id ORDER BY products DESC,cd.name`);
    return { categories: categories.rows };
  }
  if (view === 'customers') {
    const [mix, leaders] = await Promise.all([
      pool.query(`SELECT CASE WHEN n=0 THEN 'No orders' WHEN n=1 THEN 'First order' ELSE 'Returning' END AS status,count(*)::int AS count FROM
        (SELECT c.customer_id,count(o.order_id) AS n FROM customer c LEFT JOIN "order" o ON o.customer_id=c.customer_id GROUP BY c.customer_id) counts GROUP BY 1 ORDER BY count DESC`),
      pool.query(`SELECT c.uuid,c.full_name AS name,count(o.order_id)::int AS orders,coalesce(sum(o.grand_total),0)::float AS value
        FROM customer c JOIN "order" o ON o.customer_id=c.customer_id GROUP BY c.customer_id ORDER BY value DESC LIMIT 5`)
    ]);
    return { mix: mix.rows, leaders: leaders.rows };
  }
  if (view === 'products') {
    const [categories, lowStock, bestSellers] = await Promise.all([
      pool.query(`SELECT coalesce(cd.name,'Uncategorised') AS name, p.category_id AS id, count(*)::int AS products, sum(i.qty)::int AS units
        FROM product p JOIN product_inventory i ON i.product_inventory_product_id=p.product_id
        LEFT JOIN category_description cd ON cd.category_description_category_id=p.category_id
        WHERE p.status=true GROUP BY p.category_id,cd.name ORDER BY units DESC`),
      pool.query(`SELECT p.uuid,p.sku,pd.name,i.qty,
        (SELECT origin_image FROM product_image WHERE product_image_product_id=p.product_id ORDER BY is_main DESC,product_image_id LIMIT 1) AS image
        FROM product p JOIN product_inventory i ON i.product_inventory_product_id=p.product_id
        JOIN product_description pd ON pd.product_description_product_id=p.product_id
        WHERE p.status=true ORDER BY i.qty,p.product_id LIMIT 5`),
      pool.query(`SELECT p.uuid,p.sku,pd.name,sum(oi.qty)::int AS qty,
        (SELECT origin_image FROM product_image WHERE product_image_product_id=p.product_id ORDER BY is_main DESC,product_image_id LIMIT 1) AS image
        FROM order_item oi JOIN "order" o ON o.order_id=oi.order_item_order_id JOIN product p ON p.product_id=oi.product_id
        JOIN product_description pd ON pd.product_description_product_id=p.product_id
        WHERE o.status<>'canceled' GROUP BY p.product_id,pd.name ORDER BY qty DESC LIMIT 5`)
    ]);
    return { categories: categories.rows, lowStock: lowStock.rows, bestSellers: bestSellers.rows };
  }
  if (view === 'orders') {
    const [daily, payments, dispatch] = await Promise.all([
      pool.query(`WITH days AS (SELECT generate_series((now() AT TIME ZONE 'Asia/Kolkata')::date-55, (now() AT TIME ZONE 'Asia/Kolkata')::date, '1 day')::date AS day)
        SELECT to_char(day,'YYYY-MM-DD') AS date, count(o.order_id)::int AS orders, coalesce(sum(o.grand_total),0)::float AS value
        FROM days LEFT JOIN "order" o ON (o.created_at AT TIME ZONE 'Asia/Kolkata')::date=day GROUP BY day ORDER BY day`),
      pool.query(`SELECT payment_status AS status,count(*)::int AS count FROM "order" GROUP BY payment_status ORDER BY count DESC`),
      pool.query(`SELECT shipment_status AS status,count(*)::int AS count FROM "order" GROUP BY shipment_status ORDER BY count DESC`)
    ]);
    return { daily: daily.rows, payments: payments.rows, dispatch: dispatch.rows };
  }
  return null;
}
