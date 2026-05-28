export function defineGetterMemoized<K extends keyof any, T, O extends { [k in K]?: T }>(
  obj: O,
  key: K,
  getter: () => T,
) {
  let state: 'todo' | 'doing' | 'done' = 'todo';
  let value: T;

  Object.defineProperty(obj, key, {
    enumerable: true,
    get() {
      switch (state) {
        case 'done':
          return value;

        case 'doing':
          throw new Error('Detected recursion');

        case 'todo':
          state = 'doing';
          value = getter();
          state = 'done';
          return value;
      }
    },
  });
}
