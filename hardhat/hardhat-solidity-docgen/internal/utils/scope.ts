import { ContractDefinition, SourceUnit } from 'solidity-ast';
import { findAll, isNodeType } from 'solidity-ast/utils.js';
import { DocItemWithContext } from '../site';
import { filterValues, mapValues } from './map-values';
import { mapKeys } from './map-keys';

type Definition = SourceUnit['nodes'][number] & { name: string };
type Scope = { [name in string]: () => { namespace: Scope } | { definition: Definition } };

export function getContractsInScope(item: DocItemWithContext) {
  const cache = new WeakMap<SourceUnit, Scope>();

  return filterValues(flattenScope(run(item.__item_context.file)), isNodeType('ContractDefinition'));

  function run(file: SourceUnit): Scope {
    if (cache.has(file)) {
      return cache.get(file)!;
    }

    const scope: Scope = {};

    cache.set(file, scope);

    for (const c of file.nodes) {
      if ('name' in c) {
        scope[c.name] = () => ({ definition: c });
      }
    }

    for (const i of findAll('ImportDirective', file)) {
      const importedFile = item.__item_context.build.deref('SourceUnit', i.sourceUnit);
      const importedScope = run(importedFile);
      if (i.unitAlias) {
        scope[i.unitAlias] = () => ({ namespace: importedScope });
      } else if (i.symbolAliases.length === 0) {
        Object.assign(scope, importedScope);
      } else {
        for (const a of i.symbolAliases) {
          // Delayed function call supports circular dependencies
          scope[a.local ?? a.foreign.name] = importedScope[a.foreign.name] ?? (() => importedScope[a.foreign.name]!());
        }
      }
    }

    return scope;
  }
}

function flattenScope(scope: Scope): Record<string, Definition> {
  return Object.fromEntries(
    Object.entries(scope).flatMap(([k, fn]) => {
      const v = fn();
      if ('definition' in v) {
        return [[k, v.definition] as const];
      } else {
        return Object.entries(mapKeys(flattenScope(v.namespace), k2 => k + '.' + k2));
      }
    }),
  );
}
