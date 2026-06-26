import { auth } from "@/lib/auth";

/**
 * Garante que há um administrador autenticado. Usar no início de server
 * actions sensíveis. As rotas /admin já são protegidas pelo middleware;
 * isto é a segunda camada (defesa em profundidade) para mutações.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Acesso não autorizado.");
  }
  return session.user;
}
