import 'hardhat/types/config';

import { ExposedUserConfig, ExposedConfig } from './internal/types.ts';

declare module 'hardhat/types/config' {
  export interface HardhatUserConfig {
    exposed?: ExposedUserConfig;
  }

  export interface HardhatConfig {
    exposed: ExposedConfig;
  }
}
