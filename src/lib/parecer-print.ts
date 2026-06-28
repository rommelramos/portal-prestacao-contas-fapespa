import { marked } from "marked";
import DOMPurify from "dompurify";

type ParecerMeta = {
  funderName: string;
  manualLabel: string;
  userName: string;
  title: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Abre uma janela com o parecer formatado e dispara a impressão (o usuário
 * salva como PDF). Mantém o documento isolado da aplicação.
 */
export function openParecerPrint(parecerMd: string, meta: ParecerMeta): boolean {
  // Sanitiza o HTML gerado do markdown antes de injetar na janela de impressão,
  // evitando execução de qualquer HTML/script que tenha vindo do conteúdo.
  const rawBody = marked.parse(parecerMd, { async: false }) as string;
  const body = DOMPurify.sanitize(rawBody);
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(),
  );

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Parecer Técnico — ${esc(meta.funderName)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #111; line-height: 1.6; font-size: 12pt; }
  .head { text-align: center; border-bottom: 2px solid #0f6e8c; padding-bottom: 10px; margin-bottom: 18px; }
  .brand { font-family: Arial, sans-serif; font-size: 10pt; letter-spacing: .5px; color: #0f6e8c; text-transform: uppercase; }
  h1 { font-size: 17pt; margin: 6px 0 0; }
  .meta { font-family: Arial, sans-serif; font-size: 10pt; margin: 0 0 22px; border: 1px solid #ddd; border-radius: 6px; }
  .meta div { display: flex; border-top: 1px solid #eee; }
  .meta div:first-child { border-top: 0; }
  .meta span { padding: 5px 10px; }
  .meta .k { width: 130px; background: #f3f6f8; font-weight: bold; }
  h2 { font-size: 13pt; margin: 18px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  p { margin: 0 0 10px; text-align: justify; }
  ul, ol { margin: 0 0 10px; padding-left: 22px; }
  li { margin-bottom: 4px; }
  strong { font-weight: bold; }
  .foot { margin-top: 28px; border-top: 1px solid #ccc; padding-top: 10px; font-family: Arial, sans-serif; font-size: 8.5pt; color: #555; }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">Portal de Manuais de Prestação de Contas · ISACI</div>
    <h1>Parecer Técnico</h1>
  </div>
  <div class="meta">
    <div><span class="k">Financiador</span><span>${esc(meta.funderName)}</span></div>
    <div><span class="k">Base normativa</span><span>${esc(meta.manualLabel)}</span></div>
    <div><span class="k">Consulente</span><span>${esc(meta.userName || "—")}</span></div>
    <div><span class="k">Data</span><span>${date}</span></div>
  </div>
  ${body}
  <div class="foot">
    Documento gerado automaticamente pelo Portal de Manuais de Prestação de Contas com apoio de inteligência artificial,
    com base exclusivamente nos documentos cadastrados do financiador. Tem caráter orientativo e não vinculante;
    decisões finais cabem ao setor responsável.
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
