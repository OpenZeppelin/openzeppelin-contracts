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
    static ruleId = 'interface-names';

    ContractDefinition(node) {
      if (node.kind === 'interface' && !/^I[A-Z]/.test(node.name)) {
        this.error(node, 'Interface names should have a capital I prefix');
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
      if (node.isDeclaredConst) {
        if (/^_/.test(node.name)) {
          // TODO: re-enable and fix
          // this.error(node, 'Constant variables should not have leading underscore');
        }
      } else if (node.visibility === 'private' && !/^_/.test(node.name)) {
        this.error(node, 'Non-constant private variables must have leading underscore');
      }
    }

    FunctionDefinition(node) {
      if (node.visibility === 'private' || (node.visibility === 'internal' && node.parent.kind !== 'library')) {
        if (!/^_/.test(node.name)) {
          this.error(node, 'Private and internal functions must have leading underscore');
        }
      }
      if (node.visibility === 'internal' && node.parent.kind === 'library') {
        if (/^_/.test(node.name)) {
          this.error(node, 'Library internal functions should not have leading underscore');
        }
      }
    }
  },

  // TODO: re-enable and fix
  // class extends Base {
  //   static ruleId = 'no-external-virtual';
  //
  //   FunctionDefinition(node) {
  //     if (node.visibility == 'external' && node.isVirtual) {
  //       this.error(node, 'Functions should not be external and virtual');
  //     }
  //   }
  // },

  class extends Base {
    static ruleId = 'custom-error-domains';

    ContractDefinition(node) {
      if (node && node.subNodes) {
        const customErrors = node.subNodes.filter((x) => x.type === 'CustomErrorDefinition');
        if (customErrors.length == 0) return;
        const contractNames = [node.name];

        if (node.baseContracts && node.baseContracts.length > 0) {
          for (const inheritanceSpecifier of node.baseContracts) {
            contractNames.push(inheritanceSpecifier.baseName.namePath);
          }
        }

        const domains = contractNames.map(this._getDomainFromContractName);
        for (const customError of customErrors) {
          let foundDomain = false;
          for (const domain of domains) {
            if (customError.name.startsWith(domain)) {
              foundDomain = true;
              break;
            }
          } 
          
          if (!foundDomain) {
            this.error(customError, 'Custom errors should contain corresponding domain prefix');
          }
        }
      }
    }

    _getDomainFromContractName(contractName) {
      let domainName = contractName;

      if (/^I[A-Z]/.test(domainName)) {
        domainName = contractName.substring(1);
      }

      if (/^ERC\d+/.test(domainName)) {
        domainName = domainName.match(/^ERC\d+/)[0];
      }

      return domainName;
    }
  },
];
