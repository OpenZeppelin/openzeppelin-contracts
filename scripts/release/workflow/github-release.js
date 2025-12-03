const { readFileSync } = require('fs');
const { join } = require('path');
const { version } = require(join(__dirname, '../../../package.json'));

module.exports = async ({ github, context }) => {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');

  await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: `v${version}`,
    target_commitish: context.sha,
    body: extractSection(changelog, version),
    prerelease: process.env.PRERELEASE === 'true',
  });
};

// From https://github.com/frangio/extract-changelog/blob/master/src/utils/word-regexp.ts
function makeWordRegExp(word) {
  const start = word.length > 0 && /\b/.test(word[0]) ? '\\b' : '';
  const end = word.length > 0 && /\b/.test(word[word.length - 1]) ? '\\b' : '';
  return new RegExp(start + [...word].map(c => (/[a-z0-9]/i.test(c) ? c : '\\' + c)).join('') + end);
}

// From https://github.com/frangio/extract-changelog/blob/master/src/core.ts
function extractSection(document, wantedHeading) {
  // ATX Headings as defined in GitHub Flavored Markdown (https://github.github.com/gfm/#atx-headings)
  const heading = /^ {0,3}(?<lead>#{1,6})(?: [ \t\v\f]*(?<text>.*?)[ \t\v\f]*)?(?:[\n\r]+|$)/gm;

  const wantedHeadingRe = makeWordRegExp(wantedHeading);

  let start, end;

  for (const m of document.matchAll(heading)) {
    if (!start) {
      if (m.groups.text.search(wantedHeadingRe) === 0) {
        start = m;
      }
    } else if (m.groups.lead.length <= start.groups.lead.length) {
      end = m;
      break;
    }
  }

  if (start) {
    return document.slice(start.index + start[0].length, end?.index);
  }
}
