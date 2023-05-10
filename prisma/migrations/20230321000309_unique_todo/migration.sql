/*
  Warnings:

  - A unique constraint covering the columns `[user_id,id]` on the table `todo_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `todo_items_user_id_id_key` ON `todo_items`(`user_id`, `id`);
