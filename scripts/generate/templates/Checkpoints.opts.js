// OPTIONS
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
  opts: [224, 160].map(size => defaultOpts(size)),
  legacyOpts: {
    ...defaultOpts(224),
    historyTypeName: 'History',
    checkpointTypeName: 'Checkpoint',
    keyFieldName: '_blockNumber',
  },
};
