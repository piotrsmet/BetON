-- AlterTable: dodaje kolumnę next_update_at do kursy (do mechanizmu live odds + lockowania)
ALTER TABLE `kursy` ADD COLUMN `next_update_at` DATETIME(3) NULL;
