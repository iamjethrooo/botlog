/*
  Warnings:

  - A unique constraint covering the columns `[settingKey]` on the table `Setting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Setting_settingKey_key" ON "Setting"("settingKey");
