import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Google login is shown on login and invite screens, but not to pending members', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const previousLocation = globalThis.location;
  try {
    const { default: Auth } = await server.ssrLoadModule('/src/Auth.jsx');
    const workspace = { user: null, team: null, member: null, authLoading: false, enterDemo() {} };
    globalThis.location = new URL('http://localhost:5173/?auth=login');
    const login = renderToStaticMarkup(React.createElement(Auth, { w: workspace }));
    assert.ok(login.includes('Continue with Google'));
    assert.ok(login.includes('Email'));
    globalThis.location = new URL('http://localhost:5173/?invite=ABC123');
    const invite = renderToStaticMarkup(React.createElement(Auth, { w: workspace }));
    assert.ok(invite.includes('You have a team invite.'));
    assert.ok(invite.includes('ABC123'));
    assert.ok(invite.includes('Continue with Google'));
    const pending = renderToStaticMarkup(
      React.createElement(Auth, {
        w: { ...workspace, user: {}, team: {}, member: { status: 'pending' } },
      }),
    );
    assert.ok(pending.includes('Check status'));
    assert.ok(!pending.includes('Continue with Google'));
    const joining = renderToStaticMarkup(
      React.createElement(Auth, {
        w: { ...workspace, user: { user_metadata: { full_name: 'Team Member' } } },
      }),
    );
    assert.ok(joining.includes('Request to join'));
    assert.ok(joining.includes('Team Member'));
    assert.ok(!joining.includes('Continue with Google'));
  } finally {
    globalThis.location = previousLocation;
    await server.close();
  }
});
