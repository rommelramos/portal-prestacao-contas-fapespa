import { SignJWT, jwtVerify } from "jose";

// Token de redefinição de senha — assinado com AUTH_SECRET, sem armazenamento
// em banco. Curta validade (1h) e propósito específico (pwreset).
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

export async function signResetToken(userId: string): Promise<string> {
  return new SignJWT({ purpose: "pwreset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret());
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "pwreset" || !payload.sub) return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}
