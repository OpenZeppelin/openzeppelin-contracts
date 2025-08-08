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

module.exports.eq = (a, b) => a === b;

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
    const pagePath = item.__item_context.page.replace(/\.mdx$/, '');
    res[`xref-${item.anchor}`] = `[${item.anchor}](${pagePath}#${item.anchor})`;
    res[slug(item.fullName)] = `[\`${item.fullName}\`](${pagePath}#${item.anchor})`;
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
      .replace(/&amp;/g, '&'); // Decode &amp; last to avoid double-decoding

    // Convert api: links to contracts/v5.x/api/ and change .adoc to .mdx
    mdContent = mdContent.replace(/\(api:([^)]+)\.adoc([^)]*)\)/g, '(contracts/v5.x/api/$1.mdx$2)');

    // Add forward slash to image paths
    mdContent = mdContent.replace(/!\[([^\]]*)\]\(([^/)][^)]*\.(png|jpg|jpeg|gif|svg|webp))\)/g, '![$1](/$2)');

    // Fix curly brace placeholders that got incorrectly converted
    mdContent = mdContent.replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1');

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
    return links[key] || match; // Keep original if no replacement found
  });

  // Fix HTML entities that may have been introduced
  contents = contents
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&'); // Decode &amp; last to avoid double-decoding

  // Fix curly brace placeholders that may have been incorrectly added by link replacement
  contents = contents.replace(/\{(\[`[^`]+`\]\([^)]+\))\}/g, '$1');

  return contents;
};
