export * from '../test/helpers/iterate.js';
export * from '../test/helpers/strings.js';

// ============================================== Function helpers ==============================================

// Memoize a function, caching its results in a trie: one `Map` level per argument, the result under `leaf` at the end.
// Arguments are compared by identity (SameValueZero). Results are kept until `clear()` is called on the result.
export const memoize = fn => {
  const cache = new Map();
  const leaf = Symbol('leaf');
  return Object.assign(
    (...args) => {
      const node = args.reduce((node, arg) => node.get(arg) ?? node.set(arg, new Map()).get(arg), cache);
      if (!node.has(leaf)) {
        node.set(leaf, fn(...args));
      }
      return node.get(leaf);
    },
    { clear: () => cache.clear() },
  );
};
