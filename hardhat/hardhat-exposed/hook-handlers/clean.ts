import fs from 'node:fs/promises';

import type { CleanHooks } from 'hardhat/types/hooks';

export default async (): Promise<Partial<CleanHooks>> => ({
  onClean: context => fs.rm(context.config.exposed.outDir, { recursive: true, force: true }),
});
