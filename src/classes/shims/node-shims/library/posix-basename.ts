export function posixBasename(path: string, suffix?: string): string {
  const trimmed = path.endsWith('/') ? path.replace(/\/+$/, '') : path;
  const name = trimmed.slice(trimmed.lastIndexOf('/') + 1);

  if (suffix === undefined || suffix === name || !name.endsWith(suffix)) return name;

  return name.slice(0, -suffix.length);
}
