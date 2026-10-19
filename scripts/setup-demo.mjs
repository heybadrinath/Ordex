import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';

if (!existsSync('.env')) {
  const user = process.env.PGUSER || userInfo().username;
  const admin = new Pool({ host: 'localhost', database: 'postgres', user });
  const found = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname='ordex_demo'"
  );
  if (!found.rowCount) await admin.query('CREATE DATABASE ordex_demo');
  await admin.end();
  writeFileSync(
    '.env',
    `DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=ordex_demo\nDB_USER=${user}\nDB_PASSWORD=\nDB_SSLMODE=disable\nPORT=3000\nSESSION_SECRET=${randomBytes(
      32
    ).toString('hex')}\n`
  );
}
await import('dotenv/config');
process.env.NODE_ENV = 'development';
const { pool } = await import(
  '../packages/evershop/dist/lib/postgres/connection.js'
);
const { migrate } = await import(
  '../packages/evershop/dist/bin/lib/bootstrap/migrate.js'
);
const { getCoreModules } = await import(
  '../packages/evershop/dist/bin/lib/loadModules.js'
);
const { hashPassword } = await import(
  '../packages/evershop/dist/lib/util/passwordHelper.js'
);
await migrate([
  ...getCoreModules(),
  { name: 'ordex', path: `${process.cwd()}/extensions/ordex/dist` }
]);
await pool.query(
  `INSERT INTO admin_user(email,password,full_name,status) VALUES($1,$2,$3,true)
   ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,full_name=EXCLUDED.full_name`,
  ['seller@ordex.example', hashPassword('DemoStore123!'), 'Ordex Studio']
);
const settings = {
  storeName: 'Ordex',
  storeCurrency: 'INR',
  storeLanguage: 'en',
  storeCountry: 'IN',
  storeTimeZone: 'Asia/Kolkata',
  weightUnit: 'g',
  dimensionUnit: 'cm',
  storeEmail: 'hello@ordex.example',
  storeAddress: '24 Sample Lane',
  storeCity: 'Bengaluru',
  storePostcode: '560001',
  storeProvince: 'IN-KA',
  codPaymentStatus: '0',
  stripePaymentStatus: '0',
  paypalPaymentStatus: '0',
  storeDescription: 'Thoughtful objects for everyday life.',
  copyRight: 'Ordex · Thoughtful everyday objects'
};
for (const [name, value] of Object.entries(settings)) {
  await pool.query(
    `INSERT INTO setting(name,value) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value`,
    [name, value]
  );
}
mkdirSync('media', { recursive: true });
mkdirSync('public', { recursive: true });
await pool.end();
console.log('Database and demo seller are ready.');
execFileSync(
  process.execPath,
  ['packages/evershop/dist/bin/seed/index.js', '--all'],
  { stdio: 'inherit' }
);
execFileSync(process.execPath, ['scripts/seed-demo.mjs'], { stdio: 'inherit' });
