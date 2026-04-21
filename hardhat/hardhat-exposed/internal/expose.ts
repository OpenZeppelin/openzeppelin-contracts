import type { HardhatConfig } from 'hardhat/types/config';
import type { CompilerOutput, SolidityBuildInfo } from 'hardhat/types/solidity';

// AST manipulation
import type {
  Visibility,
  SourceUnit,
  ContractDefinition,
  FunctionDefinition,
  VariableDeclaration,
  StorageLocation,
  TypeName,
  UserDefinedTypeName,
  ModifierDefinition,
} from 'solidity-ast';
import type { ASTDereferencer } from 'solidity-ast/utils.js';
import { findAll, astDereferencer } from 'solidity-ast/utils.js';

import type { Lines } from './format-lines.ts';
import { formatLines, spaceBetween } from './format-lines.ts';
import assert from 'node:assert';
import path from 'node:path';

const exposedVersionPragma = '>=0.6.0';

type ExposedFile = {
  absolutePath: string;
  content: string;
};

export function getExposed(
  solidityBuildInfo: SolidityBuildInfo,
  solcOutput: CompilerOutput,
  config: HardhatConfig,
): Map<string, string> {
  const res = new Map<string, string>();
  const deref = astDereferencer(solcOutput);

  for (const [sourceName, inputSourceName] of Object.entries(solidityBuildInfo.userSourceNameMap)) {
    const ast = solcOutput.sources[inputSourceName].ast;

    const exposedFile = getExposedFile(sourceName, inputSourceName, ast, deref, config);
    if (exposedFile !== undefined) {
      res.set(exposedFile.absolutePath, exposedFile.content);
    }
  }

  return res;
}

