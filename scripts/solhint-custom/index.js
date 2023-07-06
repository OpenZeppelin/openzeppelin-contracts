class OpenZeppelinCustom {
  constructor(reporter, config) {
    this.ruleId = 'custom';

    this.reporter = reporter;
    this.config = config;
  }

  VariableDeclaration(node) {
    if (!node.isStateVar) {
      return;
    }

    if (node.visibility != 'private') {
      this.reporter.error(
        node,
        this.ruleId,
        'State variables must be private.',
        fixer => {
          return fixer.replaceTextRange(
            [node.typeName.range[1] + 1, node.identifier.range[0] - 1],
            ' private '
          );
        }
      );
      if (node.name[0] != '_') {
        this.reporter.error(
          node,
          this.ruleId,
          'Private and internal variables must be prefixed with underscore.',
          fixer => {
            return fixer.replaceTextRange(
              node.identifier.range,
              '_' + node.identifier.name
            );
          }
        );
      }
    }

    if (
      (node.visibility == 'private' || node.visibility == 'internal') &&
      node.name[0] != '_'
    ) {
      this.reporter.error(
        node,
        this.ruleId,
        'Private and internal variables must be prefixed with underscore.',
        fixer => {
          return fixer.replaceTextRange(
            node.identifier.range,
            '_' + node.identifier.name
          );
        }
      );
    }
  }

  FunctionDefinition(node) {
    if (node.visibility == 'external' && node.isVirtual) {
      this.reporter.error(
        node,
        this.ruleId,
        "Functions can't be external and virtual."
      );
    }

    if (
      (node.visibility == 'internal' || node.visibility == 'private') &&
      node.name[0] != '_'
    ) {
      this.reporter.error(
        node,
        this.ruleId,
        'Private and internal functions must be prefixed with underscore.',
        fixer => {
          return fixer.replaceTextRange(
            [node.range[0] + 9, node.range[0] + 8 + node.name.length],
            '_' + node.name
          );
        }
      );
    }
  }

  ContractDefinition(node) {
    if (node.kind == 'interface' && node.name[0] != 'I') {
      this.reporter.error(
        node,
        this.ruleId,
        'Interfaces names should have a capital I prefix.',
        fixer => {
          return fixer.replaceTextRange(
            [node.range[0] + 10, node.range[0] + 10 + node.name.length],
            'I' + node.name + ' '
          );
        }
      );
    }
  }
}

module.exports = [OpenZeppelinCustom];
