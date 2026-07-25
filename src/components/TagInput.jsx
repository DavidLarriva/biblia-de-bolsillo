import { useMemo, useState } from 'react'

export default function TagInput({ tags, onChange, suggestions = [] }) {
  const [tagInput, setTagInput] = useState('')

  const filteredSuggestions = useMemo(() => {
    const input = tagInput.trim().toLowerCase()
    if (!input) return []
    return suggestions.filter((tag) => tag.toLowerCase().includes(input) && !tags.includes(tag))
  }, [suggestions, tagInput, tags])

  function addTag(tag) {
    const clean = tag.trim()
    if (!clean || tags.includes(clean)) return
    onChange([...tags, clean])
    setTagInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(tagInput)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="text-xs rounded-full bg-bg-elevated-2 text-text-secondary px-2 py-1"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        value={tagInput}
        onChange={(event) => setTagInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe y presiona Enter"
        className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
      />
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-xs rounded-full border border-border-subtle text-text-secondary px-2 py-1 hover:text-text-primary"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