function getImportPathFromExposedContract(
  exposedFileAbsolutePath: string,
  importedFileInputSourceName: string,
): string {
  let importPath: string;

  if (importedFileInputSourceName.startsWith('project/')) {
    importPath = path.relative(
      path.dirname(exposedFileAbsolutePath),
      importedFileInputSourceName.replace(/^project\//, ''),
    );
  } else {
    importPath = importedFileInputSourceName;
  }

  // Normalize windows paths to unix paths
  return importPath.replaceAll(/\\/g, '/');
}

function getExposedFile(
  sourceName: string,
  inputSourceName: string,
  ast: SourceUnit,
  deref: ASTDereferencer,
  config: HardhatConfig,
): ExposedFile | undefined {
  const exposedFileAbsolutePath = path.join(
    config.exposed.outDir,
    inputSourceName.startsWith('project/') ? sourceName : inputSourceName.replace('npm:', ''),
  );

  const content = getExposedContent(
    exposedFileAbsolutePath,
    ast,
    deref,
    config.exposed.prefix,
    config.exposed.initializers,
  );

  return content === undefined ? undefined : { absolutePath: exposedFileAbsolutePath, content };
}

function getExposedContent(
  exposedFileAbsolutePath: string,
  ast: SourceUnit,
  deref: ASTDereferencer,
  prefix: string,
  initializers: boolean,
): string | undefined {
  if (prefix === '' || /^\d|[^0-9a-z_$]/i.test(prefix)) {
    throw new Error(`Prefix '${prefix}' is not valid`);
  }

  const contractPrefix = prefix.replace(/^./, c => c.toUpperCase());

  const imports = Array.from(getNeededImports(ast, deref), u =>
    getImportPathFromExposedContract(exposedFileAbsolutePath, u.absolutePath),
  );

  const contracts = [...findAll('ContractDefinition', ast)].filter(c => c.contractKind !== 'interface');

  if (contracts.length === 0) {
    return undefined;
  }

  return formatLines(
    ...spaceBetween(
      ['// SPDX-License-Identifier: UNLICENSED'],
      [`pragma solidity ${exposedVersionPragma};`],
      imports.map(i => `import "${i}";`),

      ...contracts.map(c => {
        const isLibrary = c.contractKind === 'library';
        const contractHeader = [`contract ${contractPrefix}${c.name}`];
        if (!areFunctionsFullyImplemented(c, deref)) {
          contractHeader.unshift('abstract');
        }
        if (!isLibrary) {
          contractHeader.push(`is ${c.name}`);
        }
        contractHeader.push('{');

        const subset: Visibility[] = isLibrary ? ['internal', 'public', 'external'] : ['internal'];

        const hasReceiveFunction = getFunctions(c, deref, ['external']).some(fn => fn.kind === 'receive');
        const externalizableVariables = getVariables(c, deref, subset).filter(
          v =>
            (v.typeName?.nodeType !== 'UserDefinedTypeName' && v.typeName?.nodeType !== 'ArrayTypeName') ||
            isTypeExternalizable(v.typeName, deref),
        );
        const modifiers = getModifiers(c, deref);
        const externalizableFunctions = getFunctions(c, deref, subset).filter(f => isExternalizable(f, deref));
        const returnedEventFunctions = externalizableFunctions.filter(fn => isNonViewWithReturns(fn));

        // Pre-compute arguments per function/modifier to avoid redundant AST traversals
        const argsCache = new Map<number, Argument[]>();
        for (const fn of externalizableFunctions) {
          argsCache.set(fn.id, getFunctionArguments(fn, c, deref));
        }
        for (const m of modifiers) {
          argsCache.set(m.id, getFunctionArguments(m, c, deref));
        }

        const clashingFunctions: Record<string, number> = {};
        for (const fn of externalizableFunctions) {
          const id = getFunctionIdFromArgs(fn, argsCache.get(fn.id)!);
          clashingFunctions[id] ??= 0;
          clashingFunctions[id] += 1;
        }

        const clashingEvents: Record<string, number> = {};
        for (const fn of returnedEventFunctions) {
          clashingEvents[fn.name] ??= 0;
          clashingEvents[fn.name]! += 1;
        }

        const allStorageArgs = getAllStorageArgumentsFromCache([...externalizableFunctions, ...modifiers], argsCache);

        return [
          contractHeader.join(' '),
          [`bytes32 public constant __hh_exposed_bytecode_marker = "hardhat-exposed";\n`],
          spaceBetween(
            // slots for storage function parameters
            ...allStorageArgs.map(a => [`mapping(uint256 => ${a.storageType}) internal ${prefix}${a.storageVar};`]),
            // events for internal returns
            ...returnedEventFunctions.map(fn => {
              const fnArgs = argsCache.get(fn.id)!;
              const evName =
                clashingEvents[fn.name] === 1 ? fn.name : getFunctionNameQualifiedFromArgs(fn, fnArgs, false);
              const params = getFunctionReturnParameters(fn, c, deref, null);
              return [`event return${prefix}${evName}(${params.map(printArgument).join(', ')});`];
            }),
            // constructor
            makeConstructor(c, deref, initializers),
            // accessor to internal variables
            ...externalizableVariables.map(v => {
              const varArgs = getVarGetterArgs(v, c, deref);
              return [
                [
                  'function',
                  `${prefix}${v.name}(${varArgs.map(printArgument).join(', ')})`,
                  'external',
                  v.mutability === 'mutable' || (v.mutability === 'immutable' && !v.value) ? 'view' : 'pure',
                  'returns',
                  `(${getVarGetterReturnType(v, c, deref)})`,
                  '{',
                ].join(' '),
                [`return ${isLibrary ? c.name + '.' : ''}${v.name}${varArgs.map(a => `[${a.name}]`).join('')};`],
                '}',
              ];
            }),
            // modifiers
            ...modifiers.map(m => {
              const fnArgs = argsCache.get(m.id)!;

              // function header
              const header = [
                'function',
                `${prefix}${m.name}(${fnArgs.map(printArgument).join(', ')})`,
                'external',
                'payable',
                `${m.name}(${fnArgs.map(a => (a.storageVar ? `${prefix}${a.storageVar}[${a.name}]` : a.name)).join(', ')})`,
                '{}',
              ];

              return [header.join(' ')];
            }),
            // external functions
            ...externalizableFunctions.map(fn => {
              const fnArgs = argsCache.get(fn.id)!;
              const fnName =
                clashingFunctions[getFunctionIdFromArgs(fn, fnArgs)] === 1
                  ? fn.name
                  : getFunctionNameQualifiedFromArgs(fn, fnArgs, true);
              const fnRets = getFunctionReturnParameters(fn, c, deref);
              const evName =
                isNonViewWithReturns(fn) &&
                (clashingEvents[fn.name] === 1 ? fn.name : getFunctionNameQualifiedFromArgs(fn, fnArgs, false));

              // function header
              const header = ['function', `${prefix}${fnName}(${fnArgs.map(printArgument)})`, 'external'];

              if (fn.stateMutability === 'nonpayable') {
                header.push('payable');
              } else if (fn.stateMutability === 'pure' && fnArgs.some(a => a.storageVar)) {
                header.push('view');
              } else {
                header.push(fn.stateMutability);
              }

              if (fn.returnParameters.parameters.length > 0) {
                header.push(`returns (${fnRets.map(printArgument).join(', ')})`);
              }

              header.push('{');

              // function body
              const body = [
                (fnRets.length === 0 ? '' : `(${fnRets.map(p => p.name).join(', ')}) = `) +
                  `${isLibrary ? c.name : 'super'}.${fn.name}(${fnArgs.map(a => (a.storageVar ? `${prefix}${a.storageVar}[${a.name}]` : a.name))});`,
              ];

              if (evName) {
                body.push(`emit return${prefix}${evName}(${fnRets.map(p => p.name).join(', ')});`);
              }

              // return function
              return [header.join(' '), body, `}`];
            }),
            // receive function
            !hasReceiveFunction ? ['receive() external payable {}'] : [],
          ),
          `}`,
        ];
      }),
    ),
  );
}

// Note this is not the same as contract.fullyImplemented, because this does
// not consider missing constructor calls. We don't use contract.abstract
// because even if a user declares a contract abstract, we want to make it
// concrete if it is possible.
function areFunctionsFullyImplemented(contract: ContractDefinition, deref: ASTDereferencer): boolean {
  const parents = contract.linearizedBaseContracts.map(deref('ContractDefinition'));
  const abstractFunctionIds = new Set(
    parents.flatMap(p => [...findAll('FunctionDefinition', p)].filter(f => !f.implemented).map(f => f.id)),
  );
  for (const p of parents) {
    for (const f of findAll(['FunctionDefinition', 'VariableDeclaration'], p)) {
      for (const b of f.baseFunctions ?? []) {
        abstractFunctionIds.delete(b);
      }
    }
  }
  return abstractFunctionIds.size === 0;
}

function getFunctionIdFromArgs(fn: FunctionDefinition, args: Argument[]): string {
  return fn.name + args.map(a => a.abiType).join(',');
}

function getFunctionNameQualifiedFromArgs(fn: FunctionDefinition, args: Argument[], onlyConflicting: boolean): string {
  let filtered = args;
  if (onlyConflicting) {
    filtered = args.filter(a => a.type !== a.abiType || a.storageType !== undefined);
  }
  return (
    fn.name +
    filtered
      .map(arg => arg.storageType ?? arg.type)
      .map(type => type.replace(/ .*/, '').replace(/[^0-9a-zA-Z$_]+/g, '_')) // sanitize
      .join('_')
      .replace(/^./, '_$&')
  );
}

function makeConstructor(contract: ContractDefinition, deref: ASTDereferencer, initializers: boolean): Lines[] {
  const parents = contract.linearizedBaseContracts.map(deref('ContractDefinition')).reverse();

  const constructors = new Map(
    parents
      .map(p => getConstructor(p, initializers))
      .filter(notNull)
      .map(c => [c.scope, c]),
  );

  const initializedParents = new Set<number>();

  for (const p of parents) {
    for (const c of p.baseContracts) {
      if (c.arguments?.length) {
        initializedParents.add(c.baseName.referencedDeclaration);
      }
    }

    const ctor = constructors.get(p.id);

    if (ctor) {
      if (ctor.kind === 'constructor') {
        for (const m of ctor.modifiers) {
          if (m.modifierName.referencedDeclaration != undefined) {
            initializedParents.add(m.modifierName.referencedDeclaration);
          }
        }
      }

      if (initializers) {
        for (const fnCall of findAll('FunctionCall', ctor)) {
          if (fnCall.expression.nodeType === 'Identifier' && isInitializerName(fnCall.expression.name, 'any')) {
            const fnDef = deref('FunctionDefinition', fnCall.expression.referencedDeclaration!);
            if (fnDef.scope !== p.id) {
              initializedParents.add(fnDef.scope);
            }
          }
        }
      }
    }
  }

  const uninitializedParents = parents.filter(
    c => c.contractKind === 'contract' && constructors.has(c.id) && !initializedParents.has(c.id),
  );

  const missingArguments = new Map<string, string>(); // name -> type
  const parentArguments = new Map<string, string[]>();

  for (const c of uninitializedParents) {
    const args = [];
    for (const a of constructors.get(c.id)?.parameters.parameters ?? []) {
      const name = missingArguments.has(a.name) ? `${c.name}_${a.name}` : a.name;
      const type = getVarType(a, c, deref, 'memory');
      missingArguments.set(name, type);
      args.push(name);
    }
    parentArguments.set(c.name, args);
  }

  const parentConstructorCalls = [];
  const parentInitializerCalls = [];

  for (const p of uninitializedParents) {
    const ctor = constructors.get(p.id);
    if (ctor) {
      const params = mustGet(parentArguments, p.name).join(', ');
      if (ctor.kind === 'constructor') {
        if (ctor.parameters.parameters.length) {
          parentConstructorCalls.push(`${p.name}(${params})`);
        }
      } else {
        parentInitializerCalls.push(`${ctor.name}(${params})`);
      }
    }
  }

  return [
    [
      `constructor(${[...missingArguments].map(([name, type]) => `${type} ${name}`).join(', ')})`,
      ...parentConstructorCalls,
      ...(parentInitializerCalls.length ? ['initializer'] : []),
      'payable',
      '{',
    ].join(' '),
    parentInitializerCalls.map(e => `${e};`),
    '}',
  ];
}

function getConstructor(contract: ContractDefinition, initializers: boolean): FunctionDefinition | undefined {
  let ctor;
  let init;

  for (const fnDef of findAll('FunctionDefinition', contract)) {
    if (fnDef.kind === 'constructor') {
      ctor = fnDef;
      if (!initializers) break;
    }
    if (initializers && isInitializerName(fnDef.name)) {
      init = fnDef;
      if (ctor) break;
    }
  }
  return init || ctor;
}

function isInitializerName(fnName: string, kind?: 'unchained' | 'any'): boolean {
  const m = fnName.match(/^__[a-zA-Z0-9$_]+_init(_unchained)?$/);
  const isUnchained = m?.[1] === '_unchained';
  const wantsUnchained = kind === 'unchained';
  return m !== null && (kind === 'any' || isUnchained === wantsUnchained);
}

function notNull<T>(value: T): value is NonNullable<T> {
  return value != undefined;
}

function isExternalizable(fnDef: FunctionDefinition, deref: ASTDereferencer): boolean {
  return (
    fnDef.kind !== 'constructor' &&
    fnDef.visibility !== 'private' &&
    fnDef.implemented &&
    !fnDef.parameters.parameters.some(p => p.typeName?.nodeType === 'FunctionTypeName') &&
    fnDef.returnParameters.parameters.every(p => isTypeExternalizable(p.typeName, deref))
  );
}

function isTypeExternalizable(typeName: TypeName | null | undefined, deref: ASTDereferencer): boolean {
  if (typeName == undefined) {
    return true;
  } else if (typeName.nodeType === 'UserDefinedTypeName') {
    const typeDef = derefUserDefinedTypeName(deref, typeName);
    if (typeDef.nodeType !== 'StructDefinition') {
      return true;
    } else {
      return typeDef.members.every(m => isTypeExternalizable(m.typeName, deref));
    }
  } else if (typeName.nodeType === 'ArrayTypeName' && typeName.length != undefined) {
    const value = typeName.length.typeDescriptions.typeIdentifier?.match(/^t_rational_([^_]*)_by_1$/)?.[1];
    return value !== undefined && parseInt(value) < 2 ** 27;
  } else {
    return typeName.nodeType !== 'Mapping' && typeName.nodeType !== 'FunctionTypeName';
  }
}

function isNonViewWithReturns(fnDef: FunctionDefinition): boolean {
  return ['payable', 'nonpayable'].includes(fnDef.stateMutability) && fnDef.returnParameters.parameters.length > 0;
}

interface Argument {
  type: string;
  name: string;
  abiType: string;
  storageVar?: string;
  storageType?: string;
}

const printArgument = (arg: Argument) => `${arg.type} ${arg.name}`;

function getFunctionArguments(
  fnDef: FunctionDefinition | ModifierDefinition,
  context: ContractDefinition,
  deref: ASTDereferencer,
): Argument[] {
  return fnDef.parameters.parameters.map((p, i) => {
    const name = p.name || `arg${i}`;
    if (p.storageLocation === 'storage') {
      const storageType = getVarType(p, context, deref, null);
      const storageVar = 'v_' + storageType.replace(/[^0-9a-zA-Z$_]+/g, '_');
      // The argument is an index to an array in storage.
      const type = 'uint256';
      return { name, type, abiType: type, storageVar, storageType };
    } else {
      const type = getVarType(p, context, deref, 'calldata');
      const abiType = getVarAbiType(p, context, deref, 'calldata');
      return { name, type, abiType };
    }
  });
}

function getAllStorageArgumentsFromCache(
  fns: (FunctionDefinition | ModifierDefinition)[],
  argsCache: Map<number, Argument[]>,
): Required<Argument>[] {
  const storageArgs = fns.flatMap(fn =>
    (argsCache.get(fn.id) ?? []).filter((a): a is Required<Argument> => !!(a.storageVar && a.storageType)),
  );
  return [...new Map(storageArgs.map(a => [a.storageVar, a])).values()];
}

function getFunctionReturnParameters(
  fnDef: FunctionDefinition,
  context: ContractDefinition,
  deref: ASTDereferencer,
  location: StorageLocation | null = 'memory',
): Argument[] {
  return fnDef.returnParameters.parameters.map((p, i) => {
    const name = p.name || `ret${i}`;
    const type = getVarType(p, context, deref, location);
    const abiType = getVarAbiType(p, context, deref, location);
    return { name, type, abiType };
  });
}

function getVarType(
  varDecl: VariableDeclaration,
  context: ContractDefinition,
  deref: ASTDereferencer,
  location: StorageLocation | null = varDecl.storageLocation,
): string {
  if (!varDecl.typeName) {
    throw new Error('Missing type information');
  }
  return getType(varDecl.typeName, context, deref, location);
}

function getType(
  typeName: TypeName,
  context: ContractDefinition,
  deref: ASTDereferencer,
  location: StorageLocation | null,
): string {
  const { typeString, typeIdentifier } = typeName.typeDescriptions;
  if (typeof typeString !== 'string' || typeof typeIdentifier !== 'string') {
    throw new Error('Missing type information');
  }

  let type =
    typeString.replace(/^(struct|enum|contract) /, '') +
    (typeIdentifier.endsWith('_ptr') && location ? ` ${location}` : '');

  const typeScopeMatch = type.match(/^([a-zA-Z0-9_$]+)\./);
  if (context.contractKind !== 'library' && typeScopeMatch) {
    const [, typeScope] = typeScopeMatch;

    const isScopeImplicit = context.linearizedBaseContracts.some(
      c => deref('ContractDefinition', c).name === typeScope,
    );

    if (isScopeImplicit) {
      type = type.replace(`${typeScope}.`, '');
    }
  }

  return type;
}

function getVarAbiType(
  varDecl: VariableDeclaration,
  context: ContractDefinition,
  deref: ASTDereferencer,
  location: StorageLocation | null = varDecl.storageLocation,
): string {
  if (!varDecl.typeName) {
    throw new Error('Missing type information');
  }
  return getAbiType(varDecl.typeName, context, deref, location);
}

function getAbiType(
  typeName: TypeName,
  context: ContractDefinition,
  deref: ASTDereferencer,
  location: StorageLocation | null,
): string {
  switch (typeName.nodeType) {
    case 'ElementaryTypeName':
    case 'ArrayTypeName':
      const { typeString } = typeName.typeDescriptions;
      assert(typeString != undefined);
      return typeString;

    case 'UserDefinedTypeName':
      const typeDef = derefUserDefinedTypeName(deref, typeName);
      switch (typeDef.nodeType) {
        case 'UserDefinedValueTypeDefinition':
          const { typeString } = typeDef.underlyingType.typeDescriptions;
          assert(typeString != undefined);
          return typeString;

        case 'EnumDefinition':
          assert(typeDef.members.length < 256);
          return 'uint8';

        case 'ContractDefinition':
          return 'address';

        case 'StructDefinition':
          if (location === 'storage') {
            throw new Error('Unexpected error'); // is treated separately in getFunctionArguments
          } else {
            return '(' + typeDef.members.map(v => getVarAbiType(v, context, deref, location)).join(',') + ')';
          }
      }

    default:
      throw new Error('Unknown ABI type');
  }
}

function getVariables(
  contract: ContractDefinition,
  deref: ASTDereferencer,
  subset?: Visibility[],
): VariableDeclaration[] {
  const parents = contract.linearizedBaseContracts.map(deref('ContractDefinition'));

  const res = [];

  for (const parent of parents) {
    for (const v of findAll('VariableDeclaration', parent)) {
      if (v.stateVariable && (!subset || subset.includes(v.visibility))) {
        res.push(v);
      }
    }
  }

  return res;
}

function getVarGetterArgs(v: VariableDeclaration, context: ContractDefinition, deref: ASTDereferencer): Argument[] {
  if (!v.typeName) {
    throw new Error('missing typenName');
  }
  const types = [];
  for (let t = v.typeName; t.nodeType === 'Mapping'; t = t.valueType) {
    types.push({
      name: `arg${types.length}`,
      type: getType(t.keyType, context, deref, 'memory'),
      abiType: getAbiType(t.keyType, context, deref, 'memory'),
    });
  }
  return types;
}

function getVarGetterReturnType(v: VariableDeclaration, context: ContractDefinition, deref: ASTDereferencer): string {
  if (!v.typeName) {
    throw new Error('missing typenName');
  }
  let t = v.typeName;
  while (t.nodeType === 'Mapping') {
    t = t.valueType;
  }
  return getType(t, context, deref, 'memory');
}

function getFunctions(
  contract: ContractDefinition,
  deref: ASTDereferencer,
  subset?: Visibility[],
): FunctionDefinition[] {
  const parents = contract.linearizedBaseContracts.map(deref('ContractDefinition'));

  const overridden = new Set<number>();
  const res = [];

  for (const parent of parents) {
    for (const fn of findAll('FunctionDefinition', parent)) {
      if (!overridden.has(fn.id) && (!subset || subset.includes(fn.visibility))) {
        res.push(fn);
      }
      for (const b of fn.baseFunctions ?? []) {
        overridden.add(b);
      }
    }
  }

  return res;
}

function getModifiers(contract: ContractDefinition, deref: ASTDereferencer): ModifierDefinition[] {
  const parents = contract.linearizedBaseContracts.map(deref('ContractDefinition'));

  const overridden = new Set<number>();
  const res = [];

  for (const parent of parents) {
    for (const m of findAll('ModifierDefinition', parent)) {
      if (!overridden.has(m.id)) {
        res.push(m);
      }
      for (const b of m.baseModifiers ?? []) {
        overridden.add(b);
      }
    }
  }

  return res;
}

function* getNeededImports(ast: SourceUnit, deref: ASTDereferencer): Iterable<SourceUnit> {
  const needed = new Set<SourceUnit>(
    [ast].concat(
      [...findAll('ContractDefinition', ast)].flatMap(c =>
        c.linearizedBaseContracts.map(p => {
          const { sourceUnit } = deref.withSourceUnit('ContractDefinition', p);
          return sourceUnit;
        }),
      ),
    ),
  );

  for (const n of needed) {
    yield n;

    for (const imp of findAll('ImportDirective', n)) {
      if (imp.symbolAliases.length > 0) {
        needed.add(deref('SourceUnit', imp.sourceUnit));
      }
    }
  }
}

function mustGet<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error('Key not found');
  }
  return value;
}

function derefUserDefinedTypeName(deref: ASTDereferencer, typeName: UserDefinedTypeName) {
  return deref(
    ['StructDefinition', 'EnumDefinition', 'ContractDefinition', 'UserDefinedValueTypeDefinition'],
    typeName.referencedDeclaration,
  );
}
