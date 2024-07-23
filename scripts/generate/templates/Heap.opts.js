const makeType = (valueSize, indexSize) => ({
  struct: `Uint${valueSize}Heap`,
  node: `Uint${valueSize}HeapNode`,
  valueSize,
  valueType: `uint${valueSize}`,
  indexSize,
  indexType: `uint${indexSize}`,
  blockSize: Math.ceil((valueSize + 2 * indexSize) / 256),
});

module.exports = {
  TYPES: [makeType(256, 64), makeType(208, 24)],
};
