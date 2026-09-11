import { beforeAll, describe, expect, it, vi } from 'vitest';
import { InstallerNotConfiguredError } from '@/errors/index.js';
import { bytesToText } from '@/library/index.js';
import { NodelessProject } from '@/nodeless-project.class.js';
import { readProjectFiles } from '@example/read-project-files.js';

// The example is the fixture: if `example/app` stops building, this suite breaks.
const files = readProjectFiles();

describe('NodelessProject', () => {
  describe('building the React scaffold', () => {
    let project: NodelessProject;

    beforeAll(() => {
      project = new NodelessProject({ files });
    });

    it('produces index.html, bundle.js and bundle.css', async () => {
      const result = await project.build();

      expect(result.ok).toBe(true);
      expect(Object.keys(result.ok ? result.files : {}).sort()).toEqual([
        'bundle.css',
        'bundle.js',
        'index.html',
      ]);
    });

    it('bundles React straight out of the node_modules inside the VFS', async () => {
      const result = await project.build();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(bytesToText(result.files['bundle.js'] ?? new Uint8Array())).toContain(
        'createRoot',
      );
    });

    it('rewrites the scaffold HTML to point at the bundle', async () => {
      const result = await project.build();

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const html = bytesToText(result.files['index.html'] ?? new Uint8Array());

      expect(html).toContain('<div id="root"></div>');
      expect(html).toContain('./bundle.js');
      expect(html).not.toContain('/src/main.tsx');
    });

    it('does not write to the VFS — otherwise watch would fire itself', async () => {
      const before = project.vfs.paths().length;

      await project.build();

      expect(project.vfs.paths()).toHaveLength(before);
    });
  });

  // Acceptance criterion: the same state crosses front end and API and builds identically.
  it('a snapshot recreates a project that builds the same bundle', async () => {
    const origin = new NodelessProject({ files });
    const clone = new NodelessProject({ snapshot: origin.snapshot() });
    const [first, second] = await Promise.all([origin.build(), clone.build()]);

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.files['bundle.js']).toEqual(first.files['bundle.js']);
  });

  it('editing a file changes the next build', async () => {
    const project = new NodelessProject({ files });

    await project.build();
    project.vfs.writeFile('/src/App.tsx', "export const App = () => 'unique-marker';");

    const result = await project.build();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bytesToText(result.files['bundle.js'] ?? new Uint8Array())).toContain(
      'unique-marker',
    );
  });

  it('a dependency installed later is picked up without recreating the project', async () => {
    const project = new NodelessProject({
      files: { '/src/main.ts': "export { value } from 'late';" },
    });

    expect((await project.build()).ok).toBe(false);

    project.vfs.writeFile(
      '/node_modules/late/package.json',
      JSON.stringify({ name: 'late', main: 'index.js' }),
    );
    project.vfs.writeFile('/node_modules/late/index.js', 'export const value = 42;');

    expect((await project.build()).ok).toBe(true);
  });

  describe('install', () => {
    it('with no installer configured it says what to do', async () => {
      await expect(new NodelessProject().install()).rejects.toThrow(
        InstallerNotConfiguredError,
      );
    });

    it('delegates to the injected installer', async () => {
      const result = {
        installed: { react: '19.0.0' },
        warnings: [],
        lockfile: { lockfileVersion: 1, packages: {} },
      };
      const installer = { install: vi.fn().mockResolvedValue(result) };

      await expect(new NodelessProject({ installer }).install()).resolves.toBe(result);
    });
  });

  describe('watch', () => {
    it('collapses a burst of writes into a single notification', () => {
      vi.useFakeTimers();
      const project = new NodelessProject();
      const listener = vi.fn();

      project.watch(listener, { debounceMs: 50 });
      project.vfs.writeFile('/a.ts', 'x');
      project.vfs.writeFile('/b.ts', 'y');
      vi.advanceTimersByTime(49);

      expect(listener).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ path: '/b.ts', type: 'write' });
      vi.useRealTimers();
    });

    it('the disposer stops the notifications', () => {
      vi.useFakeTimers();
      const project = new NodelessProject();
      const listener = vi.fn();
      const stop = project.watch(listener, { debounceMs: 1 });

      stop();
      project.vfs.writeFile('/a.ts', 'x');
      vi.advanceTimersByTime(10);

      expect(listener).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  it('createProject with no argument gives a usable empty project', () => {
    const project = new NodelessProject();

    expect(project.vfs.paths()).toEqual([]);
    expect(project.snapshot().version).toBe(1);
  });
});
