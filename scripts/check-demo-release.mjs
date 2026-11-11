import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

check(Number(process.versions.node.split('.')[0]) === 22, 'Node.js 22 runtime');
try {
  git('diff', '--check');
  git('diff', '--cached', '--check');
  check(true, 'Working and staged patches have no whitespace errors');
} catch {
  check(false, 'Resolve patch whitespace errors reported by git diff --check');
}
for (const file of ['README.md', 'DEMO.md', 'UPSTREAM.md', 'ASSET_CREDITS.md', 'LICENSE', 'package-lock.json'])
  check(existsSync(new URL(`../${file}`, import.meta.url)), `${file} is present`);

// Include untracked source in the review; nothing is staged or published here.
const candidates = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean))];
const privatePath = /(^|\/)(\.env(\..+)?|\.project-local|AGENTS\.md)(\/|$)|^docs\/(Seller_Rescue_Project_Prompt\.txt|prd\.md|implementation-plan\.md|research\.md|platform-comparison\.md|codebase-shortlist\.md)$/;
const privateFiles = candidates.filter(file => !/(^|\/)\.env\.example$/.test(file) && privatePath.test(file));
check(privateFiles.length === 0, `Private configuration and planning excluded${privateFiles.length ? `: ${privateFiles.join(', ')}` : ''}`);
const secrets = [];
for (const file of candidates) {
  const url = new URL(`../${file}`, import.meta.url);
  if (!existsSync(url) || !statSync(url).isFile() || statSync(url).size > 2_000_000) continue;
  const body = readFileSync(url, 'utf8').replaceAll('\\n', '\n');
  if (/AIza[\w-]{35}|gh[pousr]_[A-Za-z0-9]{36,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{64,}-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body))
    secrets.push(file);
}
check(secrets.length === 0, `No recognized credential patterns in candidate source${secrets.length ? `: ${secrets.join(', ')}` : ''}`);
console.log(`\nReviewed ${candidates.length} candidate paths. No files were staged, committed or pushed.`);
console.log('This check does not establish hosted readiness or detect every possible secret. Run the database suites and verify the deployed web, worker and provider before submission.');
process.exitCode = failures.length ? 1 : 0;
