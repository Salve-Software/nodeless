import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app">
      <h1>nodeless</h1>
      <p>This bundle was produced without Node, without a shell and without a VM.</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        count: {count}
      </button>
    </main>
  );
}
