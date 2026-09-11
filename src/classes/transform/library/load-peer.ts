// One import per package per process, and only once a file is found to need it.
const pending = new Map<string, Promise<unknown>>();

/** Loads an optional peer by name, with a message saying what to install when it is absent. */
export async function loadPeer(name: string, reason: string): Promise<unknown> {
  const found =
    pending.get(name) ??
    import(name).catch(() => {
      pending.delete(name);

      throw new Error(
        `${reason} That needs the \`${name}\` package next to nodeless. Install it, or pass your own transform.`,
      );
    });

  pending.set(name, found);

  return found;
}
