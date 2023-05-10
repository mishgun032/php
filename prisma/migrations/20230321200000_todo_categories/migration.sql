/*
  Warnings:

  - A unique constraint covering the columns `[user_id,id]` on the table `todo_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `todo_categories` MODIFY `desc` VARCHAR(50) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `todo_categories_user_id_id_key` ON `todo_categories`(`user_id`, `id`);
