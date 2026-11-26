import type { DocItem } from '../doc-item.ts';

export function itemType(item: DocItem): string {
  return item.nodeType.replace(/(Definition|Declaration)$/, '').replace(/(\w)([A-Z])/g, '$1 $2');
}
