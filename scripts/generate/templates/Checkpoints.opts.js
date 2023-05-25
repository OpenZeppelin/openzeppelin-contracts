// OPTIONS
const VALUE_SIZES = [224, 160];

const defaultOpts = size => ({
  historyTypeName: `Trace${size}`,
  checkpointTypeName: `Checkpoint${size}`,
  checkpointFieldName: '_checkpoints',
  keyTypeName: `uint${256 - size}`,
  keyFieldName: '_key',
  valueTypeName: `uint${size}`,
  valueFieldName: '_value',
});

module.exports = {
  OPTS: VALUE_SIZES.map(size => defaultOpts(size)),
  LEGACY_OPTS: {
    ...defaultOpts(224),
    historyTypeName: 'History',
    checkpointTypeName: 'Checkpoint',
    keyFieldName: '_blockNumber',
  },
};
