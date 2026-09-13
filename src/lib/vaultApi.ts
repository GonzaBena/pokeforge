export interface VaultApiResponse {
  success: boolean
  code?: string
  secretKey?: string
  payload?: string
  updatedAt?: number
  error?: string
  statusCode?: number
}

export async function parseVaultResponse(res: Response): Promise<VaultApiResponse> {
  const statusCode = res.status
  let json: Record<string, unknown> | null = null

  try {
    json = (await res.json()) as Record<string, unknown>
  } catch {
    // La respuesta no es JSON válido (ej. 502 Bad Gateway de Netlify/AWS Lambda, o HTML)
  }

  if (res.ok && json && json.success) {
    return {
      success: true,
      code: typeof json.code === 'string' ? json.code : undefined,
      secretKey: typeof json.secretKey === 'string' ? json.secretKey : undefined,
      payload: typeof json.payload === 'string' ? json.payload : undefined,
      updatedAt: typeof json.updatedAt === 'number' ? json.updatedAt : undefined,
      statusCode,
    }
  }

  // Si falló o la respuesta tiene un error
  let errorMessage: string | undefined
  if (json && typeof json.message === 'string') {
    errorMessage = json.message
  } else if (statusCode === 502 || statusCode === 504) {
    errorMessage =
      'Error del servidor (502): el servicio de sincronización no está respondiendo. Revisa el despliegue.'
  } else if (statusCode === 503) {
    errorMessage = 'La base de datos no está configurada en las variables de entorno.'
  } else if (!res.ok) {
    errorMessage = `Error en el servidor (${statusCode})`
  }

  return {
    success: false,
    statusCode,
    error: errorMessage || 'Error desconocido al comunicarse con el servidor',
  }
}

export async function apiGetVault(
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<VaultApiResponse> {
  try {
    const res = await fetchFn(`/api/vault?code=${encodeURIComponent(code)}&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    return await parseVaultResponse(res)
  } catch {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}

export async function apiCreateVault(
  payload: string,
  fetchFn: typeof fetch = fetch,
): Promise<VaultApiResponse> {
  try {
    const res = await fetchFn('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    })
    return await parseVaultResponse(res)
  } catch {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}

export async function apiUpdateVault(
  code: string,
  secretKey: string,
  payload: string,
  fetchFn: typeof fetch = fetch,
): Promise<VaultApiResponse> {
  try {
    const res = await fetchFn('/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, secretKey, payload }),
    })
    return await parseVaultResponse(res)
  } catch {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}

export async function apiDeleteVault(
  code: string,
  secretKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<VaultApiResponse> {
  try {
    const res = await fetchFn('/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, secretKey }),
    })
    return await parseVaultResponse(res)
  } catch {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}
