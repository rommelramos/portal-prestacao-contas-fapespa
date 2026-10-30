import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat-client";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const versions = await prisma.manualVersion.findMany({
    where: { active: true, manual: { funder: { active: true } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      version: true,
      manual: { select: { title: true, funderId: true } },
    },
  });

  const versionsByFunder: Record<
    string,
    { id: string; version: string; manualTitle: string }[]
  > = {};
  for (const v of versions) {
    (versionsByFunder[v.manual.funderId] ??= []).push({
      id: v.id,
      version: v.version,
      manualTitle: v.manual.title,
    });
  }

  // Documentos/legislações N:N: cada um aparece sob todos os financiadores que atende.
  const docLinks = await prisma.documentFunder.findMany({
    where: { funder: { active: true }, document: { active: true, indexed: true } },
    select: { funderId: true, document: { select: { id: true, title: true } } },
  });
  const documentsByFunder: Record<string, { id: string; title: string }[]> = {};
  for (const l of docLinks) {
    (documentsByFunder[l.funderId] ??= []).push({
      id: l.document.id,
      title: l.document.title,
    });
  }
  for (const list of Object.values(documentsByFunder)) {
    list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chatbot</h1>
        <p className="text-sm text-muted">
          Faça consultas às regras de prestação de contas, como um usuário.
        </p>
      </div>
      <div className="-mx-6 flex flex-1 flex-col border-t border-border">
        <ChatClient
          funders={funders}
          versionsByFunder={versionsByFunder}
          documentsByFunder={documentsByFunder}
        />
      </div>
    </div>
  );
}
