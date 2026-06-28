import type { NextAuthConfig } from "next-auth";

// Tempo de inatividade até a sessão expirar (RF003), configurável por env.
const SESSION_TIMEOUT_MINUTES = Number(
  process.env.SESSION_TIMEOUT_MINUTES ?? "60",
);
const SESSION_MAX_AGE = Math.max(5, SESSION_TIMEOUT_MINUTES) * 60; // segundos

// Configuração compartilhada e segura para o Edge Runtime (middleware).
// NÃO importa Prisma nem bcrypt aqui — apenas lógica de token/sessão.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Janela deslizante de inatividade: sem atividade por SESSION_MAX_AGE, a
    // sessão expira; com atividade, o token é renovado (a cada 5 min no máx.).
    maxAge: SESSION_MAX_AGE,
    updateAge: 5 * 60,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
