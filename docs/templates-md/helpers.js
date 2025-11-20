const { version } = require('../../package.json');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const API_DOCS_PATH = 'contracts/5.x/api';

module.exports['oz-version'] = () => version;

module.exports['readme-path'] = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  return 'contracts/' + basePath + '/README.adoc';
};

module.exports.readme = readmePath => {
  try {
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      return processAdocContent(readmeContent);
    }
  } catch (error) {
    console.warn(`Warning: Could not process README at ${readmePath}:`, error.message);
  }
  return '';
};

module.exports.names = params => params?.map(p => p.name).join(', ');

// Simple function counter for unique IDs
const functionNameCounts = {};

module.exports['simple-id'] = function (name) {
  if (!functionNameCounts[name]) {
    functionNameCounts[name] = 1;
    return name;
  } else {
    functionNameCounts[name]++;
    return `${name}-${functionNameCounts[name]}`;
  }
};

module.exports['reset-function-counts'] = function () {
  Object.keys(functionNameCounts).forEach(key => delete functionNameCounts[key]);
  return '';
};

module.exports.eq = (a, b) => a === b;
module.exports['starts-with'] = (str, prefix) => str && str.startsWith(prefix);

// Process natspec content with {REF} and link replacement
module.exports['process-natspec'] = function (natspec, opts) {
  if (!natspec) return '';

  const currentPage = opts.data.root.__item_context?.page || opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);

  const processed = processReferences(natspec, links);
  return processCallouts(processed); // Add callout processing at the end
};

module.exports['typed-params'] = params => {
  return params?.map(p => `${p.type}${p.indexed ? ' indexed' : ''}${p.name ? ' ' + p.name : ''}`).join(', ');
};

const slug = (module.exports.slug = str => {
  if (str === undefined) {
    throw new Error('Missing argument');
  }
  return str.replace(/\W/g, '-');
});

// Link generation and caching
const linksCache = new WeakMap();

function getAllLinks(items, currentPage) {
  if (currentPage) {
    const cacheKey = currentPage;
    let cache = linksCache.get(items);
    if (!cache) {
      cache = new Map();
      linksCache.set(items, cache);
    }

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
  }

  const res = {};
  const currentPagePath = currentPage ? currentPage.replace(/\.mdx$/, '') : '';

  for (const item of items) {
    const pagePath = item.__item_context.page.replace(/\.mdx$/, '');
    const linkPath = generateLinkPath(pagePath, currentPagePath, item.anchor);

    // Generate xref keys for legacy compatibility
    res[`xref-${item.anchor}`] = linkPath;

    // Generate original case xref keys
    if (item.__item_context && item.__item_context.contract) {
      let originalAnchor = item.__item_context.contract.name + '-' + item.name;
      if ('parameters' in item) {
        const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
        originalAnchor += slug('(' + signature + ')');
      }
      res[`xref-${originalAnchor}`] = linkPath;
    }

    res[slug(item.fullName)] = `[\`${item.fullName}\`](${linkPath})`;
  }

  if (currentPage) {
    let cache = linksCache.get(items);
    if (!cache) {
      cache = new Map();
      linksCache.set(items, cache);
    }
    cache.set(currentPage, res);
  }

  return res;
}

function generateLinkPath(pagePath, currentPagePath, anchor) {
  if (
    currentPagePath &&
    (pagePath === currentPagePath || pagePath.split('/').pop() === currentPagePath.split('/').pop())
  ) {
    return `#${anchor}`;
  }

  if (currentPagePath) {
    const currentParts = currentPagePath.split('/');
    const targetParts = pagePath.split('/');

    // Find common base
    let i = 0;
    while (i < currentParts.length && i < targetParts.length && currentParts[i] === targetParts[i]) {
      i++;
    }

    const upLevels = Math.max(0, currentParts.length - 1 - i);
    const downPath = targetParts.slice(i);

    if (upLevels === 0 && downPath.length === 1) {
      return `${downPath[0]}#${anchor}`;
    } else if (upLevels === 0) {
      return `${downPath.join('/')}#${anchor}`;
    } else {
      const relativePath = '../'.repeat(upLevels) + downPath.join('/');
      return `${relativePath}#${anchor}`;
    }
  }

  return `${pagePath}#${anchor}`;
}

