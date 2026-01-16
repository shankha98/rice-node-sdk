import * as path from "path";
import * as fs from "fs";

export interface RiceConfig {
  storage?: {
    enabled: boolean;
  };
  state?: {
    enabled: boolean;
    llm_mode?: boolean;
    flux?: {
      enabled: boolean;
    };
  };
}

export async function loadConfig(configPath?: string): Promise<RiceConfig> {
  const defaultPath = path.resolve(process.cwd(), "rice.config.js");
  const filePath = configPath ? path.resolve(configPath) : defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found at ${filePath}`);
  }

  try {
    // Dynamic import to support both ESM and CJS if environment allows
    const configModule = await import(filePath);
    return configModule.default || configModule;
  } catch (error) {
    throw new Error(`Failed to load config from ${filePath}: ${error}`);
  }
}
