import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
export function Field({label,children,htmlFor}: {label:string;children:ReactNode;htmlFor:string}) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
export function FieldSelect({className,...props}:SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring',className)} {...props}/>;
}
