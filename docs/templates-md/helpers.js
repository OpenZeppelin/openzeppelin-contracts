const { version } = require('../../package.json');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

module.exports['oz-version'] = () => version;

module.exports['readme-path'] = opts => {
  const pageId = opts.data.root.id;
  // Remove both .adoc and .md extensions
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
  return ''; // Return empty string if README doesn't exist or processing fails
};

module.exports.names = params => params?.map(p => p.name).join(', ');

// Create a context for tracking function names across the current contract
const functionNameCounts = {};

module.exports['simple-id'] = function (name) {
  // Keep track of how many times we've seen this function name
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

// Helper to process natspec content with link replacement
module.exports['process-natspec'] = function (natspec, opts) {
  if (!natspec) return '';

  // Get links from the site data, passing current page context
  const currentPage = opts.data.root.__item_context?.page || opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);

  // Apply the same link replacement logic as in with-prelude
  let content = natspec;

  // First handle AsciiDoc-style {xref-...}[text] patterns
  content = content.replace(/\{(xref-[-._a-z0-9]+)\}\[([^\]]*)\]/gi, (match, key, linkText) => {
    const replacement = links[key];
    if (replacement) {
      return `[${linkText}](${replacement})`;
    }
    return match;
  });

  // Replace all {link-key} placeholders with actual markdown links
  content = content.replace(/\{([-._a-z0-9]+)\}/gi, (match, key) => {
    let replacement = links[key];

    // If not found, try various matching strategies
    if (!replacement) {
      // Strategy 1: Look for keys that end with this key (for function references without contract prefix)
      let matchingKeys = Object.keys(links).filter(linkKey => {
        const parts = linkKey.split('-');
        return parts.length >= 2 && parts[parts.length - 1] === key;
      });

      // Strategy 2: Try with different separators (dot notation to dash)
      if (matchingKeys.length === 0) {
        const keyWithDashes = key.replace(/\./g, '-');
        matchingKeys = Object.keys(links).filter(linkKey => linkKey.includes(keyWithDashes));
      }

      // Strategy 3: Try exact match with different prefixes
      if (matchingKeys.length === 0) {
        matchingKeys = Object.keys(links).filter(linkKey => {
          return linkKey === key || linkKey.endsWith('-' + key) || linkKey.includes(key);
        });
      }

      if (matchingKeys.length > 0) {
        // Prefer non-xref versions
        const nonXrefMatches = matchingKeys.filter(k => !k.startsWith('xref-'));
        const bestMatch = nonXrefMatches.length > 0 ? nonXrefMatches[0] : matchingKeys[0];
        replacement = links[bestMatch];
      }
    }

    return replacement || match; // Keep original if no replacement found
  });

  return content;
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

// Markdown-specific link generation
const linksCache = new WeakMap();

function getAllLinks(items, currentPage) {
  // Only use cache for specific pages, not for undefined currentPage
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
    // Remove .mdx extension from page path
    const pagePath = item.__item_context.page.replace(/\.mdx$/, '');

    let linkPath;
    // Normalize paths for comparison - remove leading directories if they match
    const currentBaseName = currentPagePath.split('/').pop();
    const targetBaseName = pagePath.split('/').pop();

    if (currentPagePath && (pagePath === currentPagePath || currentBaseName === targetBaseName)) {
      // Same page - just use anchor fragment
      linkPath = `#${item.anchor.toLowerCase()}`;
    } else if (currentPagePath) {
      // Different page - use relative path
      const currentParts = currentPagePath.split('/');
      const targetParts = pagePath.split('/');

      // Find common base and create relative path
      let i = 0;
      while (i < currentParts.length && i < targetParts.length && currentParts[i] === targetParts[i]) {
        i++;
      }

      const upLevels = Math.max(0, currentParts.length - 1 - i);
      const downPath = targetParts.slice(i);

      if (upLevels === 0 && downPath.length === 1) {
        // Same directory - just filename
        linkPath = `${downPath[0]}#${item.anchor.toLowerCase()}`;
      } else if (upLevels === 0) {
        // Going deeper into subdirectories
        linkPath = `${downPath.join('/')}#${item.anchor.toLowerCase()}`;
      } else {
        // Need to go up directory structure
        const relativePath = '../'.repeat(upLevels) + downPath.join('/');
        linkPath = `${relativePath}#${item.anchor.toLowerCase()}`;
      }
    } else {
      // Fallback to absolute path
      linkPath = `${pagePath}#${item.anchor.toLowerCase()}`;
    }

    // Generate xref keys to match legacy natspec content patterns
    // xref patterns should just be the link URL without text (text comes from surrounding content)
    res[`xref-${item.anchor}`] = linkPath;

    // Reconstruct the original AsciiDoc anchor format (with original case) for xref key
    // but link to our lowercase anchor. This handles natspec like {xref-ERC721-_safeMint-address-uint256-}
    if (item.__item_context && item.__item_context.contract) {
      let originalAnchor = item.__item_context.contract.name + '-' + item.name;
      if ('parameters' in item) {
        const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
        originalAnchor += slug('(' + signature + ')');
      }
      // Add original case xref key that maps to lowercase anchor (just URL, no text)
      res[`xref-${originalAnchor}`] = linkPath;
    }

    res[slug(item.fullName)] = `[\`${item.fullName}\`](${linkPath})`;
  }

  // Only cache if we have a specific currentPage
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

