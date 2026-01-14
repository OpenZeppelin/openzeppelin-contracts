export interface ExposedUserConfig {
  prefix?: string;
  exclude?: string[];
  include?: string[];
  outDir?: string;
  initializers?: boolean;
  imports?: boolean;
}

export interface ExposedConfig extends ExposedUserConfig {
  exclude: string[];
  include: string[];
  outDir: string;
}
