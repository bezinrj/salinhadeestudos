import { CF88 } from './leis/cf88'

const artigos = CF88.itens.filter(i => i.tipo === 'artigo')

console.log('Total de artigos:', artigos.length)

// Agrupar por texto do caput (para ver se há textos exatamente iguais)
const textos = new Map<string, any[]>()
artigos.forEach(a => {
  const txt = a.texto?.trim() || ''
  if (txt.length > 10) {
    if (!textos.has(txt)) textos.set(txt, [])
    textos.get(txt)!.push(a)
  }
})

console.log('--- ARTIGOS COM TEXTOS DE CAPUT IDÊNTICOS ---')
let hasDupText = false
for (const [txt, list] of textos.entries()) {
  if (list.length > 1) {
    hasDupText = true
    console.log(`\nTexto repetido ${list.length} vezes: "${txt.substring(0, 100)}..."`)
    list.forEach(a => {
      console.log(`  - Rótulo: ${a.rotulo}`)
    })
  }
}
if (!hasDupText) {
  console.log('Nenhum artigo tem texto de caput idêntico.')
}

// Listar artigos que aparecem 3 ou mais vezes
const counts: Record<string, number> = {}
artigos.forEach(r => counts[r.rotulo] = (counts[r.rotulo] || 0) + 1)
const triplicados = Object.entries(counts).filter(([_, count]) => count > 2)
console.log('\nArtigos que aparecem 3 ou mais vezes:', triplicados)
