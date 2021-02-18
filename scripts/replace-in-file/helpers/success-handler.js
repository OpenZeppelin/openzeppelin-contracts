'use strict';

/**
 * Success handler
 */
module.exports = function successHandler(results, verbose) {
  const changed = results.filter(result => result.hasChanged);
  const numChanges = changed.length;
  if (numChanges > 0) {
    console.log(`${numChanges} file(s) were changed`);
    if (verbose) {
      changed.forEach(result => console.log('-', result.file));
    }
  }
  else {
    console.log('No files were changed');
  }
};
