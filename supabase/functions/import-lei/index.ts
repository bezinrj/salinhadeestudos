import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { file, sigla, nome, descricao, categoria } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const dl = await supabase.storage.from("lei-imports").download(file);
    if (dl.error) throw dl.error;
    const rows = JSON.parse(await dl.data.text()) as Array<{
      n: string; r: string; t: string; o: number;
      p: Array<{ tipo: string; rotulo: string; texto: string; ordem: number }>;
    }>;

    let { data: lei } = await supabase.from("vm_leis").select("id").eq("sigla", sigla).maybeSingle();
    if (!lei) {
      const { data: maxRow } = await supabase.from("vm_leis").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
      const ins = await supabase.from("vm_leis").insert({
        sigla, nome, descricao, categoria, ordem: (maxRow?.ordem ?? 0) + 1, publicada: true,
      }).select("id").single();
      if (ins.error) throw ins.error;
      lei = ins.data;
    }

    const { data: olds } = await supabase.from("vm_artigos").select("id").eq("lei_id", lei!.id);
    if (olds?.length) {
      const ids = olds.map((a) => a.id);
      await supabase.from("vm_paragrafos").delete().in("artigo_id", ids);
      await supabase.from("vm_artigos").delete().in("id", ids);
    }

    const artigos = rows.map((r) => ({ lei_id: lei!.id, numero: r.n, rotulo: r.r, texto: r.t, ordem: r.o }));
    const insArt = await supabase.from("vm_artigos").insert(artigos).select("id,ordem");
    if (insArt.error) throw insArt.error;

    const byOrdem = new Map(insArt.data.map((a: any) => [a.ordem, a.id]));
    const paragrafos = rows.flatMap((r) =>
      (r.p ?? []).map((p) => ({ artigo_id: byOrdem.get(r.o), ...p }))
    );
    if (paragrafos.length) {
      const insPar = await supabase.from("vm_paragrafos").insert(paragrafos);
      if (insPar.error) throw insPar.error;
    }

    return new Response(
      JSON.stringify({ ok: true, lei_id: lei!.id, artigos: artigos.length, paragrafos: paragrafos.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
