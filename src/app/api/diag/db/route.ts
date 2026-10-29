import { NextResponse, type NextRequest } from "next/server";
import mariadb from "mariadb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Diagnóstico TEMPORÁRIO: tenta conectar direto no MySQL (fora do pool do
// Prisma) e devolve o erro exato que o Vercel recebe. Protegido por DIAG_TOKEN.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.DIAG_TOKEN || token !== process.env.DIAG_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const url = new URL(process.env.DATABASE_URL ?? "");
  const started = Date.now();
  try {
    const conn = await mariadb.createConnection({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      connectTimeout: 8000,
    });
    const rows = await conn.query("SELECT 1 AS ok");
    await conn.end();
    return NextResponse.json({ ok: true, ms: Date.now() - started, rows });
  } catch (e) {
    const err = e as {
      name?: string;
      code?: string;
      errno?: number;
      sqlState?: string;
      message?: string;
    };
    return NextResponse.json({
      ok: false,
      ms: Date.now() - started,
      name: err?.name ?? null,
      code: err?.code ?? null,
      errno: err?.errno ?? null,
      sqlState: err?.sqlState ?? null,
      message: String(err?.message ?? e).slice(0, 500),
    });
  }
}
