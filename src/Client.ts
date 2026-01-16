import { RiceConfig, loadConfig } from "./config";
import { RiceDBClient } from "./storage/client/RiceDBClient";
import { StateClient } from "./state";
import * as dotenv from "dotenv";
import * as path from "path";

export class Client {
  private _config: RiceConfig | null = null;
  private _storage: RiceDBClient | null = null;
  private _state: StateClient | null = null;

  constructor(private configPath?: string) {}

  async connect() {
    // Load environment variables
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });

    // Load config
    this._config = await loadConfig(this.configPath);

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

      // We assume STORAGE_INSTANCE_URL points to the gRPC port
      this._storage = new RiceDBClient(host, "auto", port);
      await this._storage.connect();
    }

    // Initialize State
    if (this._config.state?.enabled) {
      const address = process.env.STATE_INSTANCE_URL || "localhost:50051";
      const token = process.env.STATE_AUTH_TOKEN;
      this._state = new StateClient(address, token);
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
