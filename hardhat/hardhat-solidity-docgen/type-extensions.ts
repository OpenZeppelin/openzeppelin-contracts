import 'hardhat/types/config';

import type { Config, UserConfig } from './internal/config.ts';

declare module 'hardhat/types/config' {
  export interface HardhatUserConfig {
    docgen?: UserConfig;
  }

  export interface HardhatConfig {
    docgen: Config;
  }
}
