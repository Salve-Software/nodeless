/** Undoes whatever the call registered. Calling it twice is a no-op. */
export type Disposer = () => void;
