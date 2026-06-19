import fs from 'fs'
import path from 'path'
import { argv } from 'process'

interface Subitem {
  tipo: 'paragrafo' | 'paragrafo_unico' | 'inciso' | 'alinea'
  rotulo: string
  texto: string
}

interface ItemLei {
  tipo: 'titulo' | 'capitulo' | 'secao' | 'subsecao' | 'artigo'
  rotulo: string
  texto?: string
  subitens?: Subitem[]
}

interface Lei {
  sigla: string
  nome: string
  ano?: number
  descricao?: string
  categoria?: string
  itens: ItemLei[]
}

// Helpers to identify lines
function cleanLine(line: string): string {
  return line
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/^#+\s*/, '') // remove markdown headers like ##
    .replace(/[\u2000-\u200B\u3000]/g, '') // remove unicode spaces
    .trim()
}

function isSpecialLine(line: string): boolean {
  const cleaned = cleanLine(line)
  if (cleaned.match(/^PREÂMBULO/i)) return true
  if (cleaned.match(/^TÍTULO\s+[IVXLCDM]+/i)) return true
  if (cleaned.match(/^CAPÍTULO\s+[IVXLCDM]+/i)) return true
  if (cleaned.match(/^Seção\s+[IVXLCDM]+/i)) return true
  if (cleaned.match(/^Subseção\s+[IVXLCDM]+/i)) return true
  if (cleaned.match(/^Art\.\s*\d+/i)) return true
  if (cleaned.match(/^§/)) return true
  if (cleaned.match(/^Parágrafo\s+único/i)) return true
  if (cleaned.match(/^[IVXLCDM]+\s*-\s*/)) return true
  if (cleaned.match(/^[a-z]\)\s*/)) return true
  return false
}

function parseStructureLine(line: string): { rotulo: string, texto: string } {
  const colonIndex = line.indexOf(':')
  if (colonIndex !== -1) {
    const rotulo = line.substring(0, colonIndex).trim()
    const texto = line.substring(colonIndex + 1).trim()
    return { rotulo, texto }
  }
  return { rotulo: line, texto: '' }
}

function parseLawText(rawText: string, sigla: string, nome: string): Lei {
  const lines = rawText.split(/\r?\n/)
  const itens: ItemLei[] = []

  let i = 0
  while (i < lines.length) {
    let line = cleanLine(lines[i])
    if (!line) {
      i++
      continue
    }

    // 1. PREÂMBULO
    if (line.match(/^PREÂMBULO/i)) {
      let texto = ''
      let nextIdx = i + 1
      while (nextIdx < lines.length && !cleanLine(lines[nextIdx])) {
        nextIdx++
      }
      if (nextIdx < lines.length && !isSpecialLine(lines[nextIdx])) {
        texto = cleanLine(lines[nextIdx])
        i = nextIdx
      }
      itens.push({
        tipo: 'artigo',
        rotulo: 'PREÂMBULO',
        texto,
        subitens: []
      })
      i++
      continue
    }

    // 2. TÍTULO
    if (line.match(/^TÍTULO\s+[IVXLCDM]+/i)) {
      let { rotulo, texto } = parseStructureLine(line)
      if (!texto) {
        let nextIdx = i + 1
        while (nextIdx < lines.length && !cleanLine(lines[nextIdx])) {
          nextIdx++
        }
        if (nextIdx < lines.length && !isSpecialLine(lines[nextIdx])) {
          texto = cleanLine(lines[nextIdx])
          i = nextIdx
        }
      }
      itens.push({
        tipo: 'titulo',
        rotulo,
        texto
      })
      i++
      continue
    }

    // 3. CAPÍTULO
    if (line.match(/^CAPÍTULO\s+[IVXLCDM]+/i)) {
      let { rotulo, texto } = parseStructureLine(line)
      if (!texto) {
        let nextIdx = i + 1
        while (nextIdx < lines.length && !cleanLine(lines[nextIdx])) {
          nextIdx++
        }
        if (nextIdx < lines.length && !isSpecialLine(lines[nextIdx])) {
          texto = cleanLine(lines[nextIdx])
          i = nextIdx
        }
      }
      itens.push({
        tipo: 'capitulo',
        rotulo,
        texto
      })
      i++
      continue
    }

    // 4. SEÇÃO
    if (line.match(/^Seção\s+[IVXLCDM]+/i)) {
      let { rotulo, texto } = parseStructureLine(line)
      if (!texto) {
        let nextIdx = i + 1
        while (nextIdx < lines.length && !cleanLine(lines[nextIdx])) {
          nextIdx++
        }
        if (nextIdx < lines.length && !isSpecialLine(lines[nextIdx])) {
          texto = cleanLine(lines[nextIdx])
          i = nextIdx
        }
      }
      itens.push({
        tipo: 'secao',
        rotulo,
        texto
      })
      i++
      continue
    }

    // 5. SUBSEÇÃO
    if (line.match(/^Subseção\s+[IVXLCDM]+/i)) {
      let { rotulo, texto } = parseStructureLine(line)
      if (!texto) {
        let nextIdx = i + 1
        while (nextIdx < lines.length && !cleanLine(lines[nextIdx])) {
          nextIdx++
        }
        if (nextIdx < lines.length && !isSpecialLine(lines[nextIdx])) {
          texto = cleanLine(lines[nextIdx])
          i = nextIdx
        }
      }
      itens.push({
        tipo: 'subsecao',
        rotulo,
        texto
      })
      i++
      continue
    }

    // 6. ARTIGO (Art. XX)
    const artMatch = line.match(/^Art\.\s*(\d+(?:-[A-Z\d]+)?º?)\.?\s*(.*)$/i)
    if (artMatch) {
      const rotulo = `Art. ${artMatch[1]}`
      const texto = artMatch[2].trim()
      itens.push({
        tipo: 'artigo',
        rotulo,
        texto,
        subitens: []
      })
      i++
      continue
    }

    // Os próximos tipos dependem do artigo atual
    const lastItem = itens[itens.length - 1]
    const currentArtigo = lastItem && lastItem.tipo === 'artigo' ? lastItem : null

    if (currentArtigo) {
      // 7. PARÁGRAFO ÚNICO
      const singleParMatch = line.match(/^Parágrafo\s+único\.\s*(.*)$/i)
      if (singleParMatch) {
        currentArtigo.subitens = currentArtigo.subitens || []
        currentArtigo.subitens.push({
          tipo: 'paragrafo_unico',
          rotulo: 'Parágrafo único.',
          texto: singleParMatch[1].trim()
        })
        i++
        continue
      }

      // 8. PARÁGRAFO (§ XX)
      const parMatch = line.match(/^§\s*(\d+º?)\.?\s*(.*)$/i)
      if (parMatch) {
        currentArtigo.subitens = currentArtigo.subitens || []
        currentArtigo.subitens.push({
          tipo: 'paragrafo',
          rotulo: `§ ${parMatch[1]}`,
          texto: parMatch[2].trim()
        })
        i++
        continue
      }

      // 9. INCISO (I - XX)
      const incMatch = line.match(/^([IVXLCDM]+)\s*-\s*(.*)$/)
      if (incMatch) {
        currentArtigo.subitens = currentArtigo.subitens || []
        currentArtigo.subitens.push({
          tipo: 'inciso',
          rotulo: incMatch[1],
          texto: incMatch[2].trim()
        })
        i++
        continue
      }

      // 10. ALÍNEA (a) XX)
      const alMatch = line.match(/^([a-z])\)\s*(.*)$/)
      if (alMatch) {
        currentArtigo.subitens = currentArtigo.subitens || []
        currentArtigo.subitens.push({
          tipo: 'alinea',
          rotulo: `${alMatch[1]})`,
          texto: alMatch[2].trim()
        })
        i++
        continue
      }
    }

    // Se não se encaixou em nada mas temos um artigo ativo, pode ser continuação do texto
    if (currentArtigo) {
      console.log(`ℹ️ Linha tratada como texto adicional no caput do ${currentArtigo.rotulo}: "${line}"`)
      currentArtigo.texto = (currentArtigo.texto ? currentArtigo.texto + '\n' : '') + line
    } else {
      console.warn(`⚠️ Aviso: Linha ignorada/desconhecida fora de um artigo ativo (Linha ${i + 1}): "${line}"`)
    }
    
    i++
  }

  return {
    sigla,
    nome,
    itens
  }
}

