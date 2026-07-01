import fs from 'node:fs';
import path from 'node:path';

import type { TestHooks, HookContext } from 'hardhat/types/hooks';

const ignoredIfProxy: Set<string> = new Set([
  'test/proxy/beacon/BeaconProxy.test.js',
  'test/proxy/beacon/UpgradeableBeacon.test.js',
  'test/proxy/ERC1967/ERC1967Proxy.test.js',
  'test/proxy/transparent/ProxyAdmin.test.js',
  'test/proxy/transparent/TransparentUpgradeableProxy.test.js',
  'test/proxy/utils/UUPSUpgradeable.test.js',
]);

export default async (): Promise<Partial<TestHooks>> => ({
  registerFileForTestRunner: (
    context: HookContext,
    filePath: string,
    next: (nextContext: HookContext, filePath: string) => Promise<string | undefined>,
  ): Promise<string | undefined> => {
    const hasProxies = fs.existsSync(path.join(context.config.paths.root, 'contracts/proxy/Proxy.sol'));
    return hasProxies || !ignoredIfProxy.has(filePath) ? next(context, filePath) : Promise.resolve('ignored');
  },
});
