const iterate = require('../test/helpers/iterate');

module.exports = {
  // Capitalize the first char of a string
  // Example: capitalize('uint256') → 'Uint256'
  capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),

  // Iterate tools for the test helpers
  ...iterate,
};
