-- AlterTable
ALTER TABLE `todo_categories` ALTER COLUMN `desc` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `category_items` ADD CONSTRAINT `category_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `todo_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