// Process {REF} and other references
function processReferences(content, links) {
  let result = content;

  // Handle {REF:Contract.method} patterns
  result = result.replace(/\{REF:([^}]+)\}/g, (match, refId) => {
    const resolvedRef = resolveReference(refId, links);
    return resolvedRef || match;
  });

  // Handle AsciiDoc-style {xref-...}[text] patterns
  result = result.replace(/\{(xref-[-._a-z0-9]+)\}\[([^\]]*)\]/gi, (match, key, linkText) => {
    const replacement = links[key];
    return replacement ? `[${linkText}](${replacement})` : match;
  });

  // Handle cross-references in format {Contract-function-parameters}
  result = result.replace(
    /\{([A-Z][a-zA-Z0-9]*)-([a-zA-Z_][a-zA-Z0-9]*)-([^-}]+)\}/g,
    (match, contract, func, params) => {
      const commaParams = params
        .replace(/-bytes\[\]/g, ',bytes[]')
        .replace(/-uint[0-9]*/g, ',uint$1')
        .replace(/-address/g, ',address')
        .replace(/-bool/g, ',bool')
        .replace(/-string/g, ',string');
      const slugifiedParams = commaParams.replace(/\W/g, '-');
      const xrefKey = `xref-${contract}-${func}-${slugifiedParams}`;
      const replacement = links[xrefKey];
      if (replacement) {
        return `[\`${contract}.${func}\`](${replacement})`;
      }
      return match;
    },
  );

  // Handle cross-references in format {Contract-function-parameters}
  result = result.replace(
    /\{([A-Z][a-zA-Z0-9]*)-([a-zA-Z_][a-zA-Z0-9]*)-([^}]+)\}/g,
    (match, contract, func, params) => {
      const commaParams = params
        .replace(/-bytes\[\]/g, ',bytes[]')
        .replace(/-uint[0-9]*/g, ',uint$1')
        .replace(/-address/g, ',address')
        .replace(/-bool/g, ',bool')
        .replace(/-string/g, ',string');
      const slugifiedParams = `(${commaParams})`.replace(/\W/g, '-');
      const xrefKey = `xref-${contract}-${func}${slugifiedParams}`;
      const replacement = links[xrefKey];
      if (replacement) {
        return `[\`${contract}.${func}\`](${replacement})`;
      }
      return match;
    },
  );

  // Replace {link-key} placeholders with markdown links
  result = result.replace(/\{([-._a-z0-9]+)\}/gi, (match, key) => {
    const replacement = findBestMatch(key, links);
    return replacement || `\`${key}\``;
  });

  return cleanupContent(result);
}

function resolveReference(refId, links) {
  // Try direct match first
  const directKey = `xref-${refId.replace(/\./g, '-')}`;
  if (links[directKey]) {
    const parts = refId.split('.');
    const displayText = parts.length > 1 ? `${parts[0]}.${parts[1]}` : refId;
    return `[\`${displayText}\`](${links[directKey]})`;
  }

  // Try fuzzy matching
  const matchingKeys = Object.keys(links).filter(key => {
    const normalizedKey = key.replace('xref-', '').toLowerCase();
    const normalizedRef = refId.replace(/\./g, '-').toLowerCase();
    return normalizedKey.includes(normalizedRef) || normalizedRef.includes(normalizedKey);
  });

  if (matchingKeys.length > 0) {
    const bestMatch = matchingKeys[0];
    const parts = refId.split('.');
    const displayText = parts.length > 1 ? `${parts[0]}.${parts[1]}` : refId;
    return `[\`${displayText}\`](${links[bestMatch]})`;
  }

  return null;
}

function findBestMatch(key, links) {
  let replacement = links[key];

  if (!replacement) {
    // Strategy 1: Look for keys that end with this key
    let matchingKeys = Object.keys(links).filter(linkKey => {
      const parts = linkKey.split('-');
      return parts.length >= 2 && parts[parts.length - 1] === key;
    });

    // Strategy 2: Try with different separators
    if (matchingKeys.length === 0) {
      const keyWithDashes = key.replace(/\./g, '-');
      matchingKeys = Object.keys(links).filter(linkKey => linkKey.includes(keyWithDashes));
    }

    // Strategy 3: Try partial matches
    if (matchingKeys.length === 0) {
      matchingKeys = Object.keys(links).filter(linkKey => {
        return linkKey === key || linkKey.endsWith('-' + key) || linkKey.includes(key);
      });
    }

    if (matchingKeys.length > 0) {
      const nonXrefMatches = matchingKeys.filter(k => !k.startsWith('xref-'));
      const bestMatch = nonXrefMatches.length > 0 ? nonXrefMatches[0] : matchingKeys[0];
      replacement = links[bestMatch];
    }
  }

  return replacement;
}

function cleanupContent(content) {
  return content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&amp;/g, '&')
    .replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1')
    .replace(/https?:\/\/[^\s[]+\[[^\]]+\]/g, match => {
      const urlMatch = match.match(/^(https?:\/\/[^[]+)\[([^\]]+)\]$/);
      return urlMatch ? `[${urlMatch[2]}](${urlMatch[1]})` : match;
    });
}

