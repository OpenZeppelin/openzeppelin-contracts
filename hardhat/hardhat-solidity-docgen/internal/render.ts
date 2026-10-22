import Handlebars, { RuntimeOptions } from 'handlebars';
import { Site, Page, DocItemWithContext } from './site';
import { Templates } from './templates';
import { itemType } from './utils/item-type';
import fs from 'fs';

export interface RenderedPage {
  id: string;
  contents: string;
}

interface TemplateOptions {
  data: {
    site: Site;
  };
}

export function render(site: Site, templates: Templates, collapseNewlines?: boolean): RenderedPage[] {
  const renderPage = buildRenderer(templates);
  return site.pages
    .map(page => ({ id: page.id, contents: renderPage(page, { data: { site } }) }))
    .map(({ id, contents }) => ({
      id,
      contents: collapseNewlines ? contents.replace(/\n{3,}/g, '\n\n') : contents,
    }));
}

export const itemPartialName = (item: DocItemWithContext) => itemType(item).replace(/ /g, '-').toLowerCase();

function itemPartial(item: DocItemWithContext, options?: RuntimeOptions) {
  if (!item.__item_context) {
    throw new Error(`Partial 'item' used in unsupported context (not a doc item)`);
  }
  const partial = options?.partials?.[itemPartialName(item)];
  if (!partial) {
    throw new Error(`Missing partial '${itemPartialName(item)}'`);
  }
  return partial(item, options);
}

function readmeHelper(H: typeof Handlebars, path: string, opts: RuntimeOptions) {
  const items: DocItemWithContext[] = opts.data.root.items;
  const renderedItems = Object.fromEntries(
    items.map(item => [item.name, new H.SafeString(H.compile('{{>item}}')(item, opts))]),
  );
  return new H.SafeString(H.compile(fs.readFileSync(path, 'utf8'))(renderedItems, opts));
}

function buildRenderer(templates: Templates): (page: Page, options: TemplateOptions) => string {
  const pageTemplate = templates.partials?.page;
  if (pageTemplate === undefined) {
    throw new Error(`Missing 'page' template`);
  }

  const H = Handlebars.create();

  for (const [name, getBody] of Object.entries(templates.partials ?? {})) {
    let partial: HandlebarsTemplateDelegate | undefined;
    H.registerPartial(name, (...args) => {
      partial ??= H.compile(getBody());
      return partial(...args);
    });
  }

  H.registerHelper('readme', (path: string, opts: RuntimeOptions) => readmeHelper(H, path, opts));

  for (const [name, fn] of Object.entries(templates.helpers ?? {})) {
    H.registerHelper(name, fn);
  }

  H.registerPartial('item', itemPartial);

  return H.compile('{{>page}}');
}
