-- DropIndex
DROP INDEX "InventoryItem_ingredientId_key";

-- CreateIndex
CREATE INDEX "InventoryItem_ingredientId_idx" ON "InventoryItem"("ingredientId");
