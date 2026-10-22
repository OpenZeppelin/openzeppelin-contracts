import path from 'path';

export function isChild(file: string, parent: string) {
  return path.normalize(file + path.sep).startsWith(path.normalize(parent + path.sep));
}
