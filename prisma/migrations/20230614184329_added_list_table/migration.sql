-- CreateTable
CREATE TABLE `list` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `list_items` (
    `item_id` INTEGER NOT NULL,
    `list_id` INTEGER NOT NULL,

    UNIQUE INDEX `list_items_item_id_list_id_key`(`item_id`, `list_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `list` ADD CONSTRAINT `list_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_items` ADD CONSTRAINT `list_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `todo_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_items` ADD CONSTRAINT `list_items_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `list`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
