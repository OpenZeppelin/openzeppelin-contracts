import { createRequire } from 'node:module';
import path from 'node:path';
import fs, { promises as fsPromise } from 'node:fs';
import { mapKeys } from './utils/map-keys';
import { DocItemContext } from './site';

const require = createRequire(import.meta.url);

import * as defaultProperties from './common/properties';

export type PropertyGetter = (ctx: DocItemContext, original?: unknown) => unknown;
export type Properties = Record<string, PropertyGetter>;

export interface Templates {
  partials?: Record<string, () => string>;
  helpers?: Record<string, (...args: unknown[]) => string>;
  properties?: Record<string, PropertyGetter>;
}

/**
 * Loads the templates that will be used for rendering a site based on a
 * default theme and user templates.
 *
 * The result contains all partials, helpers, and property getters defined in
 * the user templates and the default theme, where the user's take precedence
 * if there is a clash. Additionally, all theme partials and helpers are
 * included with the theme prefix, e.g. `markdown/contract` will be a partial.
 */
export async function loadTemplates(
  defaultTheme: string,
  root: string,
  userTemplatesPath?: string,
): Promise<Templates> {
  const themes = await readThemes();

  // Initialize templates with the default theme.
  const templates: Required<Templates> = {
    partials: { ...themes[defaultTheme]?.partials },
    helpers: { ...themes[defaultTheme]?.helpers },
    properties: { ...defaultProperties },
  };

  // Overwrite default theme with user templates.
  if (userTemplatesPath) {
    const userTemplates = await readTemplates(path.resolve(root, userTemplatesPath));
    Object.assign(templates.partials, userTemplates.partials);
    Object.assign(templates.helpers, userTemplates.helpers);
    Object.assign(templates.properties, userTemplates.properties);
  }

  // Add partials and helpers from all themes, prefixed with the theme name.
  for (const [themeName, theme] of Object.entries(themes)) {
    const addPrefix = (k: string) => `${themeName}/${k}`;
    Object.assign(templates.partials, mapKeys(theme.partials, addPrefix));
    Object.assign(templates.helpers, mapKeys(theme.helpers, addPrefix));
  }

  return templates;
}

/**
 * Read templates and helpers from a directory.
 */
export async function readTemplates(partialsDir: string, helpersDir = partialsDir): Promise<Required<Templates>> {
  return {
    partials: await readPartials(partialsDir),
    helpers: await readHelpers(helpersDir, 'helpers'),
    properties: await readHelpers(helpersDir, 'properties'),
  };
}

async function readPartials(dir: string) {
  const partials: NonNullable<Templates['partials']> = {};
  for (const p of await fsPromise.readdir(dir)) {
    const { name, ext } = path.parse(p);
    if (ext === '.hbs') {
      partials[name] = () => fs.readFileSync(path.join(dir, p), 'utf8');
    }
  }
  return partials;
}

async function readHelpers(dir: string, name: string) {
  let helpersPath;
  try {
    helpersPath = require.resolve(path.join(dir, name + '.ts'));
  } catch {
    return {};
  }
  const h = await import(helpersPath);
  const helpers: Record<string, (...args: any[]) => any> = {};
  for (const name in h) {
    if (typeof h[name] === 'function') {
      helpers[name] = h[name];
    }
  }
  return helpers;
}

/**
 * Reads all built-in themes into an object. Partials will always be found in
 * src/themes, whereas helpers may instead be found in dist/themes if TypeScript
 * can't be imported directly.
 */
async function readThemes(): Promise<Record<string, Required<Templates>>> {
  const themes: Record<string, Required<Templates>> = {};

  // Handlebars partials are located in src and not in dist
  // const srcThemes = path.resolve(import.meta.dirname, '../src/themes'); // TODO
  const srcThemes = path.resolve(import.meta.dirname, 'themes'); // TODO
  const distThemes = path.resolve(import.meta.dirname, 'themes');

  for (const theme of await fsPromise.readdir(srcThemes, { withFileTypes: true })) {
    if (theme.isDirectory()) {
      const { name } = theme;
      themes[name] = await readTemplates(path.join(srcThemes, name), path.join(distThemes, name));
    }
  }

  return themes;
}
