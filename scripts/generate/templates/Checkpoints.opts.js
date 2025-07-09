// OPTIONS
const VALUE_SIZES = [256, 224, 208, 160];

const defaultOpts = size => ({
  historyTypeName: `Trace${size}`,
  checkpointTypeName: `Checkpoint${size}`,
  checkpointFieldName: '_checkpoints',
  checkpointSize: size < 256 ? 1 : 2,
  keyTypeName: size < 256 ? `uint${256 - size}` : 'uint256',
  keyFieldName: '_key',
  valueTypeName: `uint${size}`,
  valueFieldName: '_value',
});

module.exports = {
  VALUE_SIZES,
  OPTS: VALUE_SIZES.map(size => defaultOpts(size)),
};
