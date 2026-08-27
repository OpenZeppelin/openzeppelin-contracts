export function filterKeys<T>(obj: Record<string, T>, fn: (key: string) => boolean): Record<string, T> {
  const res: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (fn(k)) {
      res[k] = v;
    }
  }
  return res;
}
