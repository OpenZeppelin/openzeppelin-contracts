import { DocItemWithContext, DOC_ITEM_CONTEXT } from '../site';

export class ItemError extends Error {
  constructor(msg: string, item: DocItemWithContext) {
    const ctx = item[DOC_ITEM_CONTEXT];
    const src = ctx && ctx.build.decodeSrc(item);
    if (src) {
      super(msg + ` (${src})`);
    } else {
      super(msg);
    }
  }
}
