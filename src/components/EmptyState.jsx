export default function EmptyState({ title, children }) {
  return (
    <div className="bg-bg-elevated rounded-xl p-8 text-center flex flex-col gap-2 items-center">
      <p className="font-voice text-lg text-text-primary">{title}</p>
      {children && <p className="text-sm text-text-secondary max-w-sm">{children}</p>}
    </div>
  )
}
