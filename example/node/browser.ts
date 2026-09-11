import { chromium } from 'playwright';
import { serveRepo } from '@example/node/serve.js';

const PORT = 5199;
const PAGE = `http://127.0.0.1:${String(PORT)}/example/browser/`;
const SLOW = 120_000;

const server = await serveRepo(PORT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const failures: string[] = [];

page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console: ${message.text()}`);
});

console.log(`opening ${PAGE}`);
await page.goto(PAGE);

// 1. install() really runs in the browser, against registry.npmjs.org over CORS.
await page.getByText('installing from npm').waitFor({ timeout: SLOW });
console.log('  install started in the browser');

// 2. build() really runs in the browser and reports a duration.
await page.locator('#status[data-state="ok"]').waitFor({ timeout: SLOW });
console.log(`  build: ${await page.locator('#status').innerText()}`);
console.log(`  ${(await page.locator('#meta').innerText()).replace(/\s+/g, ' ')}`);

// 3. The iframe really executes the bundle: React mounted and rendered.
const preview = page.frameLocator('#preview');

await preview.locator('h1').waitFor({ timeout: 30_000 });
console.log(`  iframe rendered: "${await preview.locator('h1').innerText()}"`);

// 4. The rendered app is live, not a static string: React state updates on click.
const button = preview.locator('button');

await button.click();
const label = (await button.innerText()).trim();

if (label !== 'clicked 1 time') failures.push(`counter did not advance: "${label}"`);
else console.log('  react state updated on click');

// Off by default: rewriting it on every run leaves a dirty tree for a few bytes of
// difference in the build time printed on screen. `SCREENSHOT=1` refreshes it.
if (process.env['SCREENSHOT'] === '1') {
  await page.screenshot({ path: 'assets/playground.png' });
  console.log('  screenshot refreshed');
}

// 5. Editing a source rebuilds in the browser and the iframe picks it up.
await page.locator('.cm-content').click();
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.insertText(
  'export function App() {\n  return <h1>rebuilt-in-the-browser</h1>;\n}\n',
);
await page
  .frameLocator('#preview')
  .locator('h1', { hasText: 'rebuilt-in-the-browser' })
  .waitFor({ timeout: 60_000 });
console.log('  edit rebuilt and re-rendered');

// 6. A broken edit comes back as a structured diagnostic instead of a blank page.
await page.locator('.cm-content').click();
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.insertText('export function App() { return <h1>oops</h1>; ');
await page.locator('#status[data-state="error"]').waitFor({ timeout: 60_000 });
console.log(
  `  syntax error shown: ${await page.locator('.diagnostic .where').innerText()}`,
);

await browser.close();
server.close();

if (failures.length > 0) {
  console.error('\nfailures:');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('\nthe browser really installs, really builds and really runs the result');
