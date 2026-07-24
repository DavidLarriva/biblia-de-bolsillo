export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-bg-elevated-2 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-elevated rounded-xl p-5 flex flex-col gap-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function SkeletonList({ count = 3, className = 'flex flex-col gap-3' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
