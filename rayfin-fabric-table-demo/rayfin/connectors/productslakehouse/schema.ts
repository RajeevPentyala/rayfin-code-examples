import type { GraphQLBackedConnector } from "@microsoft/rayfin-connector-fabric-graphql";
import type { ConnectorConfig } from "@microsoft/rayfin-connectors";
import { Products } from "./Products.js";

export { Products } from "./Products.js";

export const connectorConfig = {
    connector: "fabric-sqlanalytics",
    operations: ["read"],
    entities: { Products },
} as const satisfies ConnectorConfig;

export type ProductslakehouseSchema = GraphQLBackedConnector<
    { Products: typeof Products },
    typeof connectorConfig
>;
