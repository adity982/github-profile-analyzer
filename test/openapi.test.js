const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'docs/openapi.json'), 'utf8'));

function resolve(schema) {
  if (!schema.$ref) return schema;
  return contract.components.schemas[schema.$ref.split('/').at(-1)];
}

function assertValue(value, inputSchema, location = '$') {
  const schema = resolve(inputSchema);
  if (schema.allOf) {
    for (const part of schema.allOf) assertValue(value, part, location);
    return;
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((part) => {
      try { assertValue(value, part, location); return true; } catch { return false; }
    });
    assert.equal(matches.length, 1, `${location} must match exactly one schema`);
    return;
  }

  const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const normalized = actual === 'number' && Number.isInteger(value) ? ['integer', 'number'] : [actual];
  assert.ok(allowed.some((type) => normalized.includes(type)), `${location} expected ${allowed.join('|')}, got ${actual}`);
  if (schema.const !== undefined) assert.deepEqual(value, schema.const, `${location} const mismatch`);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${location} is outside enum`);

  if (actual === 'object') {
    for (const key of schema.required || []) assert.ok(Object.hasOwn(value, key), `${location} is missing ${key}`);
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.hasOwn(value, key)) assertValue(value[key], child, `${location}.${key}`);
    }
  }
  if (actual === 'array' && schema.items) value.forEach((item, i) => assertValue(item, schema.items, `${location}[${i}]`));
}

test('contract mirrors every Express method and path', () => {
  assert.equal(contract.openapi, '3.1.0');
  const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  const routes = fs.readFileSync(path.join(root, 'src/routes/profileRoutes.js'), 'utf8');
  const implemented = new Set();

  for (const match of app.matchAll(/app\.(get|post|delete)\('([^']+)'/g)) {
    implemented.add(`${match[1]} ${match[2].replace(/:([A-Za-z0-9_]+)/g, '{$1}')}`);
  }
  for (const match of routes.matchAll(/router\.(get|post|delete)\('([^']+)'/g)) {
    implemented.add(`${match[1]} /api${match[2].replace(/:([A-Za-z0-9_]+)/g, '{$1}')}`);
  }

  const documented = new Set();
  const operationIds = [];
  for (const [route, item] of Object.entries(contract.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (!item[method]) continue;
      documented.add(`${method} ${route}`);
      operationIds.push(item[method].operationId);
      assert.ok(Object.keys(item[method].responses).length > 0);
    }
  }
  assert.deepEqual([...documented].sort(), [...implemented].sort());
  assert.equal(new Set(operationIds).size, operationIds.length);
});

test('synthetic response satisfies the published analysis schema', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, 'docs/example-analyze-response.json'), 'utf8'));
  assertValue(fixture, contract.components.schemas.AnalyzeProfileResponse);
});

test('controller constraints remain documented', () => {
  const analyze = contract.paths['/api/profiles/analyze/{username}'].post;
  const username = analyze.parameters.find((item) => item.name === 'username').schema;
  assert.equal(username.maxLength, 39);
  assert.match('octocat', new RegExp(username.pattern));
  assert.doesNotMatch('-octocat', new RegExp(username.pattern));
  const limit = contract.paths['/api/profiles'].get.parameters.find((item) => item.name === 'limit').schema;
  assert.deepEqual([limit.minimum, limit.maximum], [1, 100]);
});