function processAdocContent(content) {
  try {
    // Create a temporary directory for processing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adoc-process-'));
    const tempAdocFile = path.join(tempDir, 'temp.adoc');
    const tempMdFile = path.join(tempDir, 'temp.md');

    // Apply transformations to content
    let processedContent = content;

    // Replace code blocks with includes
    processedContent = processedContent.replace(
      /```solidity\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n```/g,
      "<include cwd lang='solidity'>./examples/$1</include>",
    );

    processedContent = processedContent.replace(
      /\[source,solidity\]\s*\n----\s*\ninclude::api:example\$([^[\]]+)\[\]\s*\n----/g,
      "<include cwd lang='solidity'>./examples/$1</include>",
    );

    // Replace TIP: and NOTE: callouts with <Callout> tags
    processedContent = processedContent.replace(/^(TIP|NOTE):\s*(.+)$/gm, '<Callout>\n$2\n</Callout>');

    processedContent = processedContent.replace(
      /^(IMPORTANT|WARNING):\s*(.+)$/gm,
      "<Callout type='warn'>\n$2\n</Callout>",
    );

    // Write preprocessed content to temp file
    fs.writeFileSync(tempAdocFile, processedContent, 'utf8');

    // Run downdoc (using bunx as in your script)
    execSync(`bunx downdoc "${tempAdocFile}"`, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    // Read the generated markdown
    let mdContent = fs.readFileSync(tempMdFile, 'utf8');

    // Fix HTML entities globally - decode &amp; first to avoid double-decoding issues
    mdContent = mdContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`') // Decode backticks
      .replace(/&#x3D;/g, '=') // Decode equals signs
      .replace(/&amp;/g, '&'); // Decode &amp; last to avoid double-decoding

    // Convert api: links to contracts/v5.x/api/ and change .adoc to .mdx
    mdContent = mdContent.replace(/\(api:([^)]+)\.adoc([^)]*)\)/g, '(contracts/v5.x/api/$1.mdx$2)');

    // Add forward slash to image paths
    mdContent = mdContent.replace(/!\[([^\]]*)\]\(([^/)][^)]*\.(png|jpg|jpeg|gif|svg|webp))\)/g, '![$1](/$2)');

    // Fix curly brace placeholders that got incorrectly converted
    mdContent = mdContent.replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1');

    // Convert HTML definition list callouts to proper Callout components
    mdContent = mdContent.replace(
      /<dl><dt><strong>💡 TIP<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
      '<Callout>\n$1\n</Callout>',
    );

    mdContent = mdContent.replace(
      /<dl><dt><strong>📌 NOTE<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
      '<Callout>\n$1\n</Callout>',
    );

    // Handle other callout patterns that might have different icons or text
    mdContent = mdContent.replace(
      /<dl><dt><strong>(?:💡|📌|ℹ️)?\s*(TIP|NOTE|INFO)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
      '<Callout>\n$2\n</Callout>',
    );

    // Remove the first H1 from content (since the template will add its own title)
    const contentWithoutFirstH1 = mdContent.replace(/^#+\s+.+$/m, '').replace(/^\n+/, '');

    // Cleanup temp files
    try {
      fs.unlinkSync(tempAdocFile);
      fs.unlinkSync(tempMdFile);
      fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      // Ignore cleanup errors
      console.warn('Warning: Could not clean up temp files:', cleanupError.message);
    }

    return contentWithoutFirstH1;
  } catch (error) {
    console.warn('Warning: Failed to process AsciiDoc content:', error.message);
    // Fallback: return original content
    return content;
  }
}

module.exports.title = opts => {
  const pageId = opts.data.root.id;
  // Extract directory name from page path and format as title
  const basePath = pageId.replace(/\.(adoc|mdx)$/, '');
  const parts = basePath.split('/');
  const dirName = parts[parts.length - 1] || 'Contracts';
  // Convert from kebab-case to Title Case
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
  // For markdown, we'll replace the placeholders inline
  const currentPage = opts.data.root.id;
  const links = getAllLinks(opts.data.site.items, currentPage);
  let contents = opts.fn();

  // First handle AsciiDoc-style {xref-...}[text] patterns
  contents = contents.replace(/\{(xref-[-._a-z0-9]+)\}\[([^\]]*)\]/gi, (match, key, linkText) => {
    const replacement = links[key];
    if (replacement) {
      return `[${linkText}](${replacement})`;
    }
    return match;
  });

  // Replace all {link-key} placeholders with actual markdown links
  contents = contents.replace(/\{([-._a-z0-9]+)\}/gi, (match, key) => {
    let replacement = links[key];

    // If not found, try various matching strategies
    if (!replacement) {
      // Strategy 1: Look for keys that end with this key (for function references without contract prefix)
      let matchingKeys = Object.keys(links).filter(linkKey => {
        const parts = linkKey.split('-');
        return parts.length >= 2 && parts[parts.length - 1] === key;
      });

      // Strategy 2: Try with different separators (dot notation to dash)
      if (matchingKeys.length === 0) {
        const keyWithDashes = key.replace(/\./g, '-');
        matchingKeys = Object.keys(links).filter(linkKey => linkKey.includes(keyWithDashes));
      }

      // Strategy 3: Try exact match with different prefixes
      if (matchingKeys.length === 0) {
        matchingKeys = Object.keys(links).filter(linkKey => {
          return linkKey === key || linkKey.endsWith('-' + key) || linkKey.includes(key);
        });
      }

      if (matchingKeys.length > 0) {
        // Prefer non-xref versions
        const nonXrefMatches = matchingKeys.filter(k => !k.startsWith('xref-'));
        const bestMatch = nonXrefMatches.length > 0 ? nonXrefMatches[0] : matchingKeys[0];
        replacement = links[bestMatch];
      }
    }

    return replacement || match; // Keep original if no replacement found
  });

  // Fix HTML entities that may have been introduced
  contents = contents
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`') // Decode backticks
    .replace(/&#x3D;/g, '=') // Decode equals signs
    .replace(/&amp;/g, '&'); // Decode &amp; last to avoid double-decoding

  // Fix curly brace placeholders that may have been incorrectly added by link replacement
  contents = contents.replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1');

  // Convert HTML definition list callouts to proper Callout components
  contents = contents.replace(
    /<dl><dt><strong>💡 TIP<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout>\n$1\n</Callout>',
  );

  contents = contents.replace(
    /<dl><dt><strong>📌 NOTE<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout>\n$1\n</Callout>',
  );

  // Handle other callout patterns that might have different icons or text
  contents = contents.replace(
    /<dl><dt><strong>(?:💡|📌|ℹ️)?\s*(TIP|NOTE|INFO)<\/strong><\/dt><dd>\s*([\s\S]*?)\s*<\/dd><\/dl>/g,
    '<Callout>\n$2\n</Callout>',
  );

  return contents;
};
