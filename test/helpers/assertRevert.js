module.exports = function(error) {
  assert.isAbove(error.message.search('revert'), -1, 'Error containing "revert" must be returned');
}
