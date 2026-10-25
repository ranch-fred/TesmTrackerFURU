import test from 'node:test';
import assert from 'node:assert/strict';
import { contrast, parseCustomTheme, presets } from '../src/theme.js';

test('built-in themes keep core text readable', () => {
  for (const theme of Object.values(presets)) {
    assert.ok(contrast(theme.colors.text, theme.colors.background) >= 4.5, theme.name);
    assert.ok(contrast(theme.colors.text, theme.colors.surface) >= 4.5, theme.name);
    assert.ok(contrast(theme.colors.muted, theme.colors.surface) >= 4.5, theme.name);
  }
});

test('custom theme accepts color data and rejects scripts, extra fields, and poor contrast', () => {
  assert.equal(parseCustomTheme(JSON.stringify(presets.paper)).name, 'Paper');
  assert.throws(
    () => parseCustomTheme(JSON.stringify({ ...presets.paper, css: 'body{display:none}' })),
    /seven required colors|Use only/,
  );
  assert.throws(
    () =>
      parseCustomTheme(
        JSON.stringify({ ...presets.paper, colors: { ...presets.paper.colors, text: '#FFFFFF' } }),
      ),
    /contrast/,
  );
  assert.throws(() => parseCustomTheme('{ bad json'), /valid JSON/);
});
