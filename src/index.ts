import { HassService } from "./services/hass.service";
import { FillScreenPacket } from "./models/packets";
import { SocketService } from "./services/socket.service";
import { MatrixService } from "./services/matrix.service";
import dotenv from "dotenv";
dotenv.config();

async function connect() {
  const wsMatrix = new SocketService(process.env.MATRIX_WS!);
  await wsMatrix.connect();

  const hass = new HassService(
    process.env.HASS_BASE!,
    process.env.HASS_LL_TOKEN!
  );

  await hass.connect();

  const matrix = new MatrixService(wsMatrix);

  hass.subscribeEntities((entities) => {
    Object.entries(entities)
      .filter(([entityId, entity]) => {
        return entityId.startsWith("media_player.spotify");
      })
      .forEach(([entityId, entity]) => {
        matrix.handleEntityChange(entityId, entity);
      });
  });
}

connect().catch((err) => {
  console.error(err);
});
