import test from 'node:test'
import assert from 'node:assert/strict'
import { GET, POST, PUT, DELETE } from '../src/pages/api/vault'
import type { APIContext } from 'astro'

test('vault endpoint GET - returns 503 when Turso DB is not configured', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  delete process.env.TURSO_DATABASE_URL
  delete process.env.TURSO_AUTH_TOKEN

  try {
    const url = new URL('https://example.com/api/vault?code=PK-TEST')
    const ctx = { url } as unknown as APIContext
    const res = await GET(ctx)
    assert.equal(res.status, 503)
    assert.equal(res.headers.get('Content-Type'), 'application/json')
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'DB_NOT_CONFIGURED')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
  }
})

test('vault endpoint GET - returns 400 when code is missing or empty', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'libsql://dummy.turso.io'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const url = new URL('https://example.com/api/vault')
    const ctx = { url } as unknown as APIContext
    const res = await GET(ctx)
    assert.equal(res.status, 400)
    assert.equal(res.headers.get('Content-Type'), 'application/json')
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'MISSING_CODE')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint PUT - returns 400 on malformed JSON body', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'libsql://dummy.turso.io'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const request = new Request('https://example.com/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    })
    const ctx = { request } as unknown as APIContext
    const res = await PUT(ctx)
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'INVALID_JSON')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint PUT - returns 400 when missing fields', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'libsql://dummy.turso.io'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const request = new Request('https://example.com/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'PK-TEST' }),
    })
    const ctx = { request } as unknown as APIContext
    const res = await PUT(ctx)
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'MISSING_FIELDS')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint DELETE - returns 400 on malformed JSON body', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'libsql://dummy.turso.io'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const request = new Request('https://example.com/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    })
    const ctx = { request } as unknown as APIContext
    const res = await DELETE(ctx)
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'INVALID_JSON')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint DELETE - returns 400 when missing fields', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'libsql://dummy.turso.io'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const request = new Request('https://example.com/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'PK-TEST' }),
    })
    const ctx = { request } as unknown as APIContext
    const res = await DELETE(ctx)
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.success, false)
    assert.equal(data.error, 'MISSING_FIELDS')
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint GET - catches unhandled runtime errors and returns 500 JSON response', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  // Invalid protocol or URL structure that causes createClient to fail
  process.env.TURSO_DATABASE_URL = 'invalid-url-scheme://'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const url = new URL('https://example.com/api/vault?code=PK-TEST')
    const ctx = { url } as unknown as APIContext
    const res = await GET(ctx)
    assert.equal(res.status, 500)
    assert.equal(res.headers.get('Content-Type'), 'application/json')
    const data = await res.json()
    assert.equal(data.success, false)
    assert.ok(data.error)
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint POST - catches unhandled runtime errors and returns 500 JSON response', async () => {
  const origUrl = process.env.TURSO_DATABASE_URL
  const origToken = process.env.TURSO_AUTH_TOKEN
  process.env.TURSO_DATABASE_URL = 'invalid-url-scheme://'
  process.env.TURSO_AUTH_TOKEN = 'dummy-token'

  try {
    const request = new Request('https://example.com/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: 'test' }),
    })
    const ctx = { request } as unknown as APIContext
    const res = await POST(ctx)
    assert.equal(res.status, 500)
    assert.equal(res.headers.get('Content-Type'), 'application/json')
    const data = await res.json()
    assert.equal(data.success, false)
    assert.ok(data.error)
  } finally {
    if (origUrl) process.env.TURSO_DATABASE_URL = origUrl
    else delete process.env.TURSO_DATABASE_URL
    if (origToken) process.env.TURSO_AUTH_TOKEN = origToken
    else delete process.env.TURSO_AUTH_TOKEN
  }
})

test('vault endpoint GET - top-level try/catch handles unexpected exceptions gracefully', async () => {
  const badCtx = {
    get url() {
      throw new Error('Fatal context error')
    },
  } as unknown as APIContext

  const res = await GET(badCtx)
  assert.equal(res.status, 500)
  assert.equal(res.headers.get('Content-Type'), 'application/json')
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error, 'SERVER_ERROR')
  assert.ok(data.message.includes('Fatal context error'))
})

test('vault endpoint POST - top-level try/catch handles unexpected exceptions gracefully', async () => {
  const badCtx = {
    get request() {
      throw new Error('Fatal POST context error')
    },
  } as unknown as APIContext

  const res = await POST(badCtx)
  assert.equal(res.status, 500)
  assert.equal(res.headers.get('Content-Type'), 'application/json')
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error, 'SERVER_ERROR')
  assert.ok(data.message.includes('Fatal POST context error'))
})

test('vault endpoint PUT - top-level try/catch handles unexpected exceptions gracefully', async () => {
  const badCtx = {
    get request() {
      throw new Error('Fatal PUT context error')
    },
  } as unknown as APIContext

  const res = await PUT(badCtx)
  assert.equal(res.status, 500)
  assert.equal(res.headers.get('Content-Type'), 'application/json')
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error, 'SERVER_ERROR')
  assert.ok(data.message.includes('Fatal PUT context error'))
})

test('vault endpoint DELETE - top-level try/catch handles unexpected exceptions gracefully', async () => {
  const badCtx = {
    get request() {
      throw new Error('Fatal DELETE context error')
    },
  } as unknown as APIContext

  const res = await DELETE(badCtx)
  assert.equal(res.status, 500)
  assert.equal(res.headers.get('Content-Type'), 'application/json')
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error, 'SERVER_ERROR')
  assert.ok(data.message.includes('Fatal DELETE context error'))
})
