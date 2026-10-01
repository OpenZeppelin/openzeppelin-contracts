import fs from 'node:fs';
import path from 'node:path';

// Keeps track of which root files produced which exposed files, so that exposed files whose root was removed, renamed
// or excluded (e.g. after switching branches) can be deleted instead of lingering in the output directory, where
// they would still be compiled. Paths are stored relative to the project root.
export class ExposedManifest {
  private constructor(
    private readonly rootDir: string,
    private readonly manifestPath: string,
    // exposed file -> root files that produced it
    private readonly owners: Map<string, Set<string>>,
  ) {}

  // Returns undefined if the manifest is missing or unreadable, in which case the output directory content is unknown.
  static load(rootDir: string, outDir: string): ExposedManifest | undefined {
    const manifestPath = path.join(outDir, 'manifest.json');
    try {
      const data: Record<string, string[]> = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return new ExposedManifest(rootDir, manifestPath, new Map(Object.entries(data).map(([f, o]) => [f, new Set(o)])));
    } catch {
      return undefined;
    }
  }

  static empty(rootDir: string, outDir: string): ExposedManifest {
    return new ExposedManifest(rootDir, path.join(outDir, 'manifest.json'), new Map());
  }

  // Whether an exposed file was deleted from the output directory, in which case it must be regenerated.
  hasMissingFiles(): boolean {
    return Array.from(this.owners.keys()).some(file => !fs.existsSync(this.absolute(file)));
  }

  // Replaces the exposed files attributed to `roots` (which were just regenerated) by `files`, a map from each
  // generated file to the roots that produced it.
  setGenerated(roots: Iterable<string>, files: Map<string, string[]>): void {
    const relRoots = Array.from(roots, r => this.relative(r));
    for (const owners of this.owners.values()) {
      relRoots.forEach(r => owners.delete(r));
    }
    for (const [file, fileOwners] of files) {
      const owners = this.owners.get(this.relative(file)) ?? new Set();
      fileOwners.forEach(r => owners.add(this.relative(r)));
      this.owners.set(this.relative(file), owners);
    }
  }

  // Deletes the exposed files that are not produced by any of the `roots` anymore, then saves the manifest.
  prune(roots: Iterable<string>): void {
    const relRoots = new Set(Array.from(roots, r => this.relative(r)));
    for (const [file, owners] of this.owners) {
      owners.forEach(owner => relRoots.has(owner) || owners.delete(owner));
      if (owners.size === 0) {
        this.owners.delete(file);
        this.remove(this.absolute(file));
      }
    }

    fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    fs.writeFileSync(
      this.manifestPath,
      JSON.stringify(Object.fromEntries(Array.from(this.owners, ([f, o]) => [f, Array.from(o).sort()])), null, 2),
    );
  }

  // Removes a file, and the directories that it leaves empty, up to the output directory.
  private remove(file: string): void {
    fs.rmSync(file, { force: true });
    const outDir = path.dirname(this.manifestPath);
    for (let dir = path.dirname(file); dir.startsWith(outDir + path.sep); dir = path.dirname(dir)) {
      if (!fs.existsSync(dir) || fs.readdirSync(dir).length > 0) break;
      fs.rmdirSync(dir);
    }
  }

  private relative(p: string): string {
    return path.relative(this.rootDir, p);
  }

  private absolute(p: string): string {
    return path.resolve(this.rootDir, p);
  }
}
