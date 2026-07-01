export function mapValues<T, U>(obj: Record<string, T>, fn: (value: T) => U): Record<string, U> {
  const res: Record<string, U> = {};
  for (const [k, v] of Object.entries(obj)) {
    res[k] = fn(v);
  }
  return res;
}

export function filterValues<T, U extends T>(obj: Record<string, T>, fn: (value: T) => value is U): Record<string, U>;
export function filterValues<T>(obj: Record<string, T>, fn: (value: T) => boolean): Record<string, T>;
export function filterValues<T>(obj: Record<string, T>, fn: (value: T) => boolean): Record<string, T> {
  const res: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (fn(v)) {
      res[k] = v;
    }
  }
  return res;
}
