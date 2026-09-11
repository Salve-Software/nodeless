import type { MemoryVfsOptions } from './types/index.js';
import type {
  Disposer,
  FileInput,
  FileStat,
  RmOptions,
  Vfs,
  VfsSnapshot,
  VfsWatchEvent,
  VfsWatchListener,
} from '@/types/index.js';
import { ROOT_PATH, SNAPSHOT_VERSION } from '@/constants/index.js';
import { FileNotFoundError, InvalidSnapshotError } from '@/errors/index.js';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToText,
  dirname,
  normalizePath,
  toBytes,
} from '@/library/index.js';
import { ancestorDirs, collectDirEntries } from './library/index.js';

/** In-memory filesystem. Sources and `node_modules` live in the same place. */
export class MemoryVfs implements Vfs {
  private readonly files = new Map<string, Uint8Array>();
  private readonly directories = new Set<string>([ROOT_PATH]);
  private readonly listeners = new Set<VfsWatchListener>();

  constructor({ files, snapshot }: MemoryVfsOptions = {}) {
    if (snapshot) this.restore(snapshot);
    if (files) this.writeAll(files);
  }

  readFile(path: string): Uint8Array {
    const bytes = this.tryReadFile(path);

    if (!bytes) {
      throw new FileNotFoundError(`No such file: ${normalizePath(path)}`, {
        path: normalizePath(path),
      });
    }

    return bytes;
  }

  readText(path: string): string {
    return bytesToText(this.readFile(path));
  }

  tryReadFile(path: string): Uint8Array | undefined {
    return this.files.get(normalizePath(path));
  }

  writeFile(path: string, content: string | Uint8Array): void {
    const normalized = normalizePath(path);

    this.mkdir(dirname(normalized));
    this.files.set(normalized, toBytes(content));
    this.emit({ path: normalized, type: 'write' });
  }

  exists(path: string): boolean {
    const normalized = normalizePath(path);

    return this.files.has(normalized) || this.directories.has(normalized);
  }

  stat(path: string): FileStat | undefined {
    const normalized = normalizePath(path);
    const bytes = this.files.get(normalized);

    if (bytes) return { path: normalized, type: 'file', size: bytes.length };
    if (this.directories.has(normalized)) {
      return { path: normalized, type: 'directory', size: 0 };
    }

    return undefined;
  }

  readdir(path: string): string[] {
    const normalized = normalizePath(path);

    if (!this.directories.has(normalized)) {
      throw new FileNotFoundError(`No such directory: ${normalized}`, {
        path: normalized,
      });
    }

    return collectDirEntries(normalized, [...this.files.keys(), ...this.directories]);
  }

  mkdir(path: string): void {
    for (const dir of ancestorDirs(path)) this.directories.add(dir);
  }

  rm(path: string, { recursive = false }: RmOptions = {}): void {
    const normalized = normalizePath(path);

    if (this.files.delete(normalized)) {
      this.emit({ path: normalized, type: 'remove' });
      return;
    }
    if (!recursive) return;

    const prefix = normalized === ROOT_PATH ? ROOT_PATH : `${normalized}/`;

    for (const file of [...this.files.keys()]) {
      if (!file.startsWith(prefix)) continue;
      this.files.delete(file);
      this.emit({ path: file, type: 'remove' });
    }
    for (const dir of [...this.directories]) {
      if (dir !== ROOT_PATH && (dir === normalized || dir.startsWith(prefix))) {
        this.directories.delete(dir);
      }
    }
  }

  paths(): string[] {
    return [...this.files.keys()].sort();
  }

  watch(listener: VfsWatchListener): Disposer {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  snapshot(): VfsSnapshot {
    const files: Record<string, string> = {};

    for (const [path, bytes] of this.files) files[path] = bytesToBase64(bytes);

    return {
      version: SNAPSHOT_VERSION,
      files,
      directories: [...this.directories].sort(),
    };
  }

  private restore(snapshot: VfsSnapshot): void {
    if (snapshot.version !== SNAPSHOT_VERSION) {
      throw new InvalidSnapshotError(
        `Unsupported snapshot version ${String(snapshot.version)}, expected ${String(SNAPSHOT_VERSION)}`,
        { version: snapshot.version },
      );
    }

    for (const dir of snapshot.directories) this.directories.add(normalizePath(dir));
    for (const [path, base64] of Object.entries(snapshot.files)) {
      this.writeFile(path, base64ToBytes(base64));
    }
  }

  private writeAll(files: FileInput): void {
    for (const [path, content] of Object.entries(files)) this.writeFile(path, content);
  }

  private emit(event: VfsWatchEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
