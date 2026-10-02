import { FunctionDefinition } from 'solidity-ast';
import { findAll } from 'solidity-ast/utils.js';
import { DocItemWithContext, DOC_ITEM_CONTEXT } from '../site';
import { arraysEqual } from './arrays-equal';
import { execAll } from './execall';
import { itemType } from './item-type';
import { ItemError } from './ItemError';
import { readItemDocs } from './read-item-docs';
import { getContractsInScope } from './scope';

export interface NatSpec {
  title?: string;
  notice?: string;
  dev?: string;
  params?: {
    name: string;
    description: string;
  }[];
  returns?: {
    name?: string;
    description: string;
  }[];
  custom?: {
    [tag: string]: string;
  };
}

export function parseNatspec(item: DocItemWithContext): NatSpec {
  if (!item[DOC_ITEM_CONTEXT]) throw new Error(`Not an item or item is missing context`);

  let res: NatSpec = {};

  const docSource = readItemDocs(item);
  const docString =
    docSource !== undefined
      ? cleanUpDocstringFromSource(docSource)
      : 'documentation' in item && item.documentation
        ? typeof item.documentation === 'string'
          ? item.documentation
          : cleanUpDocstringFromSolc(item.documentation.text)
        : '';

  const tagMatches = execAll(
    /^(?:@(\w+|custom:[a-z][a-z-]*) )?((?:(?!^@(?:\w+|custom:[a-z][a-z-]*) )[^])*)/m,
    docString,
  );

  let inheritFrom: FunctionDefinition | undefined;

  for (const [, tag = 'notice', content] of tagMatches) {
    if (content === undefined) throw new ItemError('Unexpected error', item);

    if (tag === 'dev' || tag === 'notice') {
      res[tag] ??= '';
      res[tag] += content;
    }

    if (tag === 'title') {
      res.title = content.trim();
    }

    if (tag === 'param') {
      const paramMatches = content.match(/(\w+) ([^]*)/);
      if (paramMatches) {
        const [, name, description] = paramMatches as [string, string, string];
        res.params ??= [];
        res.params.push({ name, description: description.trim() });
      }
    }

    if (tag === 'return') {
      if (!('returnParameters' in item)) {
        throw new ItemError(`Item does not contain return parameters`, item);
      }
      res.returns ??= [];
      const i = res.returns.length;
      const p = item.returnParameters.parameters[i];
      if (p === undefined) {
        throw new ItemError('Got more @return tags than expected', item);
      }
      if (!p.name) {
        res.returns.push({ description: content.trim() });
      } else {
        const paramMatches = content.match(/(\w+)( ([^]*))?/);
        if (!paramMatches || paramMatches[1] !== p.name) {
          throw new ItemError(`Expected @return tag to start with name '${p.name}'`, item);
        }
        const [, name, description] = paramMatches as [string, string, string?];
        res.returns.push({ name, description: description?.trim() ?? '' });
      }
    }

    if (tag?.startsWith('custom:')) {
      const key = tag.replace(/^custom:/, '');
      res.custom ??= {};
      res.custom[key] ??= '';
      res.custom[key] += content;
    }

    if (tag === 'inheritdoc') {
      if (!(item.nodeType === 'FunctionDefinition' || item.nodeType === 'VariableDeclaration')) {
        throw new ItemError(`Expected function or variable but saw ${itemType(item)}`, item);
      }
      const parentContractName = content.trim();
      const parentContract = getContractsInScope(item)[parentContractName];
      if (!parentContract) {
        throw new ItemError(`Parent contract '${parentContractName}' not found`, item);
      }
      inheritFrom = [...findAll('FunctionDefinition', parentContract)].find(f => item.baseFunctions?.includes(f.id));
    }
  }

  if (docString.length === 0) {
    if ('baseFunctions' in item && item.baseFunctions?.length === 1) {
      const baseFn = item[DOC_ITEM_CONTEXT].build.deref('FunctionDefinition', item.baseFunctions[0]!);
      const shouldInherit =
        item.nodeType === 'VariableDeclaration' ||
        arraysEqual(item.parameters.parameters, baseFn.parameters.parameters, p => p.name);
      if (shouldInherit) {
        inheritFrom = baseFn;
      }
    }
  }

  if (res.dev) res.dev = res.dev.trim();
  if (res.notice) res.notice = res.notice.trim();

  if (inheritFrom) {
    res = { ...parseNatspec(inheritFrom as DocItemWithContext), ...res };
  }

  return res;
}

// Fix solc buggy parsing of doc comments.
// Reverse engineered from solc behavior.
function cleanUpDocstringFromSolc(text: string) {
  return text.replace(/\n\n?^[ \t]*(?:\*|\/\/\/)/gm, '\n\n').replace(/^[ \t]?/gm, '');
}

function cleanUpDocstringFromSource(text: string) {
  return text
    .replace(/^\/\*\*(.*)\*\/$/s, '$1')
    .trim()
    .replace(/^[ \t]*(\*|\/\/\/)[ \t]?/gm, '');
}
