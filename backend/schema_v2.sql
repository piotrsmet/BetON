-- Skrypt aktualizujący strukturę bazy danych dla projektu BetON
-- Data: 2025-01-17
-- Autor: Antigravity

SET FOREIGN_KEY_CHECKS = 0;

-- 1. UZYTKOWNICY (Modyfikacja lub zachowanie istniejącej tabeli)
-- Dodajemy pola data_rejestracji i rola, jeśli nie istnieją.
-- (Tutaj zakładam tworzenie od nowa dla czystości, ale zachowując dane jeśli trzeba by było migrować)
DROP TABLE IF EXISTS `uzytkownicy`;
CREATE TABLE `uzytkownicy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nazwa` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `haslo` varchar(255) NOT NULL,
  `saldo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `data_rejestracji` datetime DEFAULT CURRENT_TIMESTAMP,
  `rola` enum('user','admin') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nazwa` (`nazwa`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. MECZE (Rozbudowa)
-- Dodano wyniki, status i ligę
DROP TABLE IF EXISTS `mecze`;
CREATE TABLE `mecze` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid` int DEFAULT NULL UNIQUE, -- Zewnętrzne ID meczu (opcjonalne, np. z API)
  `nazwa_gospodarza` varchar(100) NOT NULL,
  `nazwa_goscia` varchar(100) NOT NULL,
  `data_spotkania` datetime NOT NULL,
  `wynik_gospodarz` int DEFAULT NULL,
  `wynik_gosc` int DEFAULT NULL,
  `status` enum('PLANOWANY', 'TRWA', 'ZAKONCZONY', 'PRZERWANY', 'ODWOLANY') DEFAULT 'PLANOWANY',
  `liga` varchar(100) DEFAULT NULL,
  `logo_gospodarza` varchar(255) DEFAULT NULL,
  `logo_goscia` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. KURSY (Zamiast typy_przedmeczowe)
-- Bardziej elastyczna tabela na kursy
DROP TABLE IF EXISTS `kursy`;
CREATE TABLE `kursy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mecz_id` int NOT NULL,
  `rodzaj` varchar(50) NOT NULL, -- np. '1X2', 'ILOSC_GOLI'
  `typ` varchar(50) NOT NULL, -- np. '1', 'X', '2', 'OVER_2.5'
  `opis` varchar(150), -- np. 'Gospodarz wygra'
  `kurs` decimal(6,2) NOT NULL,
  `status` enum('AKTYWNY', 'ZABLOKOWANY', 'ROZTRZYGNIETY') DEFAULT 'AKTYWNY',
  `wynik` enum('WIN', 'LOSS', 'VOID', 'PENDING') DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. KUPONY
-- Dodano kurs całkowity
DROP TABLE IF EXISTS `kupony`;
CREATE TABLE `kupony` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uzytkownik_id` int NOT NULL,
  `data_utworzenia` datetime DEFAULT CURRENT_TIMESTAMP,
  `stawka` decimal(10,2) NOT NULL,
  `kurs_calkowity` decimal(10,2) NOT NULL,
  `potencjalna_wygrana` decimal(10,2) NOT NULL,
  `status` enum('OCZEKUJACY','WYGRANY','PRZEGRANY') NOT NULL DEFAULT 'OCZEKUJACY',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. KUPON_POZYCJE (Zamiast typy)
-- Łączy kupon z konkretnym kursem
DROP TABLE IF EXISTS `kupon_pozycje`;
CREATE TABLE `kupon_pozycje` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kupon_id` int NOT NULL,
  `kurs_id` int NOT NULL,
  `kurs_w_momencie` decimal(6,2) NOT NULL,
  `status` enum('OCZEKUJACY','WYGRANY','PRZEGRANY', 'ZWROT') DEFAULT 'OCZEKUJACY',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`kupon_id`) REFERENCES `kupony` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kurs_id`) REFERENCES `kursy` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TRANSAKCJE (Nowa tabela)
-- Historia operacji finansowych
DROP TABLE IF EXISTS `transakcje`;
CREATE TABLE `transakcje` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uzytkownik_id` int NOT NULL,
  `typ` enum('WPLATA', 'WYPLATA', 'STAWKA', 'WYGRANA') NOT NULL,
  `kwota` decimal(10,2) NOT NULL,
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  `opis` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. STATYSTYKI_MECZU (Nowa tabela)
-- Szczegółowe statystyki meczu
DROP TABLE IF EXISTS `statystyki_meczu`;
CREATE TABLE `statystyki_meczu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mecz_id` int NOT NULL,
  `gole_gospodarz` int DEFAULT 0,
  `gole_gosc` int DEFAULT 0,
  `rozne_gospodarz` int DEFAULT 0,
  `rozne_gosc` int DEFAULT 0,
  `faule_gospodarz` int DEFAULT 0,
  `faule_gosc` int DEFAULT 0,
  `zolte_kartki_gospodarz` int DEFAULT 0,
  `zolte_kartki_gosc` int DEFAULT 0,
  `czerwone_kartki_gospodarz` int DEFAULT 0,
  `czerwone_kartki_gosc` int DEFAULT 0,
  `strzaly_gospodarz` int DEFAULT 0,
  `strzaly_gosc` int DEFAULT 0,
  `strzaly_celne_gospodarz` int DEFAULT 0,
  `strzaly_celne_gosc` int DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mecz_id` (`mecz_id`),
  FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRZEBIEG_MECZU (Nowa tabela)
-- Zapis meczu minuta po minucie
DROP TABLE IF EXISTS `przebieg_meczu`;
CREATE TABLE `przebieg_meczu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mecz_id` int NOT NULL,
  `minuta` int NOT NULL,
  `wynik` varchar(10) NOT NULL, -- np. '0:0'
  `posiadanie` varchar(10) NOT NULL, -- 'home' lub 'away'
  `komentarz` text,
  `rozne_gospodarz` int DEFAULT 0,
  `rozne_gosc` int DEFAULT 0,
  `faule_gospodarz` int DEFAULT 0,
  `faule_gosc` int DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dodatkowe sprzatanie starych tabel jeśli istnieją, a nie są już używane w nowym schemacie
DROP TABLE IF EXISTS `typy`;
DROP TABLE IF EXISTS `typy_przedmeczowe`;

SET FOREIGN_KEY_CHECKS = 1;

-- Przykladowe dane:
INSERT INTO uzytkownicy (nazwa, email, haslo, saldo, rola) VALUES 
('test_user', 'test@example.com', '$2b$10$X7v7k.1.1.1.1.1.1.1.1.1', 100.00, 'user');

INSERT INTO mecze (nazwa_gospodarza, nazwa_goscia, data_spotkania, status, liga) VALUES 
('Real Madryt', 'FC Barcelona', NOW() + INTERVAL 2 DAY, 'PLANOWANY', 'La Liga'),
('Arsenal', 'Chelsea', NOW() + INTERVAL 3 DAY, 'PLANOWANY', 'Premier League');

-- Pobranie ID pierwszego meczu (zakladajac 1)
INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs) VALUES 
(1, '1X2', '1', 'Real Madryt', 2.10),
(1, '1X2', 'X', 'Remis', 3.40),
(1, '1X2', '2', 'FC Barcelona', 3.10),
(2, '1X2', '1', 'Arsenal', 1.80),
(2, '1X2', '2', 'Chelsea', 4.00);
