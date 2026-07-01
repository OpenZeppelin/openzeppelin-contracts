import path from 'path';
import { ContractDefinition, SourceUnit } from 'solidity-ast';
import { SolcOutput, SolcInput } from 'solidity-ast/solc';
import { astDereferencer, ASTDereferencer, findAll, isNodeType, srcDecoder, SrcDecoder } from 'solidity-ast/utils.js';
import { FullConfig } from './config';
import { DocItem, docItemTypes, isDocItem } from './doc-item';
import { Properties } from './templates';
import { clone } from './utils/clone';
import { isChild } from './utils/is-child';
import { mapValues } from './utils/map-values';
import { defineGetterMemoized } from './utils/memoized-getter';

export interface Build {
  input: SolcInput;
  output: SolcOutput;
}

export interface BuildContext extends Build {
  deref: ASTDereferencer;
  decodeSrc: SrcDecoder;
}

export type SiteConfig = Pick<FullConfig, 'pages' | 'exclude' | 'sourcesDir' | 'pageExtension'>;
export type PageStructure = SiteConfig['pages'];
export type PageAssigner = (item: DocItem, file: SourceUnit, config: SiteConfig) => string | undefined;

export const pageAssigner: Record<PageStructure & string, PageAssigner> = {
  single: (_1, _2, { pageExtension: ext }) => 'index' + ext,
  items: (item, _, { pageExtension: ext }) => item.name + ext,
  files: (_, file, { pageExtension: ext, sourcesDir }) =>
    path.relative(sourcesDir, file.absolutePath).replace('.sol', ext),
};

export interface Site {
  items: DocItemWithContext[];
  pages: Page[];
}

export interface Page {
  id: string;
  items: DocItemWithContext[];
}

export const DOC_ITEM_CONTEXT = '__item_context' as const;
export type DocItemWithContext = DocItem & { [DOC_ITEM_CONTEXT]: DocItemContext };

export interface DocItemContext {
  page?: string;
  item: DocItemWithContext;
  contract?: ContractDefinition;
  file: DocItemContextFile;
  build: BuildContext;
}

export interface DocItemContextFile extends SourceUnit {
  relativePath: string;
}

export function buildSite(builds: Build[], siteConfig: SiteConfig, properties: Properties = {}): Site {
  const assign = typeof siteConfig.pages === 'string' ? pageAssigner[siteConfig.pages] : siteConfig.pages;

  const seen = new Set<string>();
  const items: DocItemWithContext[] = [];
  const pages: Record<string, DocItemWithContext[]> = {};

  for (let { input, output } of builds) {
    // Clone because we will mutate in order to add item context.
    output = { ...output, sources: clone(output.sources) };

    const deref = astDereferencer(output);
    const decodeSrc = srcDecoder(input, output);
    const build = { input, output, deref, decodeSrc };

    for (const { ast } of Object.values(output.sources)) {
      const isNewFile = !seen.has(ast.absolutePath);
      seen.add(ast.absolutePath);

      const relativePath = path.relative(siteConfig.sourcesDir, ast.absolutePath);
      const file = Object.assign(ast, { relativePath });

      for (const topLevelItem of file.nodes) {
        if (!isDocItem(topLevelItem)) continue;

        const page = assignIfIncludedSource(assign, topLevelItem, file, siteConfig);

        const withContext = defineContext(topLevelItem, build, file, page);
        defineProperties(withContext, properties);

        if (isNewFile && page !== undefined) {
          (pages[page] ??= []).push(withContext);
          items.push(withContext);
        }

        if (!isNodeType('ContractDefinition', topLevelItem)) {
          continue;
        }

        for (const item of topLevelItem.nodes) {
          if (!isDocItem(item)) continue;
          if (isNewFile && page !== undefined) items.push(item as DocItemWithContext);
          const contract = topLevelItem.nodeType === 'ContractDefinition' ? topLevelItem : undefined;
          const withContext = defineContext(item, build, file, page, contract);
          defineProperties(withContext, properties);
        }
      }
    }
  }

  return {
    items,
    pages: Object.entries(pages).map(([id, pageItems]) => ({ id, items: pageItems })),
  };
}

function defineContext(
  item: DocItem,
  build: BuildContext,
  file: DocItemContextFile,
  page?: string,
  contract?: ContractDefinition,
): DocItemWithContext {
  return Object.assign(item, {
    [DOC_ITEM_CONTEXT]: { build, file, contract, page, item: item as DocItemWithContext },
  });
}

function defineProperties(item: DocItemWithContext, properties: Properties) {
  for (const [prop, fn] of Object.entries(properties)) {
    const original: unknown = (item as any)[prop];
    defineGetterMemoized(item as any, prop, () => fn(item.__item_context, original));
  }
}

function assignIfIncludedSource(assign: PageAssigner, item: DocItem, file: DocItemContextFile, config: SiteConfig) {
  return isFileIncluded(file.absolutePath, config) ? assign(item, file, config) : undefined;
}

function isFileIncluded(file: string, config: SiteConfig) {
  return isChild(file, config.sourcesDir) && config.exclude.every(e => !isChild(file, path.join(config.sourcesDir, e)));
}
