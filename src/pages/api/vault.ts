import type { APIRoute } from "astro";
import { getTursoClient, isTursoConfigured } from "../../lib/turso";

export const prerender = false;

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(): string {
  let code = "PK-";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

// GET: Consultar el estado de una bóveda por código
export const GET: APIRoute = async ({ url }) => {
  if (!isTursoConfigured()) {
    return jsonResponse(
      { success: false, error: "TURSO_NOT_CONFIGURED", message: "Turso no está configurado en las variables de entorno." },
      503
    );
  }

  const code = url.searchParams.get("code")?.toUpperCase().trim();
  if (!code) {
    return jsonResponse({ success: false, error: "MISSING_CODE", message: "Código de bóveda requerido." }, 400);
  }

  const client = getTursoClient();
  if (!client) {
    return jsonResponse({ success: false, error: "TURSO_CLIENT_ERROR", message: "Error al conectar con Turso." }, 500);
  }

  try {
    const rs = await client.execute({
      sql: "SELECT payload, updated_at FROM sync_vaults WHERE code = ?",
      args: [code],
    });

    if (rs.rows.length === 0) {
      return jsonResponse({ success: false, error: "VAULT_NOT_FOUND", message: "No existe ninguna bóveda con este código." }, 404);
    }

    const row = rs.rows[0];
    return jsonResponse({
      success: true,
      code,
      payload: row.payload,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("Error al consultar bóveda en Turso:", err);
    return jsonResponse({ success: false, error: "DATABASE_ERROR", message: "Error al consultar la base de datos." }, 500);
  }
};

// POST: Crear una nueva bóveda en la nube
export const POST: APIRoute = async ({ request }) => {
  if (!isTursoConfigured()) {
    return jsonResponse(
      { success: false, error: "TURSO_NOT_CONFIGURED", message: "Turso no está configurado en las variables de entorno." },
      503
    );
  }

  const client = getTursoClient();
  if (!client) {
    return jsonResponse({ success: false, error: "TURSO_CLIENT_ERROR", message: "Error al conectar con Turso." }, 500);
  }

  let body: { payload?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = typeof body.payload === "string" ? body.payload : "";
  const secretKey = crypto.randomUUID();
  const now = Date.now();

  // Intentar crear un código único con reintentos en caso de colisión
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await client.execute({
        sql: "INSERT INTO sync_vaults (code, secret_key, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [code, secretKey, payload, now, now],
      });

      return jsonResponse(
        {
          success: true,
          code,
          secretKey,
          updatedAt: now,
        },
        201
      );
    } catch (err: unknown) {
      const errStr = String(err);
      if (errStr.includes("UNIQUE") || errStr.includes("PRIMARY KEY")) {
        continue;
      }
      console.error("Error al insertar bóveda en Turso:", err);
      return jsonResponse({ success: false, error: "DATABASE_ERROR", message: "Error al guardar en Turso." }, 500);
    }
  }

  return jsonResponse({ success: false, error: "COLLISION_ERROR", message: "No se pudo generar un código disponible." }, 500);
};

// PUT: Actualizar una bóveda existente
export const PUT: APIRoute = async ({ request }) => {
  if (!isTursoConfigured()) {
    return jsonResponse(
      { success: false, error: "TURSO_NOT_CONFIGURED", message: "Turso no está configurado en las variables de entorno." },
      503
    );
  }

  const client = getTursoClient();
  if (!client) {
    return jsonResponse({ success: false, error: "TURSO_CLIENT_ERROR", message: "Error al conectar con Turso." }, 500);
  }

  let body: { code?: string; secretKey?: string; payload?: string } = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "INVALID_JSON", message: "Cuerpo de solicitud no válido." }, 400);
  }

  const code = body.code?.toUpperCase().trim();
  const secretKey = body.secretKey?.trim();
  const payload = body.payload;

  if (!code || !secretKey || typeof payload !== "string") {
    return jsonResponse({ success: false, error: "MISSING_FIELDS", message: "code, secretKey y payload requeridos." }, 400);
  }

  const now = Date.now();

  try {
    const rs = await client.execute({
      sql: "UPDATE sync_vaults SET payload = ?, updated_at = ? WHERE code = ? AND secret_key = ?",
      args: [payload, now, code, secretKey],
    });

    if (rs.rowsAffected === 0) {
      return jsonResponse(
        { success: false, error: "UNAUTHORIZED", message: "Bóveda no encontrada o clave no válida." },
        403
      );
    }

    return jsonResponse({ success: true, code, updatedAt: now });
  } catch (err) {
    console.error("Error al actualizar bóveda en Turso:", err);
    return jsonResponse({ success: false, error: "DATABASE_ERROR", message: "Error al actualizar en Turso." }, 500);
  }
};

// DELETE: Eliminar permanentemente una bóveda de Turso
export const DELETE: APIRoute = async ({ request }) => {
  if (!isTursoConfigured()) {
    return jsonResponse(
      { success: false, error: "TURSO_NOT_CONFIGURED", message: "Turso no está configurado en las variables de entorno." },
      503
    );
  }

  const client = getTursoClient();
  if (!client) {
    return jsonResponse({ success: false, error: "TURSO_CLIENT_ERROR", message: "Error al conectar con Turso." }, 500);
  }

  let body: { code?: string; secretKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "INVALID_JSON", message: "Cuerpo de solicitud no válido." }, 400);
  }

  const code = body.code?.toUpperCase().trim();
  const secretKey = body.secretKey?.trim();

  if (!code || !secretKey) {
    return jsonResponse({ success: false, error: "MISSING_FIELDS", message: "code y secretKey requeridos." }, 400);
  }

  try {
    const rs = await client.execute({
      sql: "DELETE FROM sync_vaults WHERE code = ? AND secret_key = ?",
      args: [code, secretKey],
    });

    if (rs.rowsAffected === 0) {
      return jsonResponse(
        { success: false, error: "UNAUTHORIZED", message: "Bóveda no encontrada o clave no válida." },
        403
      );
    }

    return jsonResponse({
      success: true,
      message: "Bóveda eliminada permanentemente de Turso.",
    });
  } catch (err) {
    console.error("Error al eliminar bóveda en Turso:", err);
    return jsonResponse({ success: false, error: "DATABASE_ERROR", message: "Error al eliminar en Turso." }, 500);
  }
};
