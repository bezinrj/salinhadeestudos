import { CF88 } from './leis/cf88'

const index250 = CF88.itens.findIndex(i => i.rotulo === 'Art. 250')
console.log('Índice do Art. 250:', index250)

if (index250 !== -1) {
  console.log('Artigo 250:', CF88.itens[index250])
  console.log('\nPróximos 5 itens após Art. 250:')
  console.log(CF88.itens.slice(index250 + 1, index250 + 6))
}
