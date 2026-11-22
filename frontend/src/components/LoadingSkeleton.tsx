const LoadingSkeleton = ({ lines = 4 }: { lines?: number }) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
