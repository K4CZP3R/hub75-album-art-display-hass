import {
  createConnection,
  subscribeEntities,
  createLongLivedTokenAuth,
  Auth,
  Connection,
} from "home-assistant-js-websocket";

const wnd = globalThis;
wnd.WebSocket = require("ws");

export class HassService {
  auth: Auth;
  connection?: Connection;

  lastEntityStates: { [entityId: string]: any } = {};

  constructor(url: string, lToken: string) {
    this.auth = createLongLivedTokenAuth(url, lToken);
  }

  async connect() {
    this.connection = await createConnection({ auth: this.auth });
  }

  async subscribeEntities(callback: (ent: any) => void) {
    if (!this.connection) {
      throw new Error("Not connected");
    }

    subscribeEntities(this.connection, (entities) => {
      // Every entity has last_updated attribute. If it is the same as the last time
      // we received the entity, it means it has not changed.
      // We can skip those entities.

      const changedEntities = Object.entries(entities).filter(
        ([entityId, entity]) => {
          return (
            !this.lastEntityStates[entityId] ||
            this.lastEntityStates[entityId] !== entity.last_updated
          );
        }
      );

      // Update lastEntityStates
      changedEntities.forEach(([entityId, entity]) => {
        this.lastEntityStates[entityId] = entity.last_updated;
      });

      // Call callback with changed entities
      callback(Object.fromEntries(changedEntities));
    });
  }
}
