/** Mensajes de error para quien usa la app. Nunca el texto crudo de la API. */

export type FriendlyErrorOptions = {
  /** Si no hay red. Por defecto: “Probá de nuevo en un rato”. */
  offline?: string;
};

function asRecord(err: unknown): Record<string, unknown> | null {
  if (typeof err === "object" && err !== null) return err as Record<string, unknown>;
  return null;
}

export function errorParts(err: unknown): {
  message: string;
  code: string;
  status: number | null;
} {
  if (err == null) return { message: "", code: "", status: null };
  if (typeof err === "string") return { message: err, code: "", status: null };

  const rec = asRecord(err);
  if (!rec) return { message: String(err), code: "", status: null };

  const message =
    typeof rec.message === "string"
      ? rec.message
      : typeof rec.error === "string"
        ? rec.error
        : "";
  const code = typeof rec.code === "string" ? rec.code : "";
  const status = typeof rec.status === "number" ? rec.status : null;

  return { message, code, status };
}

function waitForLink(seconds: number | null): string {
  if (seconds == null || seconds <= 15) {
    return "Esperá un toque y pedí el link de nuevo.";
  }
  if (seconds <= 90) {
    return "Esperá un minuto y pedí el link de nuevo.";
  }
  const minutes = Math.ceil(seconds / 60);
  return `Esperá ${minutes} minutos y pedí el link de nuevo.`;
}

function parseWaitSeconds(message: string): number | null {
  const match = message.match(
    /(?:after|every)\s+(\d+)\s+seconds?/i,
  );
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function isAppCopy(message: string): boolean {
  return /[áéíóúñ¿¡]|^(Falta |Ya hay |No se |Se venció |Código |Sin conexión |Eso ya |Todavía |Esperá |El link |Ese )/i.test(
    message,
  );
}

const BY_CODE: Record<string, string> = {
  over_request_rate_limit: "Demasiados intentos. Probá de nuevo en un rato.",
  over_sms_send_rate_limit: "Demasiados intentos. Probá de nuevo en un rato.",
  otp_expired: "El link expiró. Pedí uno nuevo.",
  otp_disabled: "No se puede entrar por email ahora.",
  email_provider_disabled: "No se puede entrar por email ahora.",
  signup_disabled: "No se puede entrar por email ahora.",
  email_address_invalid: "Ese email no parece válido.",
  email_address_not_authorized: "Ese email no está habilitado.",
  validation_failed: "Revisá los datos e intentá de nuevo.",
  invalid_credentials: "No se pudo entrar. Revisá el email.",
  user_banned: "Esta cuenta está bloqueada.",
  user_not_found: "No encontramos esa cuenta.",
  email_not_confirmed: "Revisá tu mail y abrí el link.",
  session_expired: "Se venció el acceso. Entrá de nuevo.",
  session_not_found: "Se venció el acceso. Entrá de nuevo.",
  bad_jwt: "Se venció el acceso. Entrá de nuevo.",
  refresh_token_not_found: "Se venció el acceso. Entrá de nuevo.",
  refresh_token_already_used: "Se venció el acceso. Entrá de nuevo.",
  flow_state_expired: "El link expiró. Pedí uno nuevo.",
  flow_state_not_found: "El link expiró. Pedí uno nuevo.",
  bad_code_verifier: "El link expiró. Pedí uno nuevo.",
  request_timeout: "Tardó demasiado. Probá de nuevo.",
  unexpected_failure: "Algo salió mal. Probá de nuevo.",
  captcha_failed: "No se pudo verificar. Probá de nuevo.",
};

const LOGIN_QUERY: Record<string, string> = {
  auth: "El link expiró o no es válido. Pedí uno nuevo.",
  supabase: "No se puede entrar ahora.",
};

export function loginQueryError(code: string | null): string | null {
  if (!code) return null;
  return LOGIN_QUERY[code] ?? null;
}

/**
 * Traduce errores de Auth, PostgREST y red a copy de la app.
 * Si no hay mapeo, usa `fallback` — nunca el inglés de la API.
 */
export function friendlyError(
  err: unknown,
  fallback: string,
  options: FriendlyErrorOptions = {},
): string {
  const { message, code, status } = errorParts(err);
  const text = message.trim();
  const offline =
    options.offline ?? "Sin conexión. Probá de nuevo en un rato.";

  const seconds = parseWaitSeconds(text);

  if (seconds != null || /for security purposes/i.test(text)) {
    return waitForLink(seconds);
  }

  if (code === "over_email_send_rate_limit" || /email rate limit exceeded/i.test(text)) {
    return "Hoy ya se enviaron muchos mails. Probá más tarde.";
  }

  if (code && BY_CODE[code]) return BY_CODE[code];

  if (status === 429 || /too many requests/i.test(text)) {
    return "Demasiados intentos. Probá de nuevo en un rato.";
  }

  if (/invalid or expired invite/i.test(text)) {
    return "Código inválido o vencido.";
  }

  if (
    /not authenticated|jwt|session|invalid refresh token/i.test(text) ||
    code === "PGRST301"
  ) {
    return "Se venció el acceso. Entrá de nuevo.";
  }

  if (/failed to fetch|networkerror|\bfetch\b/i.test(text)) {
    return offline;
  }

  if (
    /unable to validate email|invalid (email|format)/i.test(text) ||
    (code === "validation_failed" && /email/i.test(text))
  ) {
    return "Ese email no parece válido.";
  }

  if (/unable to send email|error sending.*email|smtp/i.test(text)) {
    return "No se pudo enviar el mail. Probá de nuevo.";
  }

  if (/row-level security|42501/i.test(text) || code === "42501") {
    return "No se pudo guardar.";
  }

  if (/duplicate key|unique constraint|23505/i.test(text) || code === "23505") {
    return "Eso ya está cargado.";
  }

  if (text && isAppCopy(text)) return text;

  return fallback;
}
