export type Lines = string | typeof whitespace | Lines[];

const whitespace = Symbol('whitespace');

export function formatLines(...lines: Lines[]): string {
  return [...indentEach(0, lines)].join('\n') + '\n';
}

function* indentEach(indent: number, lines: Lines[]): Generator<string | typeof whitespace> {
  for (const line of lines) {
    if (line === whitespace) {
      yield '';
    } else if (Array.isArray(line)) {
      yield* indentEach(indent + 1, line);
    } else {
      yield '    '.repeat(indent) + line;
    }
  }
}

export function spaceBetween(...lines: Lines[][]): Lines[] {
  return lines
    .filter(l => l.length > 0)
    .flatMap<Lines>(l => [whitespace, ...l])
    .slice(1);
}
