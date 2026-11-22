import type { LucideIcon } from 'lucide-react';

const EmptyState = ({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) => {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="mx-auto h-10 w-10 text-slate-400 mb-3" />}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
