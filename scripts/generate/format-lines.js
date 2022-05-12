function formatLines (...lines) {
  return [...indentEach(0, lines)].join('\n') + '\n';
}

function *indentEach (indent, lines) {
  for (const line of lines) {
    if (line === '') {
      yield '';
    } else if (Array.isArray(line)) {
      yield * indentEach(indent + 1, line);
    } else {
      yield '  '.repeat(indent) + line;
    }
  }
}

module.exports = formatLines;
