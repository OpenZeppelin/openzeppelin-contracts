const path = require('path');
const fs = require('fs');

module.exports = function* parse(file) {
  // cache the last mod seen
  let mod;

  const data = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  for (const { groups } of data.matchAll(/(SHAAlg = (?<alg>\w+)\r\n(?<blob>(.+\r\n)+))|(n = (?<mod>[a-f0-9]*))/g)) {
    if (groups.mod) {
      mod = groups.mod;
    } else {
      yield Object.assign(
        { alg: groups.alg, mod },
        Object.fromEntries(
          groups.blob
            .trimEnd()
            .split('\r\n')
            .map(line => line.match(/(?<key>\w+) = (?<value>[a-zA-Z0-9]+)/)?.groups)
            .filter(Boolean)
            .map(groups => [groups.key, groups.value]),
        ),
      );
    }
  }
};
