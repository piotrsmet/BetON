-- AlterTable statystyki_meczu: dodaje spalone i wynik do przerwy (do rozliczenia HTFT i OU_OFFSIDES)
ALTER TABLE `statystyki_meczu` ADD COLUMN `spalone_gospodarz` INT NULL DEFAULT 0;
ALTER TABLE `statystyki_meczu` ADD COLUMN `spalone_gosc` INT NULL DEFAULT 0;
ALTER TABLE `statystyki_meczu` ADD COLUMN `gole_gospodarz_ht` INT NULL DEFAULT 0;
ALTER TABLE `statystyki_meczu` ADD COLUMN `gole_gosc_ht` INT NULL DEFAULT 0;

-- AlterTable przebieg_meczu: dodaje spalone w przebiegu
ALTER TABLE `przebieg_meczu` ADD COLUMN `spalone_gospodarz` INT NULL DEFAULT 0;
ALTER TABLE `przebieg_meczu` ADD COLUMN `spalone_gosc` INT NULL DEFAULT 0;
