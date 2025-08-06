const { version } = require('../../package.json');

module.exports['oz-version'] = () => version;

module.exports['readme-path'] = opts => {
  const pageId = opts.data.root.id;
  // Remove both .adoc and .md extensions
  const basePath = pageId.replace(/\.(adoc|md)$/, '');
  return 'contracts/' + basePath + '/README.adoc';
};

module.exports.names = params => params?.map(p => p.name).join(', ');

module.exports['typed-params'] = params => {
  return params?.map(p => `${p.type}${p.indexed ? ' indexed' : ''}${p.name ? ' ' + p.name : ''}`).join(', ');
};

const slug = (module.exports.slug = str => {
  if (str === undefined) {
    throw new Error('Missing argument');
  }
  return str.replace(/\W/g, '-');
});

// Markdown-specific link generation
const linksCache = new WeakMap();

function getAllLinks(items) {
  if (linksCache.has(items)) {
    return linksCache.get(items);
  }
  const res = {};
  linksCache.set(items, res);
  for (const item of items) {
    // Remove .md extension from page path
    const pagePath = item.__item_context.page.replace(/\.md$/, '');
    res[`xref-${item.anchor}`] = `[${item.anchor}](${pagePath}#${item.anchor})`;
    res[slug(item.fullName)] = `[\`${item.fullName}\`](${pagePath}#${item.anchor})`;
  }
  return res;
}

module.exports['with-prelude'] = opts => {
  // For markdown, we'll replace the placeholders inline
  const links = getAllLinks(opts.data.site.items);
  let contents = opts.fn();

  // Replace all {link-key} placeholders with actual markdown links
  contents = contents.replace(/\{([-._a-z0-9]+)\}/gi, (match, key) => {
    return links[key] || match; // Keep original if no replacement found
  });

  return contents;
};
