-- Migracja: Rozszerzenie tabeli przebieg_meczu o dodatkowe statystyki
-- Data: 2026-01-27

-- Dodaj nowe kolumny do przebieg_meczu
ALTER TABLE `przebieg_meczu` 
ADD COLUMN `strzaly_gospodarz` int DEFAULT 0 AFTER `faule_gosc`,
ADD COLUMN `strzaly_gosc` int DEFAULT 0 AFTER `strzaly_gospodarz`,
ADD COLUMN `strzaly_celne_gospodarz` int DEFAULT 0 AFTER `strzaly_gosc`,
ADD COLUMN `strzaly_celne_gosc` int DEFAULT 0 AFTER `strzaly_celne_gospodarz`,
ADD COLUMN `zolte_kartki_gospodarz` int DEFAULT 0 AFTER `strzaly_celne_gosc`,
ADD COLUMN `zolte_kartki_gosc` int DEFAULT 0 AFTER `zolte_kartki_gospodarz`,
ADD COLUMN `czerwone_kartki_gospodarz` int DEFAULT 0 AFTER `zolte_kartki_gosc`,
ADD COLUMN `czerwone_kartki_gosc` int DEFAULT 0 AFTER `czerwone_kartki_gospodarz`,
ADD COLUMN `posiadanie_gospodarz` decimal(5,2) DEFAULT 50.00 AFTER `czerwone_kartki_gosc`,
ADD COLUMN `posiadanie_gosc` decimal(5,2) DEFAULT 50.00 AFTER `posiadanie_gospodarz`;
