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
      if (imports.length < 2) return;

      const entries = imports.map(child => ({
        text: this.source.slice(child.range[0], child.range[1] + 1), // trailing `;` captured
        path: child.path,
      }));

      // Sort imports by ascending rank (lower first). Ordering:
      // - `@some-project/x.sol`  -> [0, 0]  (external)
      // - `../../utils/Math.sol` -> [1, -2] (relative, two `..`)
      // - `../AccessControl.sol` -> [1, -1] (relative, one `..`)
      // - `./IFoo.sol`           -> [1, 0]  (relative, zero `..`)
      const rank = p => (p.startsWith('.') ? [1, -p.split('/').filter(part => part === '..').length] : [0, 0]);
      const sorted = [...entries].sort(
        (a, b) =>
          rank(a.path)[0] - rank(b.path)[0] || // external before relative
          rank(a.path)[1] - rank(b.path)[1] || // deeper (more `..`) first
          a.path.localeCompare(b.path, undefined, { sensitivity: 'base' }),
      );
      if (sorted.every((entry, i) => entry.text === entries[i].text)) return;

      const range = [imports[0].range[0], imports[imports.length - 1].range[1]];
      this.reporter.error(imports[0], this.ruleId, 'Imports are not correctly ordered', fixer =>
        fixer.replaceTextRange(range, sorted.map(entry => entry.text).join('\n')),
      );
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
