BEGIN;

ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "Item" ADD CONSTRAINT "Item_buyPrice_nonnegative" CHECK ("buyPrice" >= 0);

COMMIT;
