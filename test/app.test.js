const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

test('importing the Express app does not connect to the database or start a server', () => {
  const script = `
    const database = require('./src/config/database');
    database.connectDB = async () => {
      throw new Error('connectDB must not run during import');
    };
    const app = require('./src/app');
    if (typeof app !== 'function' || typeof app.start !== 'function') {
      throw new Error('app and start() must be exported');
    }
  `;

  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 5_000,
  });

  assert.equal(result.status, 0, result.stderr);
});
