// Script de una sola vez: convierte los dumps completos de RVR1960 y NTV
// (formato tipo YouVersion, un archivo gigante por versión) en archivos
// JSON estáticos por capítulo, con la misma forma que ya devolvía la API
// externa ({ libro, capitulo, versiculos: [{ versiculo, texto }] }).
//
// Uso: node scripts/generar-biblia.mjs <ruta-RVR1960.json> <ruta-NTV.json>
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'biblia')

// Misma lista de 66 libros que ya vive en Supabase (supabase/schema.sql) —
// se usa como fuente de verdad para el nombre canónico en español, para no
// heredar inconsistencias del dump original (ej. "S. Mateo" en vez de "Mateo").
const LIBROS = [
  ['gen', 'Génesis'], ['exo', 'Éxodo'], ['lev', 'Levítico'], ['num', 'Números'],
  ['deu', 'Deuteronomio'], ['jos', 'Josué'], ['jdg', 'Jueces'], ['rut', 'Rut'],
  ['1sa', '1 Samuel'], ['2sa', '2 Samuel'], ['1ki', '1 Reyes'], ['2ki', '2 Reyes'],
  ['1ch', '1 Crónicas'], ['2ch', '2 Crónicas'], ['ezr', 'Esdras'], ['neh', 'Nehemías'],
  ['est', 'Ester'], ['job', 'Job'], ['psa', 'Salmos'], ['pro', 'Proverbios'],
  ['ecc', 'Eclesiastés'], ['sng', 'Cantares'], ['isa', 'Isaías'], ['jer', 'Jeremías'],
  ['lam', 'Lamentaciones'], ['ezk', 'Ezequiel'], ['dan', 'Daniel'], ['hos', 'Oseas'],
  ['jol', 'Joel'], ['amo', 'Amós'], ['oba', 'Abdías'], ['jon', 'Jonás'],
  ['mic', 'Miqueas'], ['nam', 'Nahúm'], ['hab', 'Habacuc'], ['zep', 'Sofonías'],
  ['hag', 'Hageo'], ['zec', 'Zacarías'], ['mal', 'Malaquías'], ['mat', 'Mateo'],
  ['mrk', 'Marcos'], ['luk', 'Lucas'], ['jhn', 'Juan'], ['act', 'Hechos'],
  ['rom', 'Romanos'], ['1co', '1 Corintios'], ['2co', '2 Corintios'], ['gal', 'Gálatas'],
  ['eph', 'Efesios'], ['php', 'Filipenses'], ['col', 'Colosenses'],
  ['1th', '1 Tesalonicenses'], ['2th', '2 Tesalonicenses'], ['1ti', '1 Timoteo'],
  ['2ti', '2 Timoteo'], ['tit', 'Tito'], ['phm', 'Filemón'], ['heb', 'Hebreos'],
  ['jas', 'Santiago'], ['1pe', '1 Pedro'], ['2pe', '2 Pedro'], ['1jn', '1 Juan'],
  ['2jn', '2 Juan'], ['3jn', '3 Juan'], ['jud', 'Judas'], ['rev', 'Apocalipsis'],
]
const NOMBRE_POR_USFM = new Map(LIBROS)

function extraerCapitulo(chapterUsfm) {
  const partes = chapterUsfm.split('.')
  return Number(partes[partes.length - 1])
}

function procesarVersion(rutaArchivo, claveVersion) {
  console.log(`Leyendo ${rutaArchivo}…`)
  const dump = JSON.parse(readFileSync(rutaArchivo, 'utf-8'))
  let archivosEscritos = 0
  let versiculosTotales = 0

  for (const libro of dump.books) {
    const usfm = libro.book_usfm.toLowerCase()
    const nombre = NOMBRE_POR_USFM.get(usfm)
    if (!nombre) {
      console.warn(`  ! libro desconocido, se omite: ${libro.book_usfm}`)
      continue
    }

    for (const capitulo of libro.chapters) {
      if (!capitulo.is_chapter) continue
      const numeroCapitulo = extraerCapitulo(capitulo.chapter_usfm)

      const versiculos = []
      for (const item of capitulo.items) {
        if (item.type !== 'verse') continue
        const texto = item.lines.join(' ').replace(/\s+/g, ' ').trim()
        // Combinaciones tipo "20-21" (NTV): se repite el mismo texto para
        // cada número, así cualquiera de los dos versículos es buscable.
        for (const numero of item.verse_numbers) {
          versiculos.push({ versiculo: numero, texto })
        }
      }
      versiculos.sort((a, b) => a.versiculo - b.versiculo)

      const destino = join(OUT_DIR, claveVersion, usfm)
      mkdirSync(destino, { recursive: true })
      writeFileSync(
        join(destino, `${numeroCapitulo}.json`),
        JSON.stringify({ libro: nombre, capitulo: numeroCapitulo, versiculos })
      )
      archivosEscritos += 1
      versiculosTotales += versiculos.length
    }
  }

  console.log(`  -> ${archivosEscritos} capítulos, ${versiculosTotales} versículos escritos en public/biblia/${claveVersion}/`)
}

const [rutaRvr, rutaNtv] = process.argv.slice(2)
if (!rutaRvr || !rutaNtv) {
  console.error('Uso: node scripts/generar-biblia.mjs <ruta-RVR1960.json> <ruta-NTV.json>')
  process.exit(1)
}

procesarVersion(rutaRvr, 'rvr1960')
procesarVersion(rutaNtv, 'ntv')
console.log('Listo.')
