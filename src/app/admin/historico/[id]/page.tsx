import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

function parseCitations(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function AdminConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const chat = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      funder: { select: { name: true } },
      manualVersion: { select: { version: true, manual: { select: { title: true } } } },
      document: { select: { title: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chat) notFound();

  const scopeLabel = chat.manualVersion
    ? `${chat.manualVersion.manual.title} v. ${chat.manualVersion.version}`
    : chat.document
      ? chat.document.title
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/admin/historico" className="text-sm text-muted hover:underline">
        ← Histórico global
      </Link>
      <div className="mb-4 mt-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {chat.title ?? "Consulta"}
        </h1>
        <p className="text-sm text-muted">
          {chat.user.name} ({chat.user.email}) · {chat.funder.name}
          {scopeLabel ? ` · ${scopeLabel}` : ""} · {fmt(chat.createdAt)}
        </p>
      </div>

      <div className="space-y-4">
        {chat.messages.map((m) => {
          const citations = m.role === "ASSISTANT" ? parseCitations(m.citations) : [];
          return (
            <div
              key={m.id}
              className={m.role === "USER" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "USER"
                    ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[90%] rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                }
              >
                {m.role === "ASSISTANT" ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                {citations.length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-xs font-medium text-muted">Fontes consultadas:</p>
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
    </div>
  );
}
