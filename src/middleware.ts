import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAdminArea = nextUrl.pathname.startsWith("/admin");
  const isUserArea = nextUrl.pathname.startsWith("/app");
  const isLoginPage = nextUrl.pathname === "/login";

  // Já autenticado tentando acessar o login → manda para a área correta.
  if (isLoginPage && isLoggedIn) {
    const dest = role === "ADMIN" ? "/admin" : "/app";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  // Áreas protegidas exigem login.
  if ((isAdminArea || isUserArea) && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // RBAC: usuário comum não entra no admin; admin não usa a área de usuário.
  if (isAdminArea && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }
  if (isUserArea && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Protege as áreas e o login; ignora estáticos e a API de auth.
  matcher: ["/admin/:path*", "/app/:path*", "/login"],
};
