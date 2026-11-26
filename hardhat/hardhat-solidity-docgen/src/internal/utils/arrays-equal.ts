export function arraysEqual<T>(a: T[], b: T[]): boolean;
export function arraysEqual<T, U>(a: T[], b: T[], mapFn: (x: T) => U): boolean;
export function arraysEqual<T>(a: T[], b: T[], mapFn = (x: T) => x): boolean {
  return a.length === b.length && a.every((x, i) => mapFn(x) === mapFn(b[i]!));
}
