// Parser central del formato de versículos embebidos: [[Referencia | Texto | version]]
// Todo lo que necesita leer o mostrar un versículo embebido en un texto largo
// (editor, render público, extractos, metadatos) pasa por parsearSegmentos().

export const NOMBRE_VERSION = {
  rvr1960: 'RVR1960',
  ntv: 'NTV',
}

function normalizarVersion(valor) {
  const v = valor?.trim().toLowerCase()
  return v === 'ntv' || v === 'rvr1960' ? v : undefined
}

// Algunas traducciones devuelven versículos con su propia puntuación — una
// comilla de cierre suelta al inicio indica que la cita continúa de un
// versículo anterior. Como la app siempre envuelve el texto en «» al
// renderizar, dejar la que ya trae la API duplicaría el símbolo.
const COMILLAS = '«»"“”‘’'
const REGEX_COMILLAS_BORDE = new RegExp(`^[${COMILLAS}]+|[${COMILLAS}]+$`, 'g')

export function limpiarComillas(texto) {
  return texto.trim().replace(REGEX_COMILLAS_BORDE, '').trim()
}

function pareceHtml(texto) {
  return /<[a-z][\s\S]*>/i.test(texto)
}

function versionDesdeEtiqueta(citeTexto) {
  const etiqueta = citeTexto.split('—')[1]?.trim()
  const entrada = Object.entries(NOMBRE_VERSION).find(([, nombre]) => nombre === etiqueta)
  return entrada?.[0]
}

// El editor anterior guardaba HTML crudo de un contentEditable: una línea
// por <div>, y las citas insertadas como <blockquote class="verse-insert">.
// Esta conversión es de una sola pasada, al vuelo — el contenido en la base
// de datos no se migra, simplemente se traduce cada vez que se lee, así el
// editor y el render nuevos no necesitan saber que ese formato existió.
function convertirContenidoAntiguo(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const raiz = doc.body.firstChild
  const lineas = ['']

  function nuevaLinea() {
    if (lineas[lineas.length - 1] !== '') lineas.push('')
  }

  function recorrer(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      lineas[lineas.length - 1] += nodo.textContent
      return
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE) return

    if (nodo.matches?.('blockquote.verse-insert')) {
      const citeTexto = nodo.querySelector('cite')?.textContent ?? ''
      const referencia = citeTexto.split('—')[0].trim()
      const texto = limpiarComillas(nodo.querySelector('p')?.textContent ?? '')
      const version = versionDesdeEtiqueta(citeTexto)
      nuevaLinea()
      lineas[lineas.length - 1] = version
        ? `[[${referencia} | ${texto} | ${version}]]`
        : `[[${referencia} | ${texto}]]`
      lineas.push('')
      return
    }

    if (nodo.tagName === 'BR') {
      lineas.push('')
      return
    }

    const esBloque = nodo.tagName === 'DIV' || nodo.tagName === 'P'
    if (esBloque) nuevaLinea()

    Array.from(nodo.childNodes).forEach(recorrer)

    if (esBloque) lineas.push('')
  }

  recorrer(raiz)

  return lineas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
}

function normalizarContenido(texto) {
  if (!texto) return ''
  return pareceHtml(texto) ? convertirContenidoAntiguo(texto) : texto
}

// Formato antiguo usado en Oración antes de tener versículos embebidos:
// la cita se insertaba como prosa con comillas y la referencia entre
// paréntesis, ej. "Texto del versículo" (Juan 3:16). Se convierte al vuelo
// al formato [[Referencia | Texto]] para que se vea igual que el resto de
// la app, sin tener que migrar lo ya guardado.
const REGEX_CITA_ENTRE_COMILLAS = /"([^"\n]+)"\s*\(([^()\n]+)\)/g

export function convertirCitasEntreComillas(texto) {
  if (!texto) return ''
  return texto.replace(
    REGEX_CITA_ENTRE_COMILLAS,
    (_match, cita, referencia) => `[[${referencia.trim()} | ${cita.trim()}]]`
  )
}

function crearRegex() {
  return /\[\[\s*([^|\]]+?)\s*(?:\|\s*([^|\]]*)\s*(?:\|\s*([^\]]*)\s*)?)?\]\]/g
}

export function parsearSegmentos(textoOriginal) {
  const texto = normalizarContenido(textoOriginal)
  const segmentos = []
  const regex = crearRegex()
  let ultimoIndice = 0
  let match

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      segmentos.push({ tipo: 'texto', valor: texto.slice(ultimoIndice, match.index) })
    }
    segmentos.push({
      tipo: 'versiculo',
      referencia: match[1].trim(),
      texto: limpiarComillas(match[2] ?? ''),
      version: normalizarVersion(match[3]),
    })
    ultimoIndice = match.index + match[0].length
  }

  if (ultimoIndice < texto.length) {
    segmentos.push({ tipo: 'texto', valor: texto.slice(ultimoIndice) })
  }

  return segmentos
}

// Convierte el texto con tokens [[...]] en prosa limpia, para previews y
// metadatos donde no se renderiza el versículo como tarjeta aparte.
export function limpiarVersiculos(texto) {
  return parsearSegmentos(texto)
    .map((segmento) => (segmento.tipo === 'texto' ? segmento.valor : segmento.texto || segmento.referencia))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

// Recopila todos los versículos citados en uno o varios campos de texto,
// sin duplicados — para listar "versículos citados" en una entrada o nota.
export function extraerVersiculos(textos) {
  const lista = Array.isArray(textos) ? textos : [textos]
  const vistos = new Set()
  const resultado = []

  for (const texto of lista) {
    for (const segmento of parsearSegmentos(texto)) {
      if (segmento.tipo === 'versiculo') {
        const clave = `${segmento.version ?? ''}|${segmento.referencia}|${segmento.texto}`
        if (!vistos.has(clave)) {
          vistos.add(clave)
          resultado.push({
            referencia: segmento.referencia,
            texto: segmento.texto,
            version: segmento.version,
          })
        }
      }
    }
  }

  return resultado
}
