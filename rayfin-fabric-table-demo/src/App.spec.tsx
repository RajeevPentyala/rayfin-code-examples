//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";

const { executePaginated, select, orderBy, first } = vi.hoisted(() => ({
    executePaginated: vi.fn(),
    select: vi.fn(),
    orderBy: vi.fn(),
    first: vi.fn(),
}));

vi.mock("@/hooks/theme.context", () => ({
    useThemeContext: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));

vi.mock("@/lib/rayfin-client", () => ({
    getRayfinClient: () => ({
        connectors: { productslakehouse: { Products: { select } } },
    }),
}));

describe("Products page", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubGlobal("ResizeObserver", class {
            observe() {}
            unobserve() {}
            disconnect() {}
        });
        select.mockReturnValue({ orderBy });
        orderBy.mockReturnValue({ first });
        first.mockReturnValue({ executePaginated });
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it("loads live connector rows and refreshes them on demand", async () => {
        executePaginated.mockResolvedValue({
            items: [{ productId: 1, productName: "Wireless Mouse", category: "Accessories", price: 24.99 }],
            hasNextPage: false,
        });

        render(<App />);
        expect(screen.getByText("Loading products...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();

        const grid = await screen.findByRole("grid", { name: "Products" });
        expect(within(grid).getByText("Wireless Mouse")).toBeInTheDocument();
        expect(within(grid).getByText("24.99")).toBeInTheDocument();
        expect(select).toHaveBeenCalledWith(["productId", "productName", "category", "price"]);

        fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
        await waitFor(() => expect(executePaginated).toHaveBeenCalledTimes(2));
        await screen.findByRole("grid", { name: "Products" });
    });

    it("shows a source error and allows retry", async () => {
        executePaginated.mockRejectedValueOnce(new Error("Access denied"));
        executePaginated.mockResolvedValueOnce({ items: [], hasNextPage: false });

        render(<App />);
        expect(await screen.findByText(/Could not load products: Access denied/)).toBeInTheDocument();
        expect(screen.queryByRole("grid")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
        expect(await screen.findByText("No products found in dbo.products.")).toBeInTheDocument();
    });

    it("handles nullable columns and makes the demo row limit visible", async () => {
        executePaginated.mockResolvedValue({
            items: [{ productId: null, productName: null, category: null, price: null }],
            hasNextPage: true,
        });

        render(<App />);
        const grid = await screen.findByRole("grid", { name: "Products" });
        expect(within(grid).getAllByText("--")).toHaveLength(4);
        expect(screen.getByText(/This demo displays the first 100 rows/)).toBeInTheDocument();
    });
});
