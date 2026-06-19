import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { argv } from 'process'
import readline from 'readline'
import { pathToFileURL } from 'url'

// Interfaces do Sistema
export interface Subitem {
  tipo: 'paragrafo' | 'paragrafo_unico' | 'inciso' | 'alinea'
  rotulo: string
  texto: string
}

export interface ItemLei {
  tipo: 'titulo' | 'capitulo' | 'secao' | 'subsecao' | 'artigo'
  rotulo: string
  texto?: string
  subitens?: Subitem[]
}

export interface Lei {
  sigla: string
  nome: string
  ano?: number
  descricao?: string
  categoria?: string
  itens: ItemLei[]
}

// Funções Auxiliares de Formatação
function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_') // substitui caracteres especiais por _
    .replace(/_+/g, '_') // remove múltiplos underscores
    .replace(/^_+|_+$/g, '') // apara underscores no início e fim
}

function getArtigoNumero(rotulo: string): string {
  let num = rotulo.trim()
  if (num.toLowerCase().startsWith('art.')) {
    num = num.substring(4).trim()
  }
  num = num.replace(/º/g, '').trim()
  return num
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '') // mantém números, letras e hífens (ex: 29-A)
}

// Função para obter credenciais pelo console se necessário
function promptQuestion(query: string, hideInput = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    if (hideInput) {
      // Truque simples para mascarar a senha no terminal
      const stdin = process.stdin as any
      const stdout = process.stdout as any
      
      stdout.write(query)
      stdin.resume()
      stdin.setRawMode(true)
      
      let password = ''
      
      const onData = (char: string) => {
        char = char + ''
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.setRawMode(false)
            stdin.removeListener('data', onData)
            stdout.write('\n')
            rl.close()
            resolve(password)
            break
          case '\u0003': // Ctrl+C
            stdin.setRawMode(false)
            process.exit(1)
            break
          default:
            // Backspace
            if (char.charCodeAt(0) === 127) {
              if (password.length > 0) {
                password = password.slice(0, -1)
                stdout.write('\b \b')
              }
            } else {
              password += char
              stdout.write('*')
            }
            break
        }
      }
      
      stdin.on('data', onData)
    } else {
      rl.question(query, (answer) => {
        rl.close()
        resolve(answer)
      })
    }
  })
}

