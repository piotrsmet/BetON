-- AlterTable: dodaje kolumnę linia dla rynków Over/Under (gole, rzuty rożne, kartki)
ALTER TABLE `kursy` ADD COLUMN `linia` DECIMAL(5, 2) NULL;
