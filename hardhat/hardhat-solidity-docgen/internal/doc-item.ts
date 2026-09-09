import { ContractDefinition, ImportDirective, PragmaDirective, SourceUnit, UsingForDirective } from 'solidity-ast';
import { Node } from 'solidity-ast/node';
import { AssertEqual } from './utils/assert-equal-types';

export type DocItem = Exclude<
  SourceUnit['nodes'][number] | ContractDefinition['nodes'][number],
  ImportDirective | PragmaDirective | UsingForDirective
>;

export const docItemTypes = [
  'ContractDefinition',
  'EnumDefinition',
  'ErrorDefinition',
  'EventDefinition',
  'FunctionDefinition',
  'ModifierDefinition',
  'StructDefinition',
  'UserDefinedValueTypeDefinition',
  'VariableDeclaration',
] as const;

// Make sure at compile time that docItemTypes contains exactly the node types of DocItem.
const _: AssertEqual<(typeof docItemTypes)[number], DocItem['nodeType']> = true;

export function isDocItem(node: Node): node is DocItem {
  return (docItemTypes as readonly string[]).includes(node.nodeType);
}
