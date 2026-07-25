import logoImg from "@/assets/logo-report.png";

interface AnswerKeyData {
  publicId: number;
  title: string;
  career: string;
  discipline: string;
  subject?: string | null;
  banca?: string | null;
  year?: number | null;
  statement: string;
  barema?: any;
  mirrorText?: string | null;
  idealAnswer?: string | null;
}

function esc(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

function paragraphize(text: string): string {
  if (!text) return '<p style="margin:0;color:#94a3b8;font-style:italic;">Não informado.</p>';
  return esc(text)
    .split(/\n\s*\n|\n/)
    .filter((p) => p.trim())
    .map((p) => `<p style="margin:0 0 10px 0;">${p.trim()}</p>`)
    .join("");
}

function renderBaremaTable(barema: any): string {
  // Try to detect a structured barema (array of items with subitems/score)
  if (Array.isArray(barema) && barema.length > 0) {
    let totalMax = 0;
    const rows = barema
      .map((item: any, idx: number) => {
        const letter = item.letter || String.fromCharCode(65 + idx);
        const title = item.title || item.criterio || item.description || "";
        const maxScore = Number(item.maxScore ?? item.pontuacao ?? item.score ?? 0);
        totalMax += isNaN(maxScore) ? 0 : maxScore;

        let subRows = "";
        if (Array.isArray(item.subitems) && item.subitems.length > 0) {
          subRows = item.subitems
            .map(
              (s: any) => `
              <tr style="background:#f8fafc;">
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:11px;color:#64748b;">↳</td>
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#475569;">${esc(s.description || s.criterio || "")}</td>
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#475569;text-align:right;font-weight:600;">${Number(s.maxScore ?? s.pontuacao ?? 0).toFixed(2)}</td>
              </tr>`
            )
            .join("");
        }

        return `
          <tr>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:700;text-align:center;width:50px;">${esc(letter)}</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:600;">${esc(title)}</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;text-align:right;font-weight:700;width:100px;">${maxScore.toFixed(2)}</td>
          </tr>
          ${subRows}
        `;
      })
      .join("");

    return `
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#1e2a4a;">
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:center;border:0.5px solid #1e2a4a;">Item</th>
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:left;border:0.5px solid #1e2a4a;">Critério avaliado</th>
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:right;border:0.5px solid #1e2a4a;">Pontuação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f1f5f9;">
            <td colspan="2" style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#1e2a4a;font-weight:700;text-align:right;text-transform:uppercase;">Total</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:700;text-align:right;">${totalMax.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Fallback: parse plain text barema (format used in cadastro:
  //   "1. Título do critério (2,0 pontos)
  //    Subitem A
  //    Subitem B")
  const text =
    typeof barema === "string"
      ? barema
      : barema
      ? JSON.stringify(barema, null, 2)
      : "";

  if (!text.trim()) {
    return `<p style="color:#94a3b8;font-style:italic;font-size:13px;">Barema não cadastrado.</p>`;
  }

  // Try structured parsing
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const items: { num: string; title: string; score: number; subitems: { text: string; score?: number }[] }[] = [];
  let current: (typeof items)[number] | null = null;
  // Matches "1." / "1)" / "I -" optionally and ends with "(X,X ponto[s])"
  const headerRe = /^(\d+)[\.\)]\s*(.+?)\s*\(\s*([\d.,]+)\s*pontos?\s*\)\s*$/i;
  // Subitem line possibly with its own "(X,X)" score at the end
  const subScoreRe = /^(.+?)\s*\(\s*([\d.,]+)\s*\)\s*$/;

  for (const line of lines) {
    if (!line) continue;
    const m = line.match(headerRe);
    if (m) {
      current = {
        num: m[1],
        title: m[2],
        score: parseFloat(m[3].replace(",", ".")),
        subitems: [],
      };
      items.push(current);
    } else if (current) {
      const sm = line.match(subScoreRe);
      if (sm) {
        current.subitems.push({
          text: sm[1],
          score: parseFloat(sm[2].replace(",", ".")),
        });
      } else {
        current.subitems.push({ text: line });
      }
    }
  }

  if (items.length > 0) {
    let totalMax = 0;
    const rows = items
      .map((it) => {
        totalMax += isNaN(it.score) ? 0 : it.score;
        const subRows = it.subitems
          .map(
            (s) => `
              <tr style="background:#f8fafc;">
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">↳</td>
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#475569;line-height:1.6;">${esc(s.text)}</td>
                <td style="padding:8px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#475569;text-align:right;font-weight:600;">${
                  s.score !== undefined && !isNaN(s.score) ? s.score.toFixed(2).replace(".", ",") : "—"
                }</td>
              </tr>`
          )
          .join("");
        return `
          <tr>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:700;text-align:center;width:50px;background:#eef2ff;">${esc(it.num)}</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:600;background:#eef2ff;">${esc(it.title)}</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;text-align:right;font-weight:700;width:110px;background:#eef2ff;">${it.score.toFixed(2).replace(".", ",")}</td>
          </tr>
          ${subRows}
        `;
      })
      .join("");

    return `
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:0.5px solid #e2e8f0;">
        <thead>
          <tr style="background:#1e2a4a;">
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:center;border:0.5px solid #1e2a4a;">Item</th>
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:left;border:0.5px solid #1e2a4a;">Critério avaliado</th>
            <th style="padding:12px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.05em;text-align:right;border:0.5px solid #1e2a4a;">Pontuação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f1f5f9;">
            <td colspan="2" style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:12px;color:#1e2a4a;font-weight:700;text-align:right;text-transform:uppercase;">Total</td>
            <td style="padding:10px 12px;border:0.5px solid #e2e8f0;font-size:13px;color:#1e2a4a;font-weight:700;text-align:right;">${totalMax.toFixed(2).replace(".", ",")}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Last resort: render as preformatted text
  return `<div style="background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:8px;padding:14px;font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(text)}</div>`;
}

export async function generateAnswerKeyReport(data: AnswerKeyData) {
  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Gerando gabarito...</title></head><body style="font-family:system-ui;padding:40px;text-align:center;color:#475569;">Gerando gabarito…</body></html>'
    );
  }

  const logoBase64 = await toBase64(logoImg);
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`;
  const qCode = `Q-${String(data.publicId).padStart(3, "0")}`;

  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" style="height:48px;width:auto;object-fit:contain;" />`
    : `<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="22" fill="#2d3f6a"/><text x="24" y="30" text-anchor="middle" fill="#c8d6f0" font-size="20" font-weight="bold">⚖</text></svg>`;

  // O "Barema / Critérios de Correção (texto livre)" é salvo em mirror_text.
  // Usamos ele como fonte primária; se não houver, caímos no JSON estruturado.
  const baremaSource = data.mirrorText && data.mirrorText.trim() ? data.mirrorText : data.barema;
  const baremaHTML = renderBaremaTable(baremaSource);
  const gabaritoText = data.idealAnswer || "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Gabarito - ${qCode}</title>
<style>
  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: #f8f9fc; color: #1e2a4a; line-height: 1.5; }
  .container { max-width: 800px; margin: 0 auto; padding: 0; background: #fff; }

  .header { background: #1e2a4a; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
  .header-left { display: flex; flex-direction: column; gap: 6px; }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .header-brand span { font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.1em; text-transform: uppercase; }
  .header-title { font-size: 22px; font-weight: 700; color: #fff; }
  .header-date { font-size: 12px; color: #93a8d4; }
  .header-badge { background: #20c997; color: #fff; padding: 8px 16px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 24px; }
  .id-card { border: 0.5px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 12px 14px; }
  .id-card-label { font-size: 11px; font-weight: 600; color: #6366f1; text-transform: uppercase; margin-bottom: 4px; }
  .id-card-value { font-size: 15px; font-weight: 700; color: #1e2a4a; }

  .meta-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 24px 16px 24px; }
  .meta-chip { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; }

  .section { padding: 0 24px; margin-top: 24px; }
  .section-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6366f1; letter-spacing: 0.08em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-label::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #6366f1; border-radius: 2px; }

  .content-card { border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #fff; }
  .content-text { font-size: 13px; line-height: 1.8; color: #374151; }

  .gabarito-card { background: #f8fafc; border-left: 4px solid #20c997; border-radius: 8px; padding: 20px; }
  .gabarito-text { font-size: 13px; line-height: 1.85; color: #1e2a4a; }
  .gabarito-text p { margin: 0 0 12px 0; text-align: justify; }

  .footer { text-align: center; padding: 24px; border-top: 0.5px solid #e2e8f0; margin-top: 32px; }
  .footer span { font-size: 10px; color: #94a3b8; }

  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e2a4a; color: #fff; border: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 999; }
  .print-btn:hover { background: #2d3f6a; }

  @media (max-width: 768px) {
    .cards-grid { grid-template-columns: 1fr; }
    .header { padding: 16px; flex-direction: column; gap: 12px; align-items: flex-start; }
    .section { padding: 0 12px; }
    .cards-grid { padding: 12px; }
    .meta-row { padding: 0 12px 12px 12px; }
  }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="header-left">
      <div class="header-brand">
        ${logoHTML}
        <span>SALINHA DE ESTUDOS</span>
      </div>
      <div class="header-title">Gabarito / Espelho de Resposta</div>
      <div class="header-date">Gerado em ${esc(dateStr)}</div>
    </div>
    <div class="header-badge">Gabarito</div>
  </div>

  <div class="cards-grid">
    <div class="id-card">
      <div class="id-card-label">ID Questão</div>
      <div class="id-card-value">${esc(qCode)}</div>
    </div>
    <div class="id-card">
      <div class="id-card-label">Cargo</div>
      <div class="id-card-value">${esc(data.career)}</div>
    </div>
    <div class="id-card">
      <div class="id-card-label">Matéria</div>
      <div class="id-card-value">${esc(data.discipline)}</div>
    </div>
  </div>

  <div class="meta-row">
    ${data.subject ? `<span class="meta-chip">📚 ${esc(data.subject)}</span>` : ""}
    ${data.banca ? `<span class="meta-chip">🏛 ${esc(data.banca)}</span>` : ""}
    ${data.year ? `<span class="meta-chip">📅 ${esc(String(data.year))}</span>` : ""}
  </div>

  <div class="section">
    <div class="section-label">Enunciado</div>
    <div class="content-card">
      <div class="content-text">${paragraphize(data.statement)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Barema</div>
    ${baremaHTML}
  </div>

  <div class="section">
    <div class="section-label">Gabarito / Espelho de Resposta</div>
    <div class="gabarito-card">
      <div class="gabarito-text">${paragraphize(gabaritoText)}</div>
    </div>
  </div>

  <div class="footer">
    <span>Salinha de Estudos — Gabarito da Questão ${esc(qCode)} — ${esc(dateStr)}</span>
  </div>

</div>

<button class="print-btn no-print" onclick="window.print()">📄 Salvar como PDF</button>

</body>
</html>`;

  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
