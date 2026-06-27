import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Versões de manuais ativas e indexadas, agrupadas por financiador.
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

  return <ChatClient funders={funders} versionsByFunder={versionsByFunder} />;
}
