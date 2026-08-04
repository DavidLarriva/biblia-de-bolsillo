// El texto bíblico ya no se pide a una API externa: vive como archivos
// JSON estáticos en public/biblia/{version}/{usfm}/{capitulo}.json
// (generados una sola vez con scripts/generar-biblia.mjs), servidos desde
// el propio dominio de la app y cacheados por el service worker (PWA) para
// funcionar sin conexión.

export class BibleApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'BibleApiError'
    this.status = status
  }
}

export async function obtenerCapitulo(version, libroUsfm, capitulo) {
  let response
  try {
    response = await fetch(`/biblia/${version}/${libroUsfm}/${capitulo}.json`)
  } catch {
    throw new BibleApiError('No se pudo cargar el texto. Revisa tu conexión.', null)
  }

  if (!response.ok) {
    throw new BibleApiError('No encontramos ese pasaje.', response.status)
  }

  return response.json()
}

// Traduce un error al leer el texto bíblico a un mensaje breve para el
// usuario, distinguiendo un fallo de red (status null, ej. sin conexión y
// el capítulo aún no se guardó en el dispositivo) de un pasaje inexistente.
export function describeBibleError(error) {
  if (error instanceof BibleApiError) {
    if (error.status === null) {
      return 'No hay conexión y este capítulo todavía no se guardó en tu dispositivo.'
    }
    if (error.status === 404) {
      return error.message || 'No encontramos ese pasaje.'
    }
    return error.message || 'No se pudo obtener el texto ahora.'
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
