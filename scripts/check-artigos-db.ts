import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = process.env.VITE_SUPABASE_USER_EMAIL
  const password = process.env.VITE_SUPABASE_USER_PASSWORD

  if (!supabaseUrl || !supabaseKey || !email || !password) {
    console.error('Faltam variáveis de ambiente!')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  await supabase.auth.signInWithPassword({ email, password })

  const leiId = '11111111-0000-0000-0000-000000000003' // ID da CF/88

  console.log('--- BUSCANDO ARTIGOS DO SUPABASE ---')
  const { data: artigos, error } = await supabase
    .from('vm_artigos')
    .select('id, numero, rotulo, ordem, texto')
    .eq('lei_id', leiId)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao ler artigos:', error)
    return
  }

  console.log('Total de artigos no banco:', artigos?.length)

  // Verificar se há artigos com textos que não deveriam estar lá
  console.log('\n--- Primeiros 10 artigos salvos ---')
  artigos?.slice(0, 10).forEach(a => {
    console.log(`Ordem: ${a.ordem} | ID: ${a.id} | Chave: ${a.numero} | Rótulo: ${a.rotulo} | Caput: "${a.texto.substring(0, 80)}..."`)
  })

  console.log('\n--- Últimos 10 artigos salvos ---')
  artigos?.slice(-10).forEach(a => {
    console.log(`Ordem: ${a.ordem} | ID: ${a.id} | Chave: ${a.numero} | Rótulo: ${a.rotulo} | Caput: "${a.texto.substring(0, 80)}..."`)
  })

  // Verificar se existem duplicados no banco
  const counts: Record<string, number> = {}
  artigos?.forEach(a => {
    counts[a.rotulo] = (counts[a.rotulo] || 0) + 1
  })
  const duplicados = Object.entries(counts).filter(([_, count]) => count > 1)
  console.log('\nRótulos duplicados no banco:', duplicados)
}

main().catch(console.error)
