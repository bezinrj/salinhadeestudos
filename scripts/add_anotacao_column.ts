import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAnotacaoColumn() {
  console.log('🔐 Autenticando...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.VITE_SUPABASE_USER_EMAIL || '',
    password: process.env.VITE_SUPABASE_USER_PASSWORD || '',
  })
  if (authError) {
    console.error('❌ Erro ao autenticar:', authError.message)
    return
  }
  console.log('✅ Autenticado com sucesso!')

  // Em projetos do Lovable, você pode não ter permissão para rodar ALTER TABLE
  // pelo client usando RPC ou query nativa sem um RPC customizado.
  // Mas vamos tentar rodar via SQL se o backend permitir,
  // ou criar uma migration manual para o usuário aplicar.
  console.log('\n⚠️ IMPORTANTE: O Supabase JS client não suporta rodar "ALTER TABLE" diretamente.')
  console.log('Por favor, copie o comando abaixo e rode no SQL Editor do seu projeto Supabase:')
  console.log('\n---------------------------------------------------------')
  console.log('ALTER TABLE public.vm_marcacoes ADD COLUMN IF NOT EXISTS anotacao TEXT DEFAULT \'\';')
  console.log('---------------------------------------------------------\n')
  console.log('Se você não tem acesso ao painel do Supabase porque é um projeto Lovable,')
  console.log('você precisará pedir para o Lovable aplicar essa migration ou verificar se ele o faz sozinho com o tempo.')
}

addAnotacaoColumn()
