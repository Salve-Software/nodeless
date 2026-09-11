export interface FileStat {
  path: string;
  type: 'file' | 'directory';
  size: number;
}
