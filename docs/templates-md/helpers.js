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

module.exports['function-anchor'] = function (name, params, returns) {
  // Generate anchor that matches what markdown would create from the full function header
  let anchor = name;

  if (params && params.length > 0) {
    // Add parameter types and names (type + name for each param)
    const paramParts = params
      .map(p => {
        let part = p.type;
        if (p.name) {
          part += '-' + p.name;
        }
        return part;
      })
      .join('-');
    anchor += paramParts
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '-')
      .replace(/-+/g, '-');
  }

  if (returns && returns.length > 0) {
    // Add return types and names
    const returnParts = returns
      .map(r => {
        let part = r.type;
        if (r.name) {
          part += '-' + r.name;
        }
        return part;
      })
      .join('-');
    anchor +=
      '--' +
      returnParts
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '-')
        .replace(/-+/g, '-');
  }

  return anchor;
};

module.exports.eq = (a, b) => a === b;

module.exports['starts-with'] = (str, prefix) => str && str.startsWith(prefix);

// Helper to process natspec content with link replacement
module.exports['process-natspec'] = function (natspec, opts) {
  if (!natspec) return '';

  // Get links from the site data
  const links = getAllLinks(opts.data.site.items);

  // Apply the same link replacement logic as in with-prelude
  let content = natspec;

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

function getAllLinks(items) {
  if (linksCache.has(items)) {
    return linksCache.get(items);
  }
  const res = {};
  linksCache.set(items, res);

  for (const item of items) {
    // Remove .mdx extension from page path
    const pagePath = item.__item_context.page.replace(/\.mdx$/, '');

    // Generate anchor with parameter and return types for uniqueness
    let anchor = item.name;

    // Add parameter types and names if available
    if (item.parameters && item.parameters.parameters && item.parameters.parameters.length > 0) {
      const paramParts = item.parameters.parameters
        .map(p => {
          let part = p.typeName.typeDescriptions.typeString;
          if (p.name) {
            part += '-' + p.name;
          }
          return part;
        })
        .join('-');
      anchor += paramParts
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '-')
        .replace(/-+/g, '-');
    }

    // Add return types and names if available
    if (item.returns && item.returns.length > 0) {
      const returnParts = item.returns
        .map(r => {
          let part = r.type;
          if (r.name) {
            part += '-' + r.name;
          }
          return part;
        })
        .join('-');
      anchor +=
        '--' +
        returnParts
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '-')
          .replace(/-+/g, '-');
    }

    // Create link entries - map old complex keys to new type-based anchors
    res[`xref-${item.anchor}`] = `[${item.anchor}](${pagePath}#${anchor})`;
    res[slug(item.fullName)] = `[\`${item.fullName}\`](${pagePath}#${anchor})`;
    res[item.anchor] = `[\`${item.fullName}\`](${pagePath}#${anchor})`;
    res[item.name] = `[\`${item.name}\`](${pagePath}#${anchor})`;

    // Also handle the contract-function format for cross-references
    if (item.__item_context?.contract?.name) {
      const contractDotFunction = `${item.__item_context.contract.name}.${item.name}`;
      res[contractDotFunction] = `[\`${contractDotFunction}\`](${pagePath}#${anchor})`;
    }
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
  const links = getAllLinks(opts.data.site.items);
  let contents = opts.fn();

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
