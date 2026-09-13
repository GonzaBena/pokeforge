import test from 'node:test'
import assert from 'node:assert/strict'
import {
  apiCreateVault,
  apiGetVault,
  apiUpdateVault,
  apiDeleteVault,
  parseVaultResponse,
} from '../src/lib/vaultApi'

test('parseVaultResponse - parses successful JSON response', async () => {
  const mockRes = new Response(
    JSON.stringify({ success: true, code: 'PK-1234', secretKey: 'sec-key', updatedAt: 1000 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
  const result = await parseVaultResponse(mockRes)
  assert.equal(result.success, true)
  assert.equal(result.code, 'PK-1234')
  assert.equal(result.secretKey, 'sec-key')
})

test('parseVaultResponse - handles 503 DB_NOT_CONFIGURED response with informative message', async () => {
  const mockRes = new Response(
    JSON.stringify({
      success: false,
      error: 'DB_NOT_CONFIGURED',
      message: 'La base de datos no está configurada en las variables de entorno.',
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  )
  const result = await parseVaultResponse(mockRes)
  assert.equal(result.success, false)
  assert.equal(result.statusCode, 503)
  assert.equal(result.error, 'La base de datos no está configurada en las variables de entorno.')
})

test('parseVaultResponse - handles 502 Bad Gateway text response gracefully without throwing', async () => {
  const mockRes = new Response(
    JSON.stringify({ errorType: 'Error', errorMessage: 'Cannot find module...' }),
    { status: 502, headers: { 'Content-Type': 'text/plain' } },
  )
  const result = await parseVaultResponse(mockRes)
  assert.equal(result.success, false)
  assert.equal(result.statusCode, 502)
  assert.ok(
    result.error?.includes('502') || result.error?.includes('servidor'),
    'error must describe server error',
  )
})

test('parseVaultResponse - handles HTML error page gracefully', async () => {
  const mockRes = new Response('<html><body>502 Bad Gateway</body></html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html' },
  })
  const result = await parseVaultResponse(mockRes)
  assert.equal(result.success, false)
  assert.equal(result.statusCode, 502)
})

test('apiGetVault - calls endpoint with encoded code and returns result', async () => {
  let calledUrl = ''
  const mockFetch = (url: string | URL | Request) => {
    calledUrl = String(url)
    return Promise.resolve(
      new Response(
        JSON.stringify({ success: true, code: 'PK-TEST', payload: 'payload-123', updatedAt: 2000 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
  }

  const result = await apiGetVault('PK-TEST', mockFetch as unknown as typeof fetch)
  assert.equal(result.success, true)
  assert.equal(result.code, 'PK-TEST')
  assert.equal(result.payload, 'payload-123')
  assert.ok(calledUrl.includes('/api/vault?code=PK-TEST'))
})

test('apiCreateVault - catches network errors gracefully', async () => {
  const failingFetch = () => Promise.reject(new Error('Network offline'))
  const result = await apiCreateVault('sample-payload', failingFetch as unknown as typeof fetch)
  assert.equal(result.success, false)
  assert.ok(result.error?.includes('conexión') || result.error?.includes('servidor'))
})

test('apiUpdateVault - sends PUT request with payload and secret', async () => {
  let requestMethod = ''
  let requestBody = ''
  const mockFetch = (_url: string | URL | Request, init?: RequestInit) => {
    requestMethod = init?.method || ''
    requestBody = String(init?.body || '')
    return Promise.resolve(
      new Response(JSON.stringify({ success: true, code: 'PK-TEST', updatedAt: 3000 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }

  const result = await apiUpdateVault(
    'PK-TEST',
    'sec',
    'payload',
    mockFetch as unknown as typeof fetch,
  )
  assert.equal(result.success, true)
  assert.equal(requestMethod, 'PUT')
  assert.ok(requestBody.includes('PK-TEST'))
})

test('apiDeleteVault - sends DELETE request with code and secret', async () => {
  let requestMethod = ''
  const mockFetch = (_url: string | URL | Request, init?: RequestInit) => {
    requestMethod = init?.method || ''
    return Promise.resolve(
      new Response(JSON.stringify({ success: true, message: 'Deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }

  const result = await apiDeleteVault('PK-TEST', 'sec', mockFetch as unknown as typeof fetch)
  assert.equal(result.success, true)
  assert.equal(requestMethod, 'DELETE')
})
