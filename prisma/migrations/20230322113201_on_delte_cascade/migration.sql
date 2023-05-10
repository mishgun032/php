/*
  Warnings:

  - Added the required column `added_by` to the `category_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `categories_shared` DROP FOREIGN KEY `categories_shared_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `category_items` DROP FOREIGN KEY `category_items_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `category_items` DROP FOREIGN KEY `category_items_item_id_fkey`;

-- AlterTable
ALTER TABLE `category_items` ADD COLUMN `added_by` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `category_items` ADD CONSTRAINT `category_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `todo_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_items` ADD CONSTRAINT `category_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `todo_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_items` ADD CONSTRAINT `category_items_added_by_fkey` FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories_shared` ADD CONSTRAINT `categories_shared_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `todo_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
