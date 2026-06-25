import { forwardRef } from "react";
import logo from "@/assets/logo-report.png";

interface MateriaSlice {
  nome: string;
  cor: string;
  horas: number;
  pct: number;
}

interface Props {
  nome: string;
  periodoLabel: string;
  totalHoras: number;
  mediaGeral: number;
  fatias: MateriaSlice[];
  questoesFeitas: number;
  questoesAcertos: number;
}

export const CronoShareCard = forwardRef<HTMLDivElement, Props>(function CronoShareCard(
  { nome, periodoLabel, totalHoras, mediaGeral, fatias, questoesFeitas, questoesAcertos },
  ref
) {
  const acima = totalHoras >= mediaGeral;
  const diff = Math.abs(totalHoras - mediaGeral);
  const acerto = questoesFeitas > 0 ? Math.round((questoesAcertos / questoesFeitas) * 100) : 0;

  // donut
  const size = 520;
  const r = 200;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segs = fatias.map((f) => {
    const len = (f.pct / 100) * c;
    const seg = { ...f, dash: `${len} ${c - len}`, offset: -offset };
    offset += len;
    return seg;
  });

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1920,
        background: "linear-gradient(160deg, #0B0D14 0%, #11131F 55%, #1B1430 100%)",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 80,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* glow */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 700, height: 700, background: "radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)", filter: "blur(20px)" }} />
      <div style={{ position: "absolute", bottom: -300, left: -200, width: 800, height: 800, background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(20px)" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, zIndex: 1 }}>
        <img src={logo} alt="Salinha" style={{ height: 90, width: 90, borderRadius: 20 }} crossOrigin="anonymous" />
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>Salinha de Estudos</div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.55)" }}>Meu progresso · {periodoLabel}</div>
        </div>
      </div>

      <div style={{ marginTop: 60, zIndex: 1 }}>
        <div style={{ fontSize: 40, color: "rgba(255,255,255,0.7)" }}>👋 {nome}</div>
        <div style={{ marginTop: 16, fontSize: 96, fontWeight: 900, lineHeight: 1, color: "#EAB308" }}>
          {totalHoras.toFixed(1)}h
        </div>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>de estudo registradas</div>
      </div>

      {/* Donut */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 60, zIndex: 1 }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={70} />
          {segs.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.cor}
              strokeWidth={70}
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          ))}
          <text x={size / 2} y={size / 2 - 10} textAnchor="middle" fill="white" fontSize="72" fontWeight="800">
            {totalHoras.toFixed(1)}h
          </text>
          <text x={size / 2} y={size / 2 + 50} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="28">
            Total
          </text>
        </svg>
      </div>

      {/* Top materias */}
      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14, zIndex: 1 }}>
        {fatias.slice(0, 5).map((f) => (
          <div key={f.nome} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
            <span style={{ width: 18, height: 18, background: f.cor, borderRadius: 999 }} />
            <span style={{ flex: 1, color: "rgba(255,255,255,0.85)" }}>{f.nome}</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>{f.horas.toFixed(1)}h · {f.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Comparativo */}
      <div style={{ marginTop: "auto", paddingTop: 50, zIndex: 1 }}>
        <div
          style={{
            borderRadius: 32,
            padding: 32,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
            <span>Você</span><span style={{ color: "#EAB308", fontWeight: 700 }}>{totalHoras.toFixed(1)}h</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, marginTop: 8 }}>
            <span>Média geral</span><span style={{ color: "rgba(255,255,255,0.7)" }}>{mediaGeral.toFixed(1)}h</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 30, fontWeight: 700, color: acima ? "#10B981" : "#F59E0B" }}>
            {acima ? "🔥" : "⏳"} {acima ? `+${diff.toFixed(1)}h acima da média` : `${diff.toFixed(1)}h abaixo da média`}
          </div>

          {questoesFeitas > 0 && (
            <div style={{ marginTop: 28, display: "flex", gap: 32, fontSize: 26 }}>
              <div><div style={{ color: "rgba(255,255,255,0.55)", fontSize: 20 }}>Questões</div><div style={{ fontWeight: 700 }}>{questoesFeitas}</div></div>
              <div><div style={{ color: "rgba(255,255,255,0.55)", fontSize: 20 }}>Acerto</div><div style={{ fontWeight: 700, color: "#EAB308" }}>{acerto}%</div></div>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, color: "rgba(255,255,255,0.45)", fontSize: 22 }}>
          salinhadeestudos.com.br
        </div>
      </div>
    </div>
  );
});
