import { DocItem } from '../doc-item';

export function itemType(item: DocItem): string {
  return item.nodeType.replace(/(Definition|Declaration)$/, '').replace(/(\w)([A-Z])/g, '$1 $2');
}
