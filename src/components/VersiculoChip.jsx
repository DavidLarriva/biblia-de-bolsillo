import { NodeViewWrapper } from '@tiptap/react'
import { NOMBRE_VERSION } from '../lib/versiculos'

export default function VersiculoChip({ node, deleteNode, selected }) {
  const { referencia, texto, version } = node.attrs

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      className={`inline-block align-middle my-1 max-w-full w-full rounded border px-3 py-2 select-none ${
        selected ? 'border-accent bg-accent/10' : 'border-border-subtle bg-bg-elevated-2/60'
      }`}
    >
      <span className="flex items-start gap-2">
        <span className="flex-1 min-w-0">
          <span className="block font-voice text-sm font-semibold text-accent">
            {referencia}
            {version && (
              <span className="text-text-muted font-normal"> · {NOMBRE_VERSION[version] ?? version}</span>
            )}
          </span>
          {texto && (
            <span className="block font-voice text-sm text-text-primary italic mt-0.5">«{texto}»</span>
          )}
        </span>
        <button
          type="button"
          onClick={deleteNode}
          aria-label="Quitar versículo"
          className="text-text-muted hover:text-accent leading-none px-1 shrink-0"
        >
          ×
        </button>
      </span>
    </NodeViewWrapper>
  )
}
