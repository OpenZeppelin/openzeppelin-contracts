import { DocItemWithContext, DOC_ITEM_CONTEXT, Build } from '../site';

export function readItemDocs(item: DocItemWithContext): string | undefined {
  const { build } = item[DOC_ITEM_CONTEXT];
  // Note that Solidity 0.5 has item.documentation: string even though the
  // types do not reflect that. This is why we check typeof === object.
  if ('documentation' in item && item.documentation && typeof item.documentation === 'object') {
    const { source, start, length } = decodeSrc(item.documentation.src, build);
    const content = build.input.sources[source]?.content;
    if (content !== undefined) {
      return Buffer.from(content, 'utf8')
        .slice(start, start + length)
        .toString('utf8');
    }
  }
}

function decodeSrc(src: string, build: Build): { source: string; start: number; length: number } {
  const [start, length, sourceId] = src.split(':').map(s => parseInt(s));
  if (start === undefined || length === undefined || sourceId === undefined) {
    throw new Error(`Bad source string ${src}`);
  }
  const source = Object.keys(build.output.sources).find(s => build.output.sources[s]?.id === sourceId);
  if (source === undefined) {
    throw new Error(`No source with id ${sourceId}`);
  }
  return { source, start, length };
}
