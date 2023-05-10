-- DropForeignKey
ALTER TABLE `category_items` DROP FOREIGN KEY `category_items_added_by_fkey`;

-- DropForeignKey
ALTER TABLE `category_items` DROP FOREIGN KEY `category_items_category_id_fkey`;

-- AlterTable
ALTER TABLE `categories_shared` ADD COLUMN `add` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `change` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `share` BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE `category_items` ADD CONSTRAINT `category_items_category_id_added_by_fkey` FOREIGN KEY (`category_id`, `added_by`) REFERENCES `categories_shared`(`category_id`, `user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
