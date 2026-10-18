//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { ConnectorsRayfinClient } from "@microsoft/rayfin-client";
import type { ProductslakehouseSchema } from "../../rayfin/connectors/productslakehouse/schema";

type AppClient = ConnectorsRayfinClient<
    Record<string, never>,
    Record<string, never>,
    { productslakehouse: ProductslakehouseSchema }
>;

let _client: AppClient | undefined;

/**
 * Returns the pre-configured RayfinClient singleton.
 */
export function getRayfinClient(): AppClient {
    if (!_client) {
        const apiUrl = import.meta.env.VITE_RAYFIN_API_URL;
        const publishableKey = import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY;

        if (!apiUrl || !publishableKey) {
            throw new Error(`Missing required env vars for creating rayfin client - run 'npx rayfin up'`);
        }

        _client = new ConnectorsRayfinClient<
            Record<string, never>,
            Record<string, never>,
            { productslakehouse: ProductslakehouseSchema }
        >({
            baseUrl: apiUrl,
            publishableKey,
            authStorage: true,
            useProxy: false,
            // Explicit column selection avoids loading server entity decorators in the browser.
            connectors: {
                productslakehouse: {
                    connector: "fabric-sqlanalytics",
                    operations: ["read"],
                },
            },
        });
    }

    return _client;
}