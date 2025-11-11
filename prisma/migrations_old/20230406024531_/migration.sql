-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "consumable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stackable" BOOLEAN NOT NULL DEFAULT false;
