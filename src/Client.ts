import { RiceConfig, loadConfig } from "./config";
import { RiceDBClient } from "./storage/client/RiceDBClient";
import { StateClient } from "./state";
import * as dotenv from "dotenv";
import * as path from "path";

export interface ClientOptions {
  configPath?: string;
  runId?: string;
  stateRunId?: string;
  storageRunId?: string;
}

export class Client {
  private _config: RiceConfig | null = null;
  private _storage: RiceDBClient | null = null;
  private _state: StateClient | null = null;
  private options: ClientOptions;

  constructor(optionsOrPath?: string | ClientOptions) {
    if (typeof optionsOrPath === "string") {
      this.options = { configPath: optionsOrPath };
    } else {
      this.options = optionsOrPath || {};
    }
  }

  async connect() {
    // Load environment variables
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });

    // Load config
    this._config = await loadConfig(this.options.configPath);

    // Initialize Storage
    if (this._config.storage?.enabled) {
      const storageUrl =
        process.env.STORAGE_INSTANCE_URL ||
        process.env.RICEDB_HOST ||
        "localhost:50051";
      // Parse host and port
      let host = "localhost";
      let port = 50051;

      const parts = storageUrl.split(":");
      if (parts.length === 2) {
        host = parts[0];
        port = parseInt(parts[1], 10);
      } else {
        host = storageUrl;
      }

      const token = process.env.STORAGE_AUTH_TOKEN;
      const user = process.env.STORAGE_USER || "admin";

      const httpPort = process.env.STORAGE_HTTP_PORT
        ? parseInt(process.env.STORAGE_HTTP_PORT, 10)
        : 3000;

      const storageRunId =
        this.options.storageRunId ||
        this.options.runId ||
        process.env.STORAGE_RUN_ID;

      // We assume STORAGE_INSTANCE_URL points to the gRPC port.
      // Pass token to constructor initially (if it's a valid token, it works; if it's a password, we login).
      this._storage = new RiceDBClient(
        host,
        "auto",
        port,
        httpPort,
        token,
        storageRunId,
      );
      await this._storage.connect();

      if (token) {
        try {
          // Attempt auto-login using the token as password
          console.log(`Attempting login for user ${user}...`);
          const newToken = await this._storage.login(user, token);
          console.log(`Login successful. Token length: ${newToken.length}`);
        } catch (e) {
          // If login fails, maybe the token was already a valid session token?
          // Or credentials are wrong. We log warning but don't crash,
          // allowing subsequent calls to fail if auth is missing.
          console.warn(`Auto-login failed for user ${user}:`, e);
        }
      }
    }

    // Initialize State
    if (this._config.state?.enabled) {
      const address = process.env.STATE_INSTANCE_URL || "localhost:50051";
      const token = process.env.STATE_AUTH_TOKEN;
      const runId =
        this.options.stateRunId ||
        this.options.runId ||
        process.env.STATE_RUN_ID ||
        "default";
      this._state = new StateClient(address, token, runId);
    }
  }

  get storage(): RiceDBClient {
    if (!this._storage) {
      throw new Error(
        "Config mismatch: storage is not enabled or not connected"
      );
    }
    return this._storage;
  }

  get state(): StateClient {
    if (!this._state) {
      throw new Error("Config mismatch: state is not enabled or not connected");
    }
    return this._state;
  }
}
