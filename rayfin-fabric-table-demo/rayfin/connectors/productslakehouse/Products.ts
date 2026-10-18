import { entity, decimal, int, text, role } from "@microsoft/rayfin-core";
import { Source } from "@microsoft/rayfin-connectors";

@role("authenticated", ["read"])
@entity()
export class Products extends Source({
    schema: "dbo",
    table: "products",
    primaryKey: [],
}) {
    @int({ optional: true, column: "ProductId" })
    productId?: number;

    @text({ optional: true, column: "ProductName", max: 8000 })
    productName?: string;

    @text({ optional: true, column: "Category", max: 8000 })
    category?: string;

    @decimal({ optional: true, column: "Price", precision: 10, scale: 2 })
    price?: number;
}