function processAdocContent(content) {
  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adoc-process-'));
    const tempAdocFile = path.join(tempDir, 'temp.adoc');
    const tempMdFile = path.join(tempDir, 'temp.md');

    // Preprocess AsciiDoc content - only handle non-admonition transformations here
    const processedContent = content
      .replace(
        /```solidity\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n```/g,
        "<include cwd lang='solidity'>./examples/$1</include>",
      )
      .replace(
        /\[source,solidity\]\s*\n----\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n----/g,
        "<include cwd lang='solidity'>./examples/$1</include>",
      );

    fs.writeFileSync(tempAdocFile, processedContent, 'utf8');

    execSync(`npx downdoc "${tempAdocFile}"`, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    let mdContent = fs.readFileSync(tempMdFile, 'utf8');

    // Clean up and transform markdown, then process callouts once at the end
    mdContent = cleanupContent(mdContent)
      .replace(/\(api:([^)]+)\.adoc([^)]*)\)/g, `(${API_DOCS_PATH}/$1.mdx$2)`)
      .replace(/!\[([^\]]*)\]\(([^/)][^)]*\.(png|jpg|jpeg|gif|svg|webp))\)/g, '![$1](/$2)')
      .replace(/^#+\s+.+$/m, '')
      .replace(/^\n+/, '');

    // Process callouts once at the very end
    mdContent = processCallouts(mdContent);

    // Cleanup temp files
    try {
      fs.unlinkSync(tempAdocFile);
      fs.unlinkSync(tempMdFile);
      fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up temp files:', cleanupError.message);
    }

    return mdContent;
  } catch (error) {
    console.warn('Warning: Failed to process AsciiDoc content:', error.message);
    return content;
  }
}

function processCallouts(content) {
  // First, normalize whitespace around block delimiters to make patterns more consistent
  let result = content.replace(/\s*\n====\s*\n/g, '\n====\n').replace(/\n====\s*\n/g, '\n====\n');

  // Handle AsciiDoc block admonitions (with ====)
  result = result.replace(/^\[(NOTE|TIP)\]\s*\n====\s*\n([\s\S]*?)\n====$/gm, '<Callout>\n$2\n</Callout>');
  result = result.replace(
    /^\[(IMPORTANT|WARNING|CAUTION)\]\s*\n====\s*\n([\s\S]*?)\n====$/gm,
    '<Callout type="warn">\n$2\n</Callout>',
  );

  // Handle simple single-line admonitions
  result = result.replace(/^(NOTE|TIP):\s*(.+)$/gm, '<Callout>\n$2\n</Callout>');
  result = result.replace(/^(IMPORTANT|WARNING):\s*(.+)$/gm, '<Callout type="warn">\n$2\n</Callout>');

  // Handle markdown-style bold admonitions (the ones you're seeing)
  result = result.replace(
    /^\*\*⚠️ WARNING\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm,
    '<Callout type="warn">\n$1\n</Callout>',
  );
  result = result.replace(
    /^\*\*❗ IMPORTANT\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm,
    '<Callout type="warn">\n$1\n</Callout>',
  );
  result = result.replace(/^\*\*📌 NOTE\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm, '<Callout>\n$1\n</Callout>');
  result = result.replace(/^\*\*💡 TIP\*\*\\\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/gm, '<Callout>\n$1\n</Callout>');

  // Handle any remaining HTML-style admonitions from downdoc conversion
  result = result.replace(
    /<dl><dt><strong>(?:💡|📌|ℹ️)?\s*(TIP|NOTE|INFO)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout>\n$2\n</Callout>',
  );
  result = result.replace(
    /<dl><dt><strong>(?:⚠️|❗)?\s*(WARNING|IMPORTANT)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout type="warn">\n$2\n</Callout>',
  );

  // Fix prematurely closed callouts - move </Callout> to after all paragraph text
  // This handles cases where </Callout> was inserted after the first line but there's more text
  result = result.replace(/(<Callout[^>]*>\n[^<]+)\n<\/Callout>\n([^<\n]+(?:\n[^<\n]+)*)/g, '$1\n$2\n</Callout>');

  // Clean up "better viewed at" notices (keep these at the end)
  result = result.replace(/^\*\*📌 NOTE\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*⚠️ WARNING\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*❗ IMPORTANT\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');
  result = result.replace(/^\*\*💡 TIP\*\*\\\s*\nThis document is better viewed at [^\n]*\n*/gm, '');

  // More generic cleanup for "better viewed at" notices
  result = result.replace(/This document is better viewed at https:\/\/docs\.openzeppelin\.com[^\n]*\n*/g, '');

  // Remove any resulting callouts that only contain the "better viewed at" message
  result = result.replace(/<Callout[^>]*>\s*This document is better viewed at [^\n]*\s*<\/Callout>\s*/g, '');
  result = result.replace(/<Callout[^>]*>\s*<\/Callout>/g, '');

  // Remove callouts that only contain whitespace/newlines
  result = result.replace(/<Callout[^>]*>\s*\n\s*<\/Callout>/g, '');

  return result;
}

module.exports.title = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  const parts = basePath.split('/');
  const dirName = parts[parts.length - 1] || 'Contracts';
  return dirName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

module.exports.description = opts => {
  const pageId = opts.data.root.id;
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  const parts = basePath.split('/');
  const dirName = parts[parts.length - 1] || 'contracts';
  return `Smart contract ${dirName.replace('-', ' ')} utilities and implementations`;
};

module.exports['with-prelude'] = opts => {
  const currentPage = opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);
  const contents = opts.fn();

  const processed = processReferences(contents, links);
  return processCallouts(processed); // Add callout processing here too
};
