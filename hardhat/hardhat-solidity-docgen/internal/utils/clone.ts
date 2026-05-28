/**
 * Deep cloning good enough for simple objects like solc output. Types are not
 * sound because the function may lose information: non-enumerable properties,
 * symbols, undefined values, prototypes, etc.
 */
export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
