import { builtAt } from 'virtual:build-info';
import { title } from '~/title.js';

export function App() {
  return (
    <main>
      <h1>{title}</h1>
      <p>
        mode {__BUILD_MODE__}, built at {builtAt}
      </p>
    </main>
  );
}
