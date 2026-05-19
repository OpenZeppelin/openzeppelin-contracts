export interface ExposedUserConfig {
  prefix?: string;
  exclude?: string[];
  include?: string[];
  outDir?: string;
  initializers?: boolean;
}

export interface ExposedConfig {
  prefix: string;
  exclude: string[];
  include: string[];
  outDir: string;
  initializers: boolean;
}
