import type { NextAuthConfig } from "next-auth";

// Configuração compartilhada e segura para o Edge Runtime (middleware).
// NÃO importa Prisma nem bcrypt aqui — apenas lógica de token/sessão.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
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
