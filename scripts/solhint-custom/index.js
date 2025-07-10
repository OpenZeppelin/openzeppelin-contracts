const path = require('path');
const minimatch = require('minimatch');

// Files matching these patterns will be ignored unless a rule has `static global = true`
const ignore = ['contracts/mocks/**/*', 'test/**/*'];

class Base {
  constructor(reporter, config, source, fileName) {
    this.reporter = reporter;
    this.ignored = this.constructor.global || ignore.some(p => minimatch(path.normalize(fileName), p));
    this.ruleId = this.constructor.ruleId;
    if (this.ruleId === undefined) {
      throw Error('missing ruleId static property');
    }
  }

  error(node, message) {
    if (!this.ignored) {
      this.reporter.error(node, this.ruleId, message);
    }
  }
}

module.exports = [
  class extends Base {
    static ruleId = 'interface-only-external-functions';

    FunctionDefinition(node) {
      if (node.parent.kind === 'interface' && node.visibility !== 'external') {
        this.error(node, 'Interface functions must be external');
      }
    }
  },

  class extends Base {
    static ruleId = 'private-variables';

    VariableDeclaration(node) {
      const constantOrImmutable = node.isDeclaredConst || node.isImmutable;
      if (node.isStateVar && !constantOrImmutable && node.visibility !== 'private') {
        this.error(node, 'State variables must be private');
      }
    }
  },

  class extends Base {
    static ruleId = 'leading-underscore';

    VariableDeclaration(node) {
      if (node.isDeclaredConst || node.isImmutable) {
        if (/^_/.test(node.name)) {
          this.error(node, 'Constant and immutable variables should not have leading underscore');
        }
      } else if (node.isStateVar) {
        if (node.visibility === 'private' || node.visibility === 'internal') {
          if (!/^_/.test(node.name)) {
            this.error(node, 'Private and internal state variables must have leading underscore');
          }
        } else {
          if (/^_/.test(node.name)) {
            this.error(node, 'Public state variables should not have leading underscore');
          }
        }
      }
    }

    FunctionDefinition(node) {
      if (node.visibility === 'private' && !/^_/.test(node.name)) {
        this.error(node, 'Private functions must have leading underscore');
      }
      if (node.visibility === 'internal' && node.parent.kind !== 'library' && !/^_/.test(node.name)) {
        this.error(node, 'Non-library internal functions must have leading underscore');
      }
      if (node.visibility === 'internal' && node.parent.kind === 'library' && /^_/.test(node.name)) {
        this.error(node, 'Library internal functions should not have leading underscore');
      }
      if (node.visibility === 'public' || node.visibility === 'external' && /^_/.test(node.name)) {
        this.error(node, 'Public and external functions should not have leading underscore');
      }
    }
  },

  class extends Base {
    static ruleId = 'no-external-virtual';
  
    FunctionDefinition(node) {
      if (node.visibility == 'external' && node.isVirtual) {
        this.error(node, 'Functions should not be external and virtual');
      }
    }
  },
];
