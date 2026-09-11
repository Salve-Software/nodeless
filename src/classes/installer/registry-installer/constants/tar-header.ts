/** Field offsets inside a 512-byte TAR header, per the ustar format. */
export const TAR_HEADER = {
  name: { offset: 0, length: 100 },
  size: { offset: 124, length: 12 },
  typeFlag: { offset: 156, length: 1 },
  prefix: { offset: 345, length: 155 },
} as const;
