import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCitations(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { id } = await params;

  const chat = await prisma.chatSession.findFirst({
    where: { id, userId },
    include: {
      funder: { select: { name: true } },
      manualVersion: {
        select: { version: true, manual: { select: { title: true } } },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chat) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link href="/app/historico" className="text-sm text-muted hover:underline">
        ← Histórico
      </Link>
      <div className="mb-4 mt-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {chat.title ?? "Consulta"}
        </h1>
        <p className="text-sm text-muted">
          {chat.funder.name}
          {chat.manualVersion
            ? ` · ${chat.manualVersion.manual.title} v. ${chat.manualVersion.version}`
            : " · todos os documentos"}
        </p>
      </div>

      <div className="space-y-4">
        {chat.messages.map((m) => {
          const citations = m.role === "ASSISTANT" ? parseCitations(m.citations) : [];
          return (
            <div
              key={m.id}
              className={
                m.role === "USER" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  m.role === "USER"
                    ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[90%] rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {citations.length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-xs font-medium text-muted">
                      Fontes consultadas:
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-muted">
                      {citations.map((c, j) => (
                        <li key={j}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/app/chat"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          Nova consulta
        </Link>
      </div>
    </div>
  );
}
