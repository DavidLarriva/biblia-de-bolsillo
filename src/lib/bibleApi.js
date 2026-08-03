const BASE_URL = import.meta.env.VITE_BIBLE_API_URL

export class BibleApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'BibleApiError'
    this.status = status
  }
}

async function request(path) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new BibleApiError('No se pudo conectar con el servidor', null)
  }

  if (!response.ok) {
    let message = 'Ocurrió un error inesperado'
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // el cuerpo no era JSON válido, se usa el mensaje por defecto
    }
    throw new BibleApiError(message, response.status)
  }

  return response.json()
}

export function obtenerCapitulo(version, libroUsfm, capitulo) {
  return request(`/api/${version}/${libroUsfm}/${capitulo}`)
}

// Traduce un error de la API de la Biblia a un mensaje breve para el usuario,
// distinguiendo fallos de red (status null) de respuestas 400/404 del servidor.
export function describeBibleError(error) {
  if (error instanceof BibleApiError) {
    if (error.status === null) {
      return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
    }
    if (error.status === 400) {
      return error.message || 'La búsqueda no es válida.'
    }
    if (error.status === 404) {
      return error.message || 'No encontramos ese pasaje.'
    }
    return error.message || 'No se pudo obtener el texto ahora.'
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
