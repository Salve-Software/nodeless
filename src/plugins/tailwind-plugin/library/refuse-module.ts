/** `@plugin` and `@config` point at JavaScript that shapes the project's own CSS output. */
export function refuseModule(id: string): never {
  throw new Error(
    `Cannot load "${id}": the built-in Tailwind plugin does not run project code. Add @tailwindcss/vite to a vite config instead — that path goes through the runtime and can.`,
  );
}
