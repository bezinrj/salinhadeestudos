import fs from 'fs'

const filePath = 'C:\\Users\\bezin\\OneDrive\\Administrativo\\GitHub\\salinhadeestudos\\scripts\\leis\\cf88.txt'
const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split(/\r?\n/)

console.log('Total de linhas em cf88.txt:', lines.length)

console.log('--- Ocorrências de Art. 1º em cf88.txt ---')
lines.forEach((line, idx) => {
  if (line.includes('Art. 1º') || line.includes('Art. 1o')) {
    console.log(`Linha ${idx + 1}: ${line}`)
  }
})

console.log('--- Ocorrências de Art. 250 em cf88.txt ---')
lines.forEach((line, idx) => {
  if (line.includes('Art. 250')) {
    console.log(`Linha ${idx + 1}: ${line}`)
  }
})