async function main() {
  const filePath = argv[2]
  if (!filePath) {
    console.error('❌ Erro: Informe o caminho do arquivo da lei. Ex: npx tsx scripts/importar-lei.ts scripts/leis/cf88.ts')
    process.exit(1)
  }

  // 1. Carrega o arquivo da lei de forma dinâmica
  const absolutePath = path.resolve(filePath)
  console.log(`📖 Carregando dados da lei de: ${absolutePath}...`)
  
  let leiData: Lei
  try {
    const fileUrl = pathToFileURL(absolutePath).href
    const importedModule = await import(fileUrl)
    leiData = importedModule.default || Object.values(importedModule)[0]
    
    if (!leiData || !leiData.sigla || !leiData.nome || !Array.isArray(leiData.itens)) {
      throw new Error('O arquivo exportado não segue o formato correto de interface Lei.')
    }
  } catch (err: any) {
    console.error('❌ Erro ao carregar arquivo de dados:', err.message)
    process.exit(1)
  }

  console.log(`✅ Lei carregada: "${leiData.nome}" (${leiData.sigla}) com ${leiData.itens.length} itens estruturais/artigos.`)

  // 2. Configura Supabase e credenciais
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não definidos em .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let email = process.env.VITE_SUPABASE_USER_EMAIL
  let password = process.env.VITE_SUPABASE_USER_PASSWORD

  if (!email || !password) {
    console.log('\n🔐 Credenciais do Supabase não encontradas no ambiente.')
    console.log('Por favor, informe suas credenciais para autenticar e gravar os dados:')
    email = await promptQuestion('Email: ')
    password = await promptQuestion('Senha (oculta): ', true)
  }

  console.log('\n🔐 Autenticando com o Supabase...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('❌ Erro ao autenticar no Supabase:', authError.message)
    process.exit(1)
  }
  console.log('✅ Autenticado com sucesso!')

  // 3. Verifica ou cria a Lei na tabela `vm_leis`
  console.log(`\n🔍 Verificando se a lei "${leiData.sigla}" já existe no banco...`)
  const { data: leisExistentes, error: queryError } = await supabase
    .from('vm_leis')
    .select('*')
    .eq('sigla', leiData.sigla)

  if (queryError) {
    console.error('❌ Erro ao buscar lei:', queryError.message)
    process.exit(1)
  }

  let leiId = ''
  if (leisExistentes && leisExistentes.length > 0) {
    leiId = leisExistentes[0].id
    console.log(`✅ Lei encontrada. ID: ${leiId}`)
  } else {
    console.log(`ℹ️ Lei não encontrada. Criando novo registro...`)
    const { data: novaLei, error: insertError } = await supabase
      .from('vm_leis')
      .insert({
        nome: leiData.nome,
        sigla: leiData.sigla,
        descricao: leiData.descricao || `${leiData.nome} de ${leiData.ano || ''}`,
        categoria: leiData.categoria || 'Lei',
        ordem: 1,
        publicada: true,
      })
      .select('id')
      .single()

    if (insertError || !novaLei) {
      console.error('❌ Erro ao criar registro da lei:', insertError?.message)
      process.exit(1)
    }
    leiId = novaLei.id
    console.log(`✅ Lei criada com sucesso! ID: ${leiId}`)
  }

  // 4. Limpa todos os artigos existentes dessa lei (evitando duplicações ou inconsistências)
  console.log(`\n🗑️ Removendo artigos e parágrafos antigos da lei (ID: ${leiId})...`)
  const { data: artigosExistentes, error: fetchErr } = await supabase
    .from('vm_artigos')
    .select('id')
    .eq('lei_id', leiId)

  if (fetchErr) {
    console.error('❌ Erro ao buscar artigos existentes:', fetchErr.message)
    process.exit(1)
  }

  if (artigosExistentes && artigosExistentes.length > 0) {
    const ids = artigosExistentes.map(a => a.id)
    
    // Deleta os parágrafos vinculados de forma explícita
    const { error: delParError } = await supabase
      .from('vm_paragrafos')
      .delete()
      .in('artigo_id', ids)

    if (delParError) {
      console.warn('⚠️ Nota: erro ao deletar parágrafos vinculados (pode ser deletado em cascata):', delParError.message)
    }

    // Deleta os artigos
    const { error: delArtError } = await supabase
      .from('vm_artigos')
      .delete()
      .in('id', ids)

    if (delArtError) {
      console.error('❌ Erro ao deletar artigos existentes:', delArtError.message)
      process.exit(1)
    }
    console.log(`✅ ${ids.length} artigos antigos removidos.`)
  } else {
    console.log('ℹ️ Nenhum artigo antigo encontrado. Iniciando banco limpo.')
  }

  // 5. Gera as chaves (`numero`) e a `ordem` sequencial, e insere os dados de forma hierárquica
  console.log('\n📥 Processando e inserindo novos itens...')

  let currentTitulo = ''
  let currentCapitulo = ''
  let currentSecao = ''
  let currentSubsecao = ''
  
  let ordemArtigo = 1
  let totalArtigosInseridos = 0
  let totalParagrafosInseridos = 0

  for (const item of leiData.itens) {
    // 5.1 Atualiza contextos e gera chave única (`numero`)
    let numeroKey = ''
    if (item.tipo === 'titulo') {
      currentTitulo = normalizeKey(item.rotulo)
      currentCapitulo = ''
      currentSecao = ''
      currentSubsecao = ''
      numeroKey = currentTitulo
    } else if (item.tipo === 'capitulo') {
      currentCapitulo = normalizeKey(item.rotulo)
      currentSecao = ''
      currentSubsecao = ''
      numeroKey = [currentTitulo, currentCapitulo].filter(Boolean).join('_')
    } else if (item.tipo === 'secao') {
      currentSecao = normalizeKey(item.rotulo)
      currentSubsecao = ''
      numeroKey = [currentTitulo, currentCapitulo, currentSecao].filter(Boolean).join('_')
    } else if (item.tipo === 'subsecao') {
      currentSubsecao = normalizeKey(item.rotulo)
      numeroKey = [currentTitulo, currentCapitulo, currentSecao, currentSubsecao].filter(Boolean).join('_')
    } else if (item.tipo === 'artigo') {
      numeroKey = getArtigoNumero(item.rotulo)
    }

    // Validação básica do Caput de artigos
    if (item.tipo === 'artigo' && !item.texto?.trim()) {
      console.warn(`⚠️ Aviso: O artigo "${item.rotulo}" está sem texto do Caput.`)
    }

    // 5.2 Insere o item na tabela `vm_artigos`
    const { data: artInserido, error: artError } = await supabase
      .from('vm_artigos')
      .insert({
        lei_id: leiId,
        numero: numeroKey,
        rotulo: item.rotulo,
        texto: item.texto || '',
        ordem: ordemArtigo++,
      })
      .select('id')
      .single()

    if (artError || !artInserido) {
      console.error(`❌ Erro ao inserir item "${item.rotulo}" (tipo: ${item.tipo}):`, artError?.message)
      continue
    }
    totalArtigosInseridos++

    // 5.3 Insere subitens (parágrafos, incisos, alíneas) na tabela `vm_paragrafos`
    if (item.subitens && item.subitens.length > 0) {
      let ordemParagrafo = 1
      const payloadParagrafos = item.subitens.map(sub => ({
        artigo_id: artInserido.id,
        tipo: sub.tipo,
        rotulo: sub.rotulo,
        texto: sub.texto,
        ordem: ordemParagrafo++,
      }))

      const { error: pError } = await supabase
        .from('vm_paragrafos')
        .insert(payloadParagrafos)

      if (pError) {
        console.error(`❌ Erro ao inserir subitens do artigo "${item.rotulo}":`, pError.message)
      } else {
        totalParagrafosInseridos += payloadParagrafos.length
      }
    }

    console.log(`➡️ Processado: ${item.rotulo} (Chave: ${numeroKey}) - ${item.subitens?.length || 0} subitens`)
  }

  console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!')
  console.log(`📊 Relatório final:`)
  console.log(`- Artigos/Estruturas inseridos: ${totalArtigosInseridos}`)
  console.log(`- Parágrafos/Incisos/Alíneas inseridos: ${totalParagrafosInseridos}`)
}

main().catch((err) => {
  console.error('❌ Erro inesperado na execução:', err)
})
