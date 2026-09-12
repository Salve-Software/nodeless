/** `seen` is what keeps a plugin holding a reference to its own config from looping. */
export interface SerializeScope {
  register: (fn: (...args: unknown[]) => unknown) => number;
  seen: WeakSet<object>;
  depth: number;
}
