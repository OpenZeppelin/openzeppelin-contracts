const path = require('path');
const { minimatch } = require('minimatch');

const { isFallbackFunction } = require('solhint/lib/common/ast-types');
const { hasLeadingUnderscore } = require('solhint/lib/common/identifier-naming');

// Files matching these patterns will be ignored unless a rule has `static global = true`
const ignore = ['contracts/mocks/**/*', 'test/**/*'];

class Base {
  constructor(reporter, config, source, fileName) {
    this.reporter = reporter;
    this.source = source;
    this.fileName = fileName;
    this.ignored = this.constructor.global || ignore.some(p => minimatch(path.normalize(fileName), p));
    this.ruleId = this.constructor.ruleId;
    if (this.ruleId === undefined) {
      throw Error('missing ruleId static property');
    }
  }

  require(condition, node, message) {
    if (!condition && !this.ignored) {
      this.reporter.error(node, this.ruleId, message);
    }
  }
}

module.exports = [
  class extends Base {
    static ruleId = 'private-variables';

    VariableDeclaration(node) {
      if (node.isStateVar) {
        this.require(
          node.isDeclaredConst || node.isImmutable || node.visibility === 'private',
          node,
          'State variables must be private',
        );
      }
    }
  },

  class extends Base {
    static ruleId = 'leading-underscore';

    VariableDeclaration(node) {
      if (node.isDeclaredConst) {
        this.require(!hasLeadingUnderscore(node.name), node, 'Constant variables should not have leading underscore');
      } else if (node.isStateVar) {
        switch (node.visibility) {
          case 'private':
            this.require(hasLeadingUnderscore(node.name), node, 'Private state variables must have leading underscore');
            break;
          case 'internal':
            this.require(
              hasLeadingUnderscore(node.name),
              node,
              'Internal state variables must have leading underscore',
            );
            break;
          case 'public':
            this.require(
              !hasLeadingUnderscore(node.name),
              node,
              'Public state variables should not have leading underscore',
            );
            break;
        }
      }
    }

    FunctionDefinition(node) {
      switch (node.visibility) {
        case 'external':
          this.require(!hasLeadingUnderscore(node.name), node, 'External functions should not have leading underscore');
          break;
        case 'public':
          this.require(!hasLeadingUnderscore(node.name), node, 'Public functions should not have leading underscore');
          break;
        case 'internal':
          this.require(
            hasLeadingUnderscore(node.name) !== (node.parent.kind === 'library'),
            node,
            node.parent.kind === 'library'
              ? 'Library internal functions should not have leading underscore'
              : 'Non-library internal functions must have leading underscore',
          );
          break;
        case 'private':
          this.require(hasLeadingUnderscore(node.name), node, 'Private functions must have leading underscore');
          break;
      }
    }
  },

  class extends Base {
    static ruleId = 'no-external-virtual';

    FunctionDefinition(node) {
      if (node.visibility == 'external' && node.isVirtual) {
        this.require(isFallbackFunction(node), node, 'Functions should not be external and virtual');
      }
    }
  },

  class extends Base {
    static ruleId = 'imports-order';

    SourceUnit(node) {
      if (this.ignored) return;

      const imports = node.children.filter(child => child.type === 'ImportDirective');
      const dirname = path.dirname(this.fileName);

      const entries = imports.map(child => {
        const isRelative = child.path.startsWith('.');
        // Resolved path, used for ordering. External (node_modules) paths are kept as-is.
        const absolutePath = isRelative ? path.join(dirname, child.path) : child.path;
        // Canonical way of writing this import in this file: shortest relative path, `./` prefixed.
        const canonicalPath = isRelative ? path.relative(dirname, absolutePath).replace(/^(?!\.)/, './') : child.path;
        return {
          isRelative,
          absolutePath,
          canonicalPath,
          actual: this.source.slice(child.range[0], child.range[1] + 1), // trailing `;` captured
          expected: [
            this.source.slice(child.range[0], child.pathLiteral.range[0] + 1),
            canonicalPath,
            this.source.slice(child.pathLiteral.range[1], child.range[1] + 1),
          ].join(''),
        };
      });

      // Ordering by path relative to the contracts repo
      const collator = new Intl.Collator('en');
      const sorted = [...entries]
        .sort(
          (a, b) =>
            a.isRelative - b.isRelative || // external before relative
            collator.compare(a.absolutePath, b.absolutePath) ||
            collator.compare(a.expected, b.expected),
        )
        .map(({ expected }) => expected);

      if (sorted.some((entry, i) => entry !== entries[i].actual)) {
        this.reporter.error(imports[0], this.ruleId, 'Imports are not correctly ordered or normalized', fixer =>
          fixer.replaceTextRange([imports.at(0).range[0], imports.at(-1).range[1]], sorted.join('\n')),
        );
      }
    }
  },

  class extends Base {
    static ruleId = 'no-public-library';

    FunctionDefinition(node) {
      if (node.parent.kind === 'library') {
        this.require(
          node.visibility === 'internal' || node.visibility === 'private',
          node,
          'Library functions should be internal or private',
        );
      }
    }
  },
];
