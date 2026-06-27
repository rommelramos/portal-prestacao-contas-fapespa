import { prisma } from "@/lib/prisma";

export type ExistingItem = {
  kind: "manual" | "documento";
  label: string;
  indexed: boolean;
  chunks: number;
};

/**
 * Lista, por financiador, todos os documentos cadastrados (versões de manuais
 * e legislações) com o status de indexação (indexado x apenas salvo no Blob).
 */
export async function getExistingByFunder(): Promise<
  Record<string, ExistingItem[]>
> {
  const [versions, documents] = await Promise.all([
    prisma.manualVersion.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        version: true,
        indexed: true,
        manual: { select: { title: true, funderId: true } },
        _count: { select: { chunks: true } },
      },
    }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        title: true,
        indexed: true,
        funderId: true,
        _count: { select: { chunks: true } },
      },
    }),
  ]);

  const map: Record<string, ExistingItem[]> = {};
  for (const v of versions) {
    (map[v.manual.funderId] ??= []).push({
      kind: "manual",
      label: `${v.manual.title} (v. ${v.version})`,
      indexed: v.indexed,
      chunks: v._count.chunks,
    });
  }
  for (const d of documents) {
    (map[d.funderId] ??= []).push({
      kind: "documento",
      label: d.title,
      indexed: d.indexed,
      chunks: d._count.chunks,
    });
  }
  return map;
}
