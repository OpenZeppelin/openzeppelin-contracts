export type AssertEqual<T, U> = [T, U] extends [U, T] ? true : never;
