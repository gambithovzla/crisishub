import "server-only";

/** Valida el token de invitación para /entrar/solicitud. */
export function isStaffInviteValid(token: string | undefined | null): boolean {
  const secret = process.env.STAFF_INVITE_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  return typeof token === "string" && token.length > 0 && token === secret;
}
