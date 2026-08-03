import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import VersiculoChip from '../components/VersiculoChip'
import { parsearSegmentos } from './versiculos'

// Nodo atómico: dentro del editor se ve y se comporta como una sola unidad
// (tarjeta con el versículo), nunca como texto editable carácter por
// carácter. Así nadie rompe el formato [[...]] escribiendo por encima.
export const VersiculoExtension = Node.create({
  name: 'versiculo',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      referencia: { default: '' },
      texto: { default: '' },
      version: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-versiculo]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-versiculo': '',
        'data-referencia': node.attrs.referencia,
        'data-version': node.attrs.version ?? '',
      }),
      node.attrs.referencia,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VersiculoChip)
  },
})

// Convierte el string plano guardado en la base de datos
// ([[Referencia | Texto | version]]) al documento que espera Tiptap, para
// inicializar el editor con contenido ya existente.
export function textoADoc(texto) {
  const segmentos = parsearSegmentos(texto ?? '')
  const parrafos = [[]]
  const parrafoActual = () => parrafos[parrafos.length - 1]

  for (const segmento of segmentos) {
    if (segmento.tipo === 'texto') {
      const lineas = segmento.valor.split('\n')
      lineas.forEach((linea, i) => {
        if (i > 0) parrafos.push([])
        if (linea) parrafoActual().push({ type: 'text', text: linea })
      })
    } else {
      parrafoActual().push({
        type: 'versiculo',
        attrs: {
          referencia: segmento.referencia,
          texto: segmento.texto,
          version: segmento.version ?? null,
        },
      })
    }
  }

  return {
    type: 'doc',
    content: parrafos.map((contenido) => ({
      type: 'paragraph',
      ...(contenido.length > 0 ? { content: contenido } : {}),
    })),
  }
}

// Convierte el documento de Tiptap de vuelta al string plano que se guarda,
// con el mismo formato [[Referencia | Texto | version]] de siempre.
export function docATexto(json) {
  const parrafos = json.content ?? []

  return parrafos
    .map((parrafo) =>
      (parrafo.content ?? [])
        .map((nodo) => {
          if (nodo.type === 'text') return nodo.text ?? ''
          if (nodo.type === 'versiculo') {
            const { referencia, texto, version } = nodo.attrs
            return version
              ? `[[${referencia} | ${texto} | ${version}]]`
              : `[[${referencia} | ${texto}]]`
          }
          return ''
        })
        .join('')
    )
    .join('\n')
}
