import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { format } from 'date-fns';
import { Rocket } from 'lucide-react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { create } from 'zustand';
import { z } from 'zod';

/** Every import above is a dependency the installer pulled from the registry. */
const useCounter = create<{ count: number; bump: () => void }>((set) => ({
  count: 0,
  bump: () => {
    set((state) => ({ count: state.count + 1 }));
  },
}));

const Schema = z.object({ label: z.string().min(1) });

function Home() {
  const { count, bump } = useCounter();
  const parsed = Schema.safeParse({ label: 'nodeless' });

  return (
    <main className={clsx('app', count > 0 && 'app--touched')}>
      <h1>
        <Rocket size={20} /> {parsed.success ? parsed.data.label : 'invalid'}
      </h1>
      <p>{format(new Date(0), 'yyyy-MM-dd')}</p>
      <Dialog.Root>
        <Dialog.Trigger onClick={bump}>open ({count})</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>installed without npm</Dialog.Title>
            <Dialog.Close>close</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

const router = createMemoryRouter([{ path: '/', element: <Home /> }]);

export function App() {
  return <RouterProvider router={router} />;
}
