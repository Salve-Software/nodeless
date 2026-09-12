import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-2xl font-semibold tracking-tight text-brand">nodeless</h1>
      <p className="panel bg-slate-900 px-5 py-3 text-sm text-slate-400">
        Tailwind v4 ran through the css transform.
      </p>
      <button
        type="button"
        className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 md:px-8"
        onClick={() => {
          setCount((value) => value + 1);
        }}
      >
        count: {count}
      </button>
    </main>
  );
}
