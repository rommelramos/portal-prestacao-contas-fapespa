import { put } from "@vercel/blob";

/** Faz upload de um PDF para o Vercel Blob e devolve a URL pública. */
export async function uploadPdf(
  file: File,
  prefix: string,
): Promise<{ url: string; pathname: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${Date.now()}-${safeName}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type || "application/pdf",
  });
  return { url: blob.url, pathname: blob.pathname };
}
