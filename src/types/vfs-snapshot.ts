/** VFS state as plain JSON, to travel between front end and API. Bytes are base64. */
export interface VfsSnapshot {
  version: number;
  files: Record<string, string>;
  directories: string[];
}
