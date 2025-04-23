import { describe, it, expect, vi, beforeEach } from 'vitest';
import fsPromises from 'fs/promises';
import path from 'path';
import { getAllFilesMatching } from './fs-utils';

vi.mock('fs/promises', async () => {
  const fsMock = {
    readdir: vi.fn(),
    stat: vi.fn(),
  };
  return {
    default: fsMock,
  };
});

const mockFS = fsPromises as unknown as {
  readdir: ReturnType<typeof vi.fn>;
  stat: ReturnType<typeof vi.fn>;
};

describe('getAllFilesMatching', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty array when directory does not exist (ENOENT)', async () => {
    mockFS.readdir.mockRejectedValueOnce({ code: 'ENOENT' });

    const files = await getAllFilesMatching('/nonexistent');
    expect(files).toEqual([]);
  });

  it('throws when given path is not a directory (ENOTDIR)', async () => {
    mockFS.readdir.mockRejectedValueOnce({ code: 'ENOTDIR', message: 'Not a dir' });

    await expect(getAllFilesMatching('/some/file')).rejects.toThrowError('/some/file');
  });

  it('rethrows unknown errors from readdir', async () => {
    mockFS.readdir.mockRejectedValueOnce({ code: 'EACCES', message: 'Permission denied' });

    await expect(getAllFilesMatching('/restricted')).rejects.toThrow('Permission denied');
  });

  it('returns all matching files recursively', async () => {
    mockFS.readdir.mockImplementation(async (dir) => {
      if (dir === '/root') return ['file1.txt', 'subdir'];
      if (dir === '/root/subdir') return ['file2.txt'];
      return [];
    });

    mockFS.stat.mockImplementation(async (file) => {
      if (file.endsWith('subdir')) return { isDirectory: () => true };
      return { isDirectory: () => false };
    });

    const match = (f: string) => f.endsWith('.txt');
    const result = await getAllFilesMatching('/root', match);

    expect(result).toContain('/root/file1.txt');
    expect(result).toContain('/root/subdir/file2.txt');
  });

  it('returns all files when no match filter is passed', async () => {
    mockFS.readdir.mockResolvedValue(['file.js']);
    mockFS.stat.mockResolvedValue({ isDirectory: () => false });

    const result = await getAllFilesMatching('/js-only');
    expect(result).toEqual(['/js-only/file.js']);
  });

  it('skips non-matching files if match function is provided', async () => {
    mockFS.readdir.mockResolvedValue(['skipme.log']);
    mockFS.stat.mockResolvedValue({ isDirectory: () => false });

    const result = await getAllFilesMatching('/logs', (f) => f.endsWith('.txt'));
    expect(result).toEqual([]);
  });
});
