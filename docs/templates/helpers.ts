import { version } from '../../package.json';

export const ozVersion = () => version;

export const readmePath = opts => {
  return 'contracts/' + opts.data.root.id.replace(/\.adoc$/, '') + '/README.adoc';
};

export const names = params => params?.map(p => p.name).join(', ');

export const typedParams = params => {
  return params?.map(p => `${p.type}${p.indexed ? ' indexed' : ''}${p.name ? ' ' + p.name : ''}`).join(', ');
};

export const slug = str => {
  if (str === undefined) {
    throw new Error('Missing argument');
  }
  return str.replace(/\W/g, '-');
};

const linksCache = new WeakMap();

function getAllLinks(items) {
  if (linksCache.has(items)) {
    return linksCache.get(items);
  }
  const res = {};
  linksCache.set(items, res);
  for (const item of items) {
    res[`xref-${item.anchor}`] = `xref:${item.__item_context.page}#${item.anchor}`;
    res[slug(item.fullName)] = `pass:normal[xref:${item.__item_context.page}#${item.anchor}[\`${item.fullName}\`]]`;
  }
  return res;
}

export const withPrelude = opts => {
  const links = getAllLinks(opts.data.site.items);
  const contents = opts.fn();
  const neededLinks = contents
    .match(/\{[-._a-z0-9]+\}/gi)
    .map(m => m.replace(/^\{(.+)\}$/, '$1'))
    .filter(k => k in links);
  const prelude = neededLinks.map(k => `:${k}: ${links[k]}`).join('\n');
  return prelude + '\n' + contents;
};
