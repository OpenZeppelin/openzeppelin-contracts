const path = require('path');
const fs = require('fs');

module.exports = function* parse(file) {
  const cache = {};
  const data = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  for (const line of data.split('\r\n')) {
    const groups = line.match(/^(?<key>\w+) = (?<value>\w+)(?<extra>.*)$/)?.groups;
    if (groups) {
      const { key, value, extra } = groups;
      cache[key] = value;
      if (groups.key === 'Result') {
        yield Object.assign({ extra: extra.trim() }, cache);
      }
    }
  }
};
