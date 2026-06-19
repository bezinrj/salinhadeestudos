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

  console.log('--- LEIS ---')
  const { data: leis, error: leisError } = await supabase.from('vm_leis').select('*')
  if (leisError) {
    console.error('Erro ao ler leis:', leisError)
    return
  }
  console.log(leis)

  for (const lei of leis || []) {
    const { count, error: countError } = await supabase
      .from('vm_artigos')
      .select('*', { count: 'exact', head: true })
      .eq('lei_id', lei.id)

    if (countError) {
      console.error(`Erro ao contar artigos da lei ${lei.sigla}:`, countError)
    } else {
      console.log(`Lei ${lei.sigla} (${lei.nome}): ${count} artigos`)
    }
  }
}

main().catch(console.error)
