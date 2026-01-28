import 'hardhat/types/config';

import { ExposedUserConfig, ExposedConfig } from './core/types';

declare module 'hardhat/types/config' {
  export interface HardhatUserConfig {
    exposed?: ExposedUserConfig;
  }

  export interface HardhatConfig {
    exposed: ExposedConfig;
  }
}
