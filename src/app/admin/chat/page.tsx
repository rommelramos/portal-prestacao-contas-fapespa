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

  const docs = await prisma.document.findMany({
    where: { active: true, indexed: true, funder: { active: true } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, funderId: true },
  });
  const documentsByFunder: Record<string, { id: string; title: string }[]> = {};
  for (const d of docs) {
    (documentsByFunder[d.funderId] ??= []).push({ id: d.id, title: d.title });
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
        <ChatClient funders={funders} versionsByFunder={versionsByFunder} />
      </div>
    </div>
  );
}
