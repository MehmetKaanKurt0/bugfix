export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="w-8 h-4 skeleton" />
      <div className="w-4 h-4" />
      <div className="w-9 h-9 rounded-lg skeleton" />
      <div className="flex-1">
        <div className="w-24 h-4 skeleton" />
      </div>
      <div className="w-16 h-6 skeleton" />
    </div>
  );
}

export function SkeletonPodium() {
  return (
    <div className="flex items-end justify-center gap-3 md:gap-5 mb-10 px-2">
      {[180, 220, 180].map((h, i) => (
        <div
          key={i}
          className="flex-1 max-w-[200px] skeleton"
          style={{ height: h, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return <div className="skeleton w-full" style={{ height, borderRadius: 12 }} />;
}