function main() {
  const txtPath = argv[2]
  if (!txtPath) {
    console.error('❌ Erro: Informe o caminho do arquivo .txt. Ex: npx tsx scripts/parse-lei.ts scripts/leis/cf88.txt')
    process.exit(1)
  }

  const absoluteTxtPath = path.resolve(txtPath)
  if (!fs.existsSync(absoluteTxtPath)) {
    console.error(`❌ Erro: Arquivo não encontrado em: ${absoluteTxtPath}`)
    process.exit(1)
  }

  console.log(`📖 Lendo arquivo de texto: ${absoluteTxtPath}...`)
  const rawText = fs.readFileSync(absoluteTxtPath, 'utf8')

  // Obtém informações básicas a partir do nome do arquivo
  const fileBasename = path.basename(txtPath, '.txt')
  const sigla = fileBasename.toUpperCase().replace('-', '/') // ex: cf88 -> CF88, cf-88 -> CF/88
  
  let nome = 'Constituição Federal'
  if (sigla.includes('CF')) nome = 'Constituição Federal'
  else if (sigla.includes('CDC')) nome = 'Código de Defesa do Consumidor'
  else if (sigla.includes('CPC')) nome = 'Código de Processo Civil'
  else if (sigla.includes('CP')) nome = 'Código Penal'
  else if (sigla.includes('CLT')) nome = 'Consolidação das Leis do Trabalho'

  const parsedLei = parseLawText(rawText, sigla, nome)

  // Grava o arquivo TypeScript de saída
  const outPath = path.join(path.dirname(absoluteTxtPath), `${fileBasename}.ts`)
  console.log(`💾 Gravando arquivo TypeScript em: ${outPath}...`)

  const fileContent = `import { Lei } from '../importar-lei'

export const ${fileBasename.toUpperCase().replace(/[^A-Z0-9]/g, '_')}: Lei = ${JSON.stringify(parsedLei, null, 2)}
`

  fs.writeFileSync(outPath, fileContent, 'utf8')
  console.log(`🎉 Sucesso! Lei processada com ${parsedLei.itens.length} itens.`)
  console.log(`👉 Agora você pode importar rodando: npx tsx scripts/importar-lei.ts scripts/leis/${fileBasename}.ts`)
}

main()
