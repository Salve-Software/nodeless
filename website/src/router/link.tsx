import type { ReactNode } from 'react';
import type { Route } from './use-route';

/** An anchor that keeps the URL real, so the link can still be copied or opened in a tab. */
export function Link({
  to,
  go,
  className,
  children,
}: {
  to: Route;
  go: (to: Route) => void;
  className?: string;
  children: ReactNode;
}) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <a
      href={`${base}${to}`}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}
