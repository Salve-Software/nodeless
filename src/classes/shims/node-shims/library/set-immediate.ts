export function setImmediate(callback: () => void): ReturnType<typeof setTimeout> {
  return setTimeout(callback, 0);
}
