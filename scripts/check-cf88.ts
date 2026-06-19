import { CF88 } from './leis/cf88'

const artigos = CF88.itens.filter(i => i.tipo === 'artigo')

const counts: Record<string, number> = {}
artigos.forEach(r => counts[r.rotulo] = (counts[r.rotulo] || 0) + 1)

const duplicados = Object.entries(counts).filter(([_, count]) => count > 1)

console.log('--- DETALHES DOS ARTIGOS DUPLICADOS ---')
duplicados.slice(0, 5).forEach(([rotulo, count]) => {
  console.log(`\nArtigo: "${rotulo}" aparece ${count} vezes:`)
  const ocorrencias = artigos.filter(a => a.rotulo === rotulo)
  ocorrencias.forEach((a, i) => {
    console.log(`  Ocorrência ${i + 1}:`)
    console.log(`    Texto caput: "${a.texto?.substring(0, 150)}..."`)
    if (a.subitens && a.subitens.length > 0) {
      console.log(`    Subitens: ${a.subitens.length} subitens`)
      console.log(`    Ex subitem: "${a.subitens[0].rotulo} - ${a.subitens[0].texto.substring(0, 50)}..."`)
    } else {
      console.log(`    Subitens: nenhum`)
    }
  })
})
