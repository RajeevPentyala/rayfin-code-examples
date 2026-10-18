//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
    Button,
    createTableColumn,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    FluentProvider,
    MessageBar,
    MessageBarBody,
    Spinner,
    webDarkTheme,
    webLightTheme,
} from "@fluentui/react-components";
import { useThemeContext } from "@/hooks/theme.context";
import { getRayfinClient } from "@/lib/rayfin-client";
import type { Products } from "../rayfin/connectors/productslakehouse/Products";

type ProductRow = Pick<Products, "productId" | "productName" | "category" | "price">;

const columns = [
    createTableColumn<ProductRow>({
        columnId: "productId",
        renderHeaderCell: () => "Product ID",
        renderCell: (product) => product.productId ?? "--",
    }),
    createTableColumn<ProductRow>({
        columnId: "productName",
        renderHeaderCell: () => "Product name",
        renderCell: (product) => product.productName ?? "--",
    }),
    createTableColumn<ProductRow>({
        columnId: "category",
        renderHeaderCell: () => "Category",
        renderCell: (product) => product.category ?? "--",
    }),
    createTableColumn<ProductRow>({
        columnId: "price",
        renderHeaderCell: () => "Price",
        renderCell: (product) => product.price == null ? "--" : product.price.toFixed(2),
    }),
];

function App() {
    const { isDark, toggleTheme } = useThemeContext();
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [request, setRequest] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadProducts() {
            setIsLoading(true);
            setError(null);
            setProducts([]);
            setHasMore(false);

            try {
                const page = await getRayfinClient().connectors.productslakehouse.Products
                    .select(["productId", "productName", "category", "price"])
                    .orderBy({ productId: "asc" })
                    .first(100)
                    .executePaginated();

                if (active) {
                    setProducts(page.items);
                    setHasMore(page.hasNextPage);
                }
            } catch (cause) {
                if (active) {
                    setError(cause instanceof Error ? cause.message : String(cause));
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        void loadProducts();
        return () => { active = false; };
    }, [request]);

    return (
        <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
            <main className="min-h-screen bg-background p-6 text-foreground">
                <div className="mx-auto flex max-w-5xl flex-col gap-6">
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="font-page-title text-page-title font-semibold">Products</h1>
                            <p className="font-page-subtitle text-page-subtitle text-muted-foreground">
                                Live data from RayfinDemoLakehouse / dbo.products
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={toggleTheme}>
                                {isDark ? "Light theme" : "Dark theme"}
                            </Button>
                            <Button
                                appearance="primary"
                                disabled={isLoading}
                                onClick={() => setRequest((value) => value + 1)}
                            >
                                Refresh
                            </Button>
                        </div>
                    </header>
                    <section
                        aria-label="Products"
                        aria-busy={isLoading}
                        className="rounded-xl border border-border bg-card p-4"
                    >
                        {isLoading ? (
                            <Spinner label="Loading products..." />
                        ) : error !== null ? (
                            <MessageBar intent="error">
                                <MessageBarBody>
                                    Could not load products: {error} Use Refresh to try again.
                                </MessageBarBody>
                            </MessageBar>
                        ) : products.length === 0 ? (
                            <p role="status">No products found in dbo.products.</p>
                        ) : (
                            <>
                                <p role="status" className="mb-4 text-muted-foreground">
                                    {products.length} products{hasMore ? " shown. This demo displays the first 100 rows." : ""}
                                </p>
                                <div className="overflow-x-auto">
                                    <DataGrid
                                        aria-label="Products"
                                        items={products}
                                        columns={columns}
                                        className="min-w-lg"
                                    >
                                        <DataGridHeader>
                                            <DataGridRow>
                                                {({ renderHeaderCell }) => (
                                                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                                )}
                                            </DataGridRow>
                                        </DataGridHeader>
                                        <DataGridBody<ProductRow>>
                                            {({ item, rowId }) => (
                                                <DataGridRow<ProductRow> key={rowId}>
                                                    {({ renderCell }) => (
                                                        <DataGridCell>{renderCell(item)}</DataGridCell>
                                                    )}
                                                </DataGridRow>
                                            )}
                                        </DataGridBody>
                                    </DataGrid>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </FluentProvider>
    );
}

export default App;
