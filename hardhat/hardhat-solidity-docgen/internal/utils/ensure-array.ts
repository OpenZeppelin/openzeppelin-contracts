// The function below would not be correctly typed if the return type was T[]
// because T may itself be an array type and Array.isArray would not know the
// difference. Adding IfArray<T> makes sure the return type is always correct.
type IfArray<T> = T extends any[] ? T : never;

export function ensureArray<T>(x: T | T[]): T[] | IfArray<T> {
  if (Array.isArray(x)) {
    return x;
  } else {
    return [x];
  }
}
