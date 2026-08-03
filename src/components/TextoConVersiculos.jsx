import { NOMBRE_VERSION, parsearSegmentos } from '../lib/versiculos'

export default function TextoConVersiculos({ texto, className }) {
  const segmentos = parsearSegmentos(texto ?? '')

  return (
    <div className={className}>
      {segmentos.map((segmento, i) =>
        segmento.tipo === 'texto' ? (
          <span key={i} className="whitespace-pre-line">
            {segmento.valor}
          </span>
        ) : (
          <blockquote key={i} className="block border-l-2 border-accent pl-3 my-2 not-italic">
            {segmento.texto && (
              <span className="block font-voice italic text-text-primary">«{segmento.texto}»</span>
            )}
            <cite className="block not-italic text-sm text-text-muted mt-0.5">
              {segmento.referencia}
              {segmento.version && <span> · {NOMBRE_VERSION[segmento.version] ?? segmento.version}</span>}
            </cite>
          </blockquote>
        )
      )}
    </div>
  )
}
