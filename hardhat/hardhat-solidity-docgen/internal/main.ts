import path from 'path';
import { promises as fs } from 'fs';
import { render } from './render';
import { Build, buildSite } from './site';
import { ensureArray } from './utils/ensure-array';
import { Config, defaults } from './config';
import { loadTemplates } from './templates';

/**
 * Given a set of builds (i.e. solc outputs) and a user configuration, this
 * function builds the site and renders it, writing all pages to the output
 * directory.
 */
export async function main(builds: Build[], userConfig?: Config): Promise<void> {
  const config = { ...defaults, ...userConfig };

  const templates = await loadTemplates(config.theme, config.root, config.templates);
  const site = buildSite(builds, config, templates.properties ?? {});
  const renderedSite = render(site, templates, config.collapseNewlines);

  for (const { id, contents } of renderedSite) {
    const outputFile = path.resolve(config.root, config.outputDir, id);
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, contents);
  }
}
