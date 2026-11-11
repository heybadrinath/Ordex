import { readFile } from 'node:fs/promises';
import {
  createProduct,
  updateProduct,
  createCollection,
  createCategory,
  updateCategory,
  updateAttribute
} from '@evershop/evershop/catalog/services';

const catalog = JSON.parse(
  await readFile(new URL('../seed/catalog.json', import.meta.url), 'utf8')
);

function description(sku, paragraphs) {
  return [
    {
      id: `row-${sku}`,
      size: 1,
      columns: [
        {
          id: `col-${sku}`,
          size: 1,
          data: {
            time: 0,
            version: '2.31.0',
            blocks: paragraphs.map((text, index) => ({
              id: `${sku}-${index}`,
              type: 'paragraph',
              data: { text }
            }))
          }
        }
      ]
    }
  ];
}

export async function seedCatalog(pool) {
  const taxClass = (
    await pool.query(
      'SELECT tax_class_id FROM tax_class ORDER BY tax_class_id LIMIT 1'
    )
  ).rows[0];
  const base = (
    await pool.query(
      'SELECT group_id, category_id, package_id FROM product ORDER BY product_id LIMIT 1'
    )
  ).rows[0];
  if (!base)
    throw new Error('Seed the base catalog before adding the curated catalog.');
  const size = (
    await pool.query("SELECT * FROM attribute WHERE attribute_code='size'")
  ).rows[0];
  if (size?.is_required) {
    const groups = (
      await pool.query(
        'SELECT group_id FROM attribute_group_link WHERE attribute_id=$1',
        [size.attribute_id]
      )
    ).rows.map((row) => row.group_id);
    const options = (
      await pool.query(
        'SELECT attribute_option_id AS option_id,option_text FROM attribute_option WHERE attribute_id=$1',
        [size.attribute_id]
      )
    ).rows;
    await updateAttribute(size.uuid, { is_required: 0, groups, options }, {});
  }

  const categories = new Map();
  for (const [index, item] of catalog.categories.entries()) {
    let category = (
      await pool.query(
        'SELECT c.* FROM category c JOIN category_description d ON d.category_description_category_id=c.category_id WHERE d.url_key=$1',
        [item.key]
      )
    ).rows[0];
    const data = {
      name: item.name,
      url_key: item.key,
      status: 1,
      position: index + 1,
      image: `/assets/ordex/catalog/${item.image}.jpg`,
      description: description(item.key, [item.description]),
      meta_title: `${item.name} · Ordex`,
      meta_description: item.description
    };
    if (category) await updateCategory(category.uuid, data, {});
    else category = await createCategory(data, {});
    categories.set(item.key, category.category_id || category.insertId);
  }

  const collectionNames = {
    'studio-edit': 'The everyday edit',
    'home-edit': 'Make yourself at home',
    'workspace-edit': 'A fresh perspective',
    'daily-edit': 'Out and about',
    'small-joys': 'Little things, lovely prices',
    'paper-edit': 'Good ideas start here',
    'table-edit': 'Set a little scene',
    'weekend-edit': 'Take the slow road'
  };
  const collections = new Map();
  for (const [code, name] of Object.entries(collectionNames)) {
    let collection = (
      await pool.query('SELECT * FROM collection WHERE code=$1', [code])
    ).rows[0];
    if (!collection) {
      await createCollection({ name, code }, {});
      collection = (
        await pool.query('SELECT * FROM collection WHERE code=$1', [code])
      ).rows[0];
    }
    collections.set(code, collection.collection_id);
  }

  for (const item of catalog.products) {
    let product = (
      await pool.query('SELECT * FROM product WHERE sku=$1', [item.sku])
    ).rows[0];
    const data = {
      name: item.name,
      category_id: categories.get(item.category),
      group_id: 1,
      tax_class: taxClass?.tax_class_id,
      url_key: item.key,
      price: item.price,
      images: [`/assets/ordex/catalog/${item.image}.jpg`],
      description: description(item.sku, [item.description, item.details]),
      meta_title: `${item.name} · Ordex`,
      meta_description: item.description
    };
    if (product) await updateProduct(product.uuid, data, {});
    else {
      await createProduct(
        {
          ...base,
          ...data,
          sku: item.sku,
          status: true,
          visibility: true,
          qty: item.stock,
          manage_stock: true,
          stock_availability: true,
          weight: 600
        },
        {}
      );
      product = (
        await pool.query('SELECT * FROM product WHERE sku=$1', [item.sku])
      ).rows[0];
    }
    // Native fixture membership is additive; existing stock and customer activity stay intact.
    for (const code of item.collections) {
      await pool.query(
        'INSERT INTO product_collection (collection_id,product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [collections.get(code), product.product_id]
      );
    }
  }
  const mug = (
    await pool.query("SELECT * FROM product WHERE sku='CUP-001-WHT'")
  ).rows[0];
  if (mug) {
    await updateProduct(
      mug.uuid,
      {
        images: ['/assets/ordex/catalog/mug.jpg'],
        tax_class: mug.tax_class || taxClass?.tax_class_id,
        category_id: categories.get('kitchen'),
        description: description(mug.sku, [
          'A smooth white ceramic cup for your first coffee, afternoon tea and everything in between.',
          'White ceramic; comfortable handle; wash before use. Demo product; photography is illustrative.'
        ])
      },
      {}
    );
    for (const code of ['small-joys', 'daily-edit'])
      await pool.query(
        'INSERT INTO product_collection (collection_id,product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [collections.get(code), mug.product_id]
      );
  }
  // Homepage sections use the same native collection and product components directly.
  await pool.query(
    "UPDATE widget_instance SET status=false WHERE name='Demo Homepage Products'"
  );
  console.log(
    `Curated catalog ready: ${catalog.products.length} products across ${categories.size} categories; existing stock preserved.`
  );
}
