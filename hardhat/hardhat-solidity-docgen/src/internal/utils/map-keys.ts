export function mapKeys<T>(obj: Record<string, T>, fn: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}
