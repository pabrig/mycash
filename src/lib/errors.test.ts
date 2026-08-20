import { describe, expect, it } from "vitest";
import { errorParts, friendlyError, loginQueryError } from "./errors";

describe("errorParts", () => {
  it("reads AuthApiError-shaped objects", () => {
    expect(
      errorParts({
        message: "For security purposes, you can only request this after 60 seconds.",
        status: 429,
        code: "over_email_send_rate_limit",
      }),
    ).toEqual({
      message: "For security purposes, you can only request this after 60 seconds.",
      code: "over_email_send_rate_limit",
      status: 429,
    });
  });

  it("does not stringify a plain Postgrest object as [object Object]", () => {
    expect(
      errorParts({ message: "JWT expired", code: "PGRST301" }),
    ).toEqual({
      message: "JWT expired",
      code: "PGRST301",
      status: null,
    });
  });
});

describe("friendlyError · magic link", () => {
  it("maps the 60-second OTP throttle", () => {
    expect(
      friendlyError(
        {
          message:
            "For security purposes, you can only request this after 60 seconds.",
          status: 429,
          code: "over_email_send_rate_limit",
        },
        "No se pudo enviar el link.",
      ),
    ).toBe("Esperá un minuto y pedí el link de nuevo.");
  });

  it("maps the same throttle without a code (older clients)", () => {
    expect(
      friendlyError(
        "For security purposes, you can only request this once every 60 seconds",
        "No se pudo enviar el link.",
      ),
    ).toBe("Esperá un minuto y pedí el link de nuevo.");
  });

  it("maps a tiny wait as un toque", () => {
    expect(
      friendlyError(
        {
          code: "over_email_send_rate_limit",
          message: "For security purposes, you can only request this after 0 seconds.",
          status: 429,
        },
        "No se pudo enviar el link.",
      ),
    ).toBe("Esperá un toque y pedí el link de nuevo.");
  });

  it("maps a code-only email cap without wait seconds", () => {
    expect(
      friendlyError(
        { code: "over_email_send_rate_limit", message: "email rate limit exceeded", status: 429 },
        "No se pudo enviar el link.",
      ),
    ).toBe("Hoy ya se enviaron muchos mails. Probá más tarde.");
  });

  it("maps project-wide email cap from the message", () => {
    expect(
      friendlyError("Email rate limit exceeded", "No se pudo enviar el link."),
    ).toBe("Hoy ya se enviaron muchos mails. Probá más tarde.");
  });

  it("maps IP request limit", () => {
    expect(
      friendlyError(
        { code: "over_request_rate_limit", status: 429, message: "Too many requests" },
        "No se pudo enviar el link.",
      ),
    ).toBe("Demasiados intentos. Probá de nuevo en un rato.");
  });
});

describe("friendlyError · other auth", () => {
  it("maps expired magic link", () => {
    expect(
      friendlyError({ code: "otp_expired", message: "OTP expired" }, "fallback"),
    ).toBe("El link expiró. Pedí uno nuevo.");
  });

  it("maps invalid email", () => {
    expect(
      friendlyError(
        {
          code: "email_address_invalid",
          message: "Unable to validate email address: invalid format",
        },
        "fallback",
      ),
    ).toBe("Ese email no parece válido.");
  });

  it("maps expired session", () => {
    expect(
      friendlyError("Invalid Refresh Token", "fallback"),
    ).toBe("Se venció el acceso. Entrá de nuevo.");
  });
});

describe("friendlyError · sync and invites", () => {
  it("uses the offline copy for sync", () => {
    expect(
      friendlyError(new TypeError("Failed to fetch"), "No se pudo guardar.", {
        offline: "Sin conexión. Estamos mostrando lo de este celular.",
      }),
    ).toBe("Sin conexión. Estamos mostrando lo de este celular.");
  });

  it("maps expired invite", () => {
    expect(
      friendlyError("Invalid or expired invite", "Ese código no sirve"),
    ).toBe("Código inválido o vencido.");
  });

  it("maps RLS without leaking English", () => {
    expect(
      friendlyError(
        {
          message: "new row violates row-level security policy",
          code: "42501",
        },
        "No se pudo guardar.",
      ),
    ).toBe("No se pudo guardar.");
  });

  it("keeps our own Spanish", () => {
    expect(friendlyError("Falta el nombre", "fallback")).toBe("Falta el nombre");
  });

  it("never returns raw English", () => {
    expect(
      friendlyError("unexpected_failure: boom from GoTrue", "Algo salió mal. Probá de nuevo."),
    ).toBe("Algo salió mal. Probá de nuevo.");
  });
});

describe("loginQueryError", () => {
  it("maps callback query codes", () => {
    expect(loginQueryError("auth")).toBe(
      "El link expiró o no es válido. Pedí uno nuevo.",
    );
    expect(loginQueryError("supabase")).toBe("No se puede entrar ahora.");
    expect(loginQueryError(null)).toBeNull();
  });
});
