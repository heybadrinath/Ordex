import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const setupScript = fileURLToPath(new URL('../scripts/setup-demo.mjs', import.meta.url));

for (const password of [undefined, 'DemoStore123!', 'short']) {
  test(`production setup rejects ${password === undefined ? 'a missing' : 'an unsafe'} seller password before creating resources`, () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ordex-hosting-'));
    try {
      const env = { ...process.env, NODE_ENV: 'production' };
      delete env.DB_HOST;
      delete env.ORDEX_ADMIN_PASSWORD;
      if (password !== undefined) env.ORDEX_ADMIN_PASSWORD = password;
      const result = spawnSync(process.execPath, [setupScript], { cwd, env, encoding: 'utf8', timeout: 5000 });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Production setup requires a private ORDEX_ADMIN_PASSWORD/);
      assert.equal(existsSync(join(cwd, '.env')), false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}

test('production setup requires an explicitly configured database', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ordex-hosting-'));
  try {
    const env = { ...process.env, NODE_ENV: 'production', ORDEX_ADMIN_PASSWORD: 'test-only-private-password' };
    delete env.DB_HOST;
    const result = spawnSync(process.execPath, [setupScript], { cwd, env, encoding: 'utf8', timeout: 5000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Production setup requires DB_HOST/);
    assert.equal(existsSync(join(cwd, '.env')), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
