-- CreateTable
CREATE TABLE `kupony` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uzytkownik_id` INTEGER NOT NULL,
    `data_utworzenia` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stawka` DECIMAL(10, 2) NOT NULL,
    `kurs_calkowity` DECIMAL(10, 2) NOT NULL,
    `potencjalna_wygrana` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('OCZEKUJACY', 'WYGRANY', 'PRZEGRANY') NOT NULL DEFAULT 'OCZEKUJACY',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kupon_pozycje` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kupon_id` INTEGER NOT NULL,
    `kurs_id` INTEGER NOT NULL,
    `kurs_w_momencie` DECIMAL(6, 2) NOT NULL,
    `status` ENUM('OCZEKUJACY', 'WYGRANY', 'PRZEGRANY', 'ZWROT') NULL DEFAULT 'OCZEKUJACY',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kursy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mecz_id` INTEGER NOT NULL,
    `rodzaj` VARCHAR(50) NOT NULL,
    `typ` VARCHAR(50) NOT NULL,
    `opis` VARCHAR(150) NULL,
    `kurs` DECIMAL(6, 2) NOT NULL,
    `status` ENUM('AKTYWNY', 'ZABLOKOWANY', 'ROZTRZYGNIETY') NULL DEFAULT 'AKTYWNY',
    `wynik` ENUM('WIN', 'LOSS', 'VOID', 'PENDING') NULL DEFAULT 'PENDING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mecze` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mid` INTEGER NULL,
    `nazwa_gospodarza` VARCHAR(100) NOT NULL,
    `nazwa_goscia` VARCHAR(100) NOT NULL,
    `data_spotkania` DATETIME(3) NOT NULL,
    `wynik_gospodarz` INTEGER NULL,
    `wynik_gosc` INTEGER NULL,
    `status` ENUM('PLANOWANY', 'TRWA', 'ZAKONCZONY', 'PRZERWANY', 'ODWOLANY') NULL DEFAULT 'PLANOWANY',
    `liga` VARCHAR(100) NULL,
    `logo_gospodarza` VARCHAR(255) NULL,
    `logo_goscia` VARCHAR(255) NULL,

    UNIQUE INDEX `mecze_mid_key`(`mid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `przebieg_meczu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mecz_id` INTEGER NOT NULL,
    `minuta` INTEGER NOT NULL,
    `wynik` VARCHAR(10) NOT NULL,
    `posiadanie` VARCHAR(10) NOT NULL,
    `komentarz` TEXT NULL,
    `rozne_gospodarz` INTEGER NULL DEFAULT 0,
    `rozne_gosc` INTEGER NULL DEFAULT 0,
    `faule_gospodarz` INTEGER NULL DEFAULT 0,
    `faule_gosc` INTEGER NULL DEFAULT 0,
    `strzaly_gospodarz` INTEGER NULL DEFAULT 0,
    `strzaly_gosc` INTEGER NULL DEFAULT 0,
    `strzaly_celne_gospodarz` INTEGER NULL DEFAULT 0,
    `strzaly_celne_gosc` INTEGER NULL DEFAULT 0,
    `zolte_kartki_gospodarz` INTEGER NULL DEFAULT 0,
    `zolte_kartki_gosc` INTEGER NULL DEFAULT 0,
    `czerwone_kartki_gospodarz` INTEGER NULL DEFAULT 0,
    `czerwone_kartki_gosc` INTEGER NULL DEFAULT 0,
    `posiadanie_gospodarz` DECIMAL(5, 2) NULL DEFAULT 50.00,
    `posiadanie_gosc` DECIMAL(5, 2) NULL DEFAULT 50.00,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `session_id` VARCHAR(128) NOT NULL,
    `expires` INTEGER NOT NULL,
    `data` MEDIUMTEXT NULL,

    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statystyki_meczu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mecz_id` INTEGER NOT NULL,
    `gole_gospodarz` INTEGER NULL DEFAULT 0,
    `gole_gosc` INTEGER NULL DEFAULT 0,
    `rozne_gospodarz` INTEGER NULL DEFAULT 0,
    `rozne_gosc` INTEGER NULL DEFAULT 0,
    `faule_gospodarz` INTEGER NULL DEFAULT 0,
    `faule_gosc` INTEGER NULL DEFAULT 0,
    `zolte_kartki_gospodarz` INTEGER NULL DEFAULT 0,
    `zolte_kartki_gosc` INTEGER NULL DEFAULT 0,
    `czerwone_kartki_gospodarz` INTEGER NULL DEFAULT 0,
    `czerwone_kartki_gosc` INTEGER NULL DEFAULT 0,
    `strzaly_gospodarz` INTEGER NULL DEFAULT 0,
    `strzaly_gosc` INTEGER NULL DEFAULT 0,
    `strzaly_celne_gospodarz` INTEGER NULL DEFAULT 0,
    `strzaly_celne_gosc` INTEGER NULL DEFAULT 0,
    `posiadanie_gospodarz` INTEGER NULL DEFAULT 50,
    `posiadanie_gosc` INTEGER NULL DEFAULT 50,

    UNIQUE INDEX `statystyki_meczu_mecz_id_key`(`mecz_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transakcje` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uzytkownik_id` INTEGER NOT NULL,
    `typ` ENUM('WPLATA', 'WYPLATA', 'STAWKA', 'WYGRANA') NOT NULL,
    `kwota` DECIMAL(10, 2) NOT NULL,
    `data` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `opis` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uzytkownicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nazwa` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `haslo` VARCHAR(255) NOT NULL,
    `saldo` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `data_rejestracji` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rola` ENUM('user', 'admin') NULL DEFAULT 'user',

    UNIQUE INDEX `uzytkownicy_nazwa_key`(`nazwa`),
    UNIQUE INDEX `uzytkownicy_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kupony` ADD CONSTRAINT `kupony_uzytkownik_id_fkey` FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kupon_pozycje` ADD CONSTRAINT `kupon_pozycje_kupon_id_fkey` FOREIGN KEY (`kupon_id`) REFERENCES `kupony`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kupon_pozycje` ADD CONSTRAINT `kupon_pozycje_kurs_id_fkey` FOREIGN KEY (`kurs_id`) REFERENCES `kursy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kursy` ADD CONSTRAINT `kursy_mecz_id_fkey` FOREIGN KEY (`mecz_id`) REFERENCES `mecze`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `przebieg_meczu` ADD CONSTRAINT `przebieg_meczu_mecz_id_fkey` FOREIGN KEY (`mecz_id`) REFERENCES `mecze`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statystyki_meczu` ADD CONSTRAINT `statystyki_meczu_mecz_id_fkey` FOREIGN KEY (`mecz_id`) REFERENCES `mecze`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transakcje` ADD CONSTRAINT `transakcje_uzytkownik_id_fkey` FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

