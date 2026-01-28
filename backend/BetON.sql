-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Czas generowania: 28 Sty 2026, 20:31
-- Wersja serwera: 8.0.44-0ubuntu0.22.04.1
-- Wersja PHP: 8.1.2-1ubuntu2.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `BetON`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kupony`
--

CREATE TABLE `kupony` (
  `id` int NOT NULL,
  `uzytkownik_id` int NOT NULL,
  `data_utworzenia` datetime DEFAULT CURRENT_TIMESTAMP,
  `stawka` decimal(10,2) NOT NULL,
  `kurs_calkowity` decimal(10,2) NOT NULL,
  `potencjalna_wygrana` decimal(10,2) NOT NULL,
  `status` enum('OCZEKUJACY','WYGRANY','PRZEGRANY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OCZEKUJACY'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `kupony`
--

INSERT INTO `kupony` (`id`, `uzytkownik_id`, `data_utworzenia`, `stawka`, `kurs_calkowity`, `potencjalna_wygrana`, `status`) VALUES
(1, 2, '2026-01-17 19:47:34', '10.00', '44.75', '447.50', 'PRZEGRANY'),
(2, 2, '2026-01-17 19:50:30', '10.00', '7.21', '72.10', 'WYGRANY'),
(3, 2, '2026-01-17 19:53:31', '10.00', '10.79', '107.90', 'WYGRANY'),
(4, 2, '2026-01-17 20:37:56', '10.00', '21.10', '211.00', 'PRZEGRANY'),
(5, 2, '2026-01-18 14:47:56', '10.00', '26.95', '269.50', 'PRZEGRANY'),
(6, 3, '2026-01-27 20:09:39', '10.00', '22.87', '228.70', 'PRZEGRANY'),
(7, 3, '2026-01-28 18:40:29', '10.00', '24.03', '240.30', 'PRZEGRANY');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kupon_pozycje`
--

CREATE TABLE `kupon_pozycje` (
  `id` int NOT NULL,
  `kupon_id` int NOT NULL,
  `kurs_id` int NOT NULL,
  `kurs_w_momencie` decimal(6,2) NOT NULL,
  `status` enum('OCZEKUJACY','WYGRANY','PRZEGRANY','ZWROT') COLLATE utf8mb4_unicode_ci DEFAULT 'OCZEKUJACY'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `kupon_pozycje`
--

INSERT INTO `kupon_pozycje` (`id`, `kupon_id`, `kurs_id`, `kurs_w_momencie`, `status`) VALUES
(1, 1, 3, '3.64', 'WYGRANY'),
(2, 1, 5, '3.67', 'WYGRANY'),
(3, 1, 9, '3.35', 'PRZEGRANY'),
(4, 2, 3, '1.96', 'WYGRANY'),
(5, 2, 5, '3.68', 'WYGRANY'),
(6, 3, 3, '3.34', 'WYGRANY'),
(7, 3, 5, '3.23', 'WYGRANY'),
(8, 4, 3, '2.78', 'WYGRANY'),
(9, 4, 4, '2.12', 'PRZEGRANY'),
(10, 4, 9, '3.58', 'PRZEGRANY'),
(11, 5, 1, '2.65', 'WYGRANY'),
(12, 5, 6, '2.11', 'WYGRANY'),
(13, 5, 13, '1.56', 'PRZEGRANY'),
(14, 5, 17, '3.09', 'WYGRANY'),
(15, 6, 3, '2.88', 'PRZEGRANY'),
(16, 6, 5, '3.80', 'PRZEGRANY'),
(17, 6, 7, '2.09', 'PRZEGRANY'),
(18, 7, 2, '3.80', 'WYGRANY'),
(19, 7, 9, '2.75', 'PRZEGRANY'),
(20, 7, 10, '2.30', 'PRZEGRANY');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kursy`
--

CREATE TABLE `kursy` (
  `id` int NOT NULL,
  `mecz_id` int NOT NULL,
  `rodzaj` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `typ` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opis` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kurs` decimal(6,2) NOT NULL,
  `status` enum('AKTYWNY','ZABLOKOWANY','ROZTRZYGNIETY') COLLATE utf8mb4_unicode_ci DEFAULT 'AKTYWNY',
  `wynik` enum('WIN','LOSS','VOID','PENDING') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `kursy`
--

INSERT INTO `kursy` (`id`, `mecz_id`, `rodzaj`, `typ`, `opis`, `kurs`, `status`, `wynik`) VALUES
(1, 1, '1X2', '1', 'Man City', '1.96', 'ROZTRZYGNIETY', 'LOSS'),
(2, 1, '1X2', 'X', 'Remis', '3.80', 'ROZTRZYGNIETY', 'WIN'),
(3, 1, '1X2', '2', 'Sheffield United', '3.60', 'ROZTRZYGNIETY', 'LOSS'),
(4, 2, '1X2', '1', 'Wolves', '2.30', 'ROZTRZYGNIETY', 'LOSS'),
(5, 2, '1X2', 'X', 'Remis', '3.80', 'ROZTRZYGNIETY', 'LOSS'),
(6, 2, '1X2', '2', 'Crystal Palace', '2.82', 'ROZTRZYGNIETY', 'WIN'),
(7, 3, '1X2', '1', 'Newcastle', '2.35', 'ROZTRZYGNIETY', 'LOSS'),
(8, 3, '1X2', 'X', 'Remis', '3.80', 'ROZTRZYGNIETY', 'WIN'),
(9, 3, '1X2', '2', 'Liverpool', '2.75', 'ROZTRZYGNIETY', 'LOSS'),
(10, 4, '1X2', '1', 'Burnley', '2.30', 'ROZTRZYGNIETY', 'LOSS'),
(11, 4, '1X2', 'X', 'Remis', '3.80', 'ROZTRZYGNIETY', 'LOSS'),
(12, 4, '1X2', '2', 'Tottenham', '2.83', 'ROZTRZYGNIETY', 'WIN'),
(13, 5, '1X2', '1', 'Bournemouth', '2.03', 'ROZTRZYGNIETY', 'LOSS'),
(14, 5, '1X2', 'X', 'Remis', '3.80', 'ROZTRZYGNIETY', 'WIN'),
(15, 5, '1X2', '2', 'Chelsea', '3.38', 'ROZTRZYGNIETY', 'LOSS');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `mecze`
--

CREATE TABLE `mecze` (
  `id` int NOT NULL,
  `mid` int DEFAULT NULL,
  `nazwa_gospodarza` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nazwa_goscia` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_spotkania` datetime NOT NULL,
  `wynik_gospodarz` int DEFAULT NULL,
  `wynik_gosc` int DEFAULT NULL,
  `status` enum('PLANOWANY','TRWA','ZAKONCZONY','PRZERWANY','ODWOLANY') COLLATE utf8mb4_unicode_ci DEFAULT 'PLANOWANY',
  `liga` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_gospodarza` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_goscia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `mecze`
--

INSERT INTO `mecze` (`id`, `mid`, `nazwa_gospodarza`, `nazwa_goscia`, `data_spotkania`, `wynik_gospodarz`, `wynik_gosc`, `status`, `liga`, `logo_gospodarza`, `logo_goscia`) VALUES
(1, NULL, 'Man City', 'Sheffield United', '2026-01-28 18:40:30', 1, 1, 'ZAKONCZONY', 'E0', NULL, NULL),
(2, NULL, 'Wolves', 'Crystal Palace', '2026-01-28 18:40:30', 1, 4, 'ZAKONCZONY', 'E0', NULL, NULL),
(3, NULL, 'Newcastle', 'Liverpool', '2026-01-28 18:40:30', 1, 1, 'ZAKONCZONY', 'E0', NULL, NULL),
(4, NULL, 'Burnley', 'Tottenham', '2026-01-28 18:40:30', 1, 2, 'ZAKONCZONY', 'E0', NULL, NULL),
(5, NULL, 'Bournemouth', 'Chelsea', '2026-01-28 18:40:30', 1, 1, 'ZAKONCZONY', 'E0', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `przebieg_meczu`
--

CREATE TABLE `przebieg_meczu` (
  `id` int NOT NULL,
  `mecz_id` int NOT NULL,
  `minuta` int NOT NULL,
  `wynik` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `posiadanie` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `komentarz` text COLLATE utf8mb4_unicode_ci,
  `rozne_gospodarz` int DEFAULT '0',
  `rozne_gosc` int DEFAULT '0',
  `faule_gospodarz` int DEFAULT '0',
  `faule_gosc` int DEFAULT '0',
  `strzaly_gospodarz` int DEFAULT '0',
  `strzaly_gosc` int DEFAULT '0',
  `strzaly_celne_gospodarz` int DEFAULT '0',
  `strzaly_celne_gosc` int DEFAULT '0',
  `zolte_kartki_gospodarz` int DEFAULT '0',
  `zolte_kartki_gosc` int DEFAULT '0',
  `czerwone_kartki_gospodarz` int DEFAULT '0',
  `czerwone_kartki_gosc` int DEFAULT '0',
  `posiadanie_gospodarz` decimal(5,2) DEFAULT '50.00',
  `posiadanie_gosc` decimal(5,2) DEFAULT '50.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `przebieg_meczu`
--

INSERT INTO `przebieg_meczu` (`id`, `mecz_id`, `minuta`, `wynik`, `posiadanie`, `komentarz`, `rozne_gospodarz`, `rozne_gosc`, `faule_gospodarz`, `faule_gosc`, `strzaly_gospodarz`, `strzaly_gosc`, `strzaly_celne_gospodarz`, `strzaly_celne_gosc`, `zolte_kartki_gospodarz`, `zolte_kartki_gosc`, `czerwone_kartki_gospodarz`, `czerwone_kartki_gosc`, `posiadanie_gospodarz`, `posiadanie_gosc`) VALUES
(1, 1, 0, '0:0', 'away', 'Sędzia rozpoczyna mecz! Man City zagrywa pierwszą piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '47.40', '52.60'),
(2, 1, 1, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '46.80', '53.20'),
(3, 1, 2, '0:0', 'away', 'Man City rusza do przodu!', 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, '45.10', '54.90'),
(4, 1, 3, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, '43.80', '56.20'),
(5, 1, 4, '0:0', 'away', 'Faul w środku pola.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '42.50', '57.50'),
(6, 1, 5, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '41.90', '58.10'),
(7, 1, 6, '0:0', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '44.50', '55.50'),
(8, 1, 7, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '42.50', '57.50'),
(9, 1, 8, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '41.60', '58.40'),
(10, 1, 9, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, '44.10', '55.90'),
(11, 1, 10, '0:0', 'away', 'Faul w środku pola.', 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, '44.50', '55.50'),
(12, 1, 11, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, '45.40', '54.60'),
(13, 1, 12, '0:0', 'away', 'Kontra Sheffield United!', 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, '45.20', '54.80'),
(14, 1, 13, '0:0', 'away', 'Faul w środku pola.', 0, 0, 2, 1, 1, 1, 0, 0, 0, 1, 0, 0, '46.00', '54.00'),
(15, 1, 14, '0:1', 'away', 'Trafienie dla Sheffield United!', 0, 0, 2, 1, 1, 2, 0, 1, 0, 1, 0, 0, '44.10', '55.90'),
(16, 1, 15, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 0, 2, 1, 1, 2, 0, 1, 0, 1, 0, 0, '46.20', '53.80'),
(17, 1, 16, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 1, 1, 2, 0, 1, 0, 1, 0, 0, '46.10', '53.90'),
(18, 1, 17, '0:1', 'away', 'Groźna akcja Man City!', 0, 0, 2, 1, 2, 2, 0, 1, 0, 1, 0, 0, '48.40', '51.60'),
(19, 1, 18, '0:1', 'away', 'Man City rusza do przodu!', 0, 0, 2, 1, 3, 2, 1, 1, 0, 1, 0, 0, '49.40', '50.60'),
(20, 1, 19, '0:1', 'away', 'Faul w środku pola.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '47.80', '52.20'),
(21, 1, 20, '0:1', 'away', 'Spokojny fragment meczu.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '48.20', '51.80'),
(22, 1, 21, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '49.70', '50.30'),
(23, 1, 22, '0:1', 'home', 'Wymiana podań w środku pola.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '51.50', '48.50'),
(24, 1, 23, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '50.00', '50.00'),
(25, 1, 24, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '50.70', '49.30'),
(26, 1, 25, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '52.70', '47.30'),
(27, 1, 26, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '52.50', '47.50'),
(28, 1, 27, '0:1', 'home', 'Spokojny fragment meczu.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '51.70', '48.30'),
(29, 1, 28, '0:1', 'away', 'Spokojny fragment meczu.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '49.80', '50.20'),
(30, 1, 29, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '51.90', '48.10'),
(31, 1, 30, '0:1', 'home', 'Spokojny fragment meczu.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '52.30', '47.70'),
(32, 1, 31, '0:1', 'home', 'Spokojny fragment meczu.', 0, 0, 2, 2, 3, 2, 1, 1, 0, 1, 0, 0, '54.20', '45.80'),
(33, 1, 32, '0:1', 'home', 'Groźna akcja Man City!', 0, 0, 2, 2, 4, 2, 1, 1, 0, 1, 0, 0, '53.70', '46.30'),
(34, 1, 33, '0:1', 'home', 'Spokojny fragment meczu.', 0, 0, 2, 2, 4, 2, 1, 1, 0, 1, 0, 0, '51.20', '48.80'),
(35, 1, 34, '0:1', 'away', 'Faul w środku pola.', 0, 0, 2, 3, 4, 2, 1, 1, 0, 1, 0, 0, '49.70', '50.30'),
(36, 1, 35, '0:1', 'away', 'Sheffield United atakuje!', 0, 0, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '48.70', '51.30'),
(37, 1, 36, '0:1', 'home', 'Wymiana podań w środku pola.', 0, 0, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '50.80', '49.20'),
(38, 1, 37, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '48.00', '52.00'),
(39, 1, 38, '0:1', 'away', 'Spokojny fragment meczu.', 0, 0, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '45.80', '54.20'),
(40, 1, 39, '0:1', 'away', 'Rzut rożny.', 0, 1, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '47.80', '52.20'),
(41, 1, 40, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 1, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '50.50', '49.50'),
(42, 1, 41, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 0, 1, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '50.90', '49.10'),
(43, 1, 42, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 1, 2, 3, 4, 3, 1, 2, 0, 1, 0, 0, '49.50', '50.50'),
(44, 1, 43, '0:1', 'home', 'Faul w środku pola.', 0, 1, 2, 4, 4, 3, 1, 2, 0, 2, 0, 0, '50.80', '49.20'),
(45, 1, 44, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 1, 2, 4, 4, 3, 1, 2, 0, 2, 0, 0, '49.30', '50.70'),
(46, 1, 45, '0:1', 'away', 'Koniec pierwszej połowy!', 0, 1, 2, 4, 4, 3, 1, 2, 0, 2, 0, 0, '48.70', '51.30'),
(47, 1, 46, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 1, 2, 4, 4, 3, 1, 2, 0, 2, 0, 0, '49.00', '51.00'),
(48, 1, 47, '0:1', 'away', 'Faul w środku pola.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '49.10', '50.90'),
(49, 1, 48, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '46.60', '53.40'),
(50, 1, 49, '0:1', 'away', 'Spokojny fragment meczu.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '47.40', '52.60'),
(51, 1, 50, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '48.00', '52.00'),
(52, 1, 51, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '48.80', '51.20'),
(53, 1, 52, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '46.00', '54.00'),
(54, 1, 53, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '47.40', '52.60'),
(55, 1, 54, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '47.80', '52.20'),
(56, 1, 55, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '45.70', '54.30'),
(57, 1, 56, '0:1', 'away', 'Spokojny fragment meczu.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '46.70', '53.30'),
(58, 1, 57, '0:1', 'away', 'Spokojny fragment meczu.', 0, 1, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '43.70', '56.30'),
(59, 1, 58, '0:1', 'away', 'Rzut rożny.', 0, 2, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '43.00', '57.00'),
(60, 1, 59, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 2, 3, 4, 4, 3, 1, 2, 0, 2, 0, 0, '45.80', '54.20'),
(61, 1, 60, '0:1', 'away', 'Man City rusza do przodu!', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '48.20', '51.80'),
(62, 1, 61, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '45.30', '54.70'),
(63, 1, 62, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '43.20', '56.80'),
(64, 1, 63, '0:1', 'away', 'Spokojny fragment meczu.', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '44.50', '55.50'),
(65, 1, 64, '0:1', 'away', 'Wymiana podań w środku pola.', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '45.60', '54.40'),
(66, 1, 65, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 0, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '47.70', '52.30'),
(67, 1, 66, '0:1', 'away', 'Rzut rożny.', 1, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '44.90', '55.10'),
(68, 1, 67, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '44.60', '55.40'),
(69, 1, 68, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 3, 4, 5, 3, 1, 2, 0, 2, 0, 0, '46.90', '53.10'),
(70, 1, 69, '0:1', 'away', 'Faul w środku pola.', 1, 2, 3, 5, 5, 3, 1, 2, 0, 2, 0, 0, '45.20', '54.80'),
(71, 1, 70, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 3, 5, 5, 3, 1, 2, 0, 2, 0, 0, '43.40', '56.60'),
(72, 1, 71, '0:1', 'away', 'Faul w środku pola.', 1, 2, 4, 5, 5, 3, 1, 2, 0, 2, 0, 0, '41.10', '58.90'),
(73, 1, 72, '0:1', 'away', 'Spokojny fragment meczu.', 1, 2, 4, 5, 5, 3, 1, 2, 0, 2, 0, 0, '39.50', '60.50'),
(74, 1, 73, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 5, 3, 1, 2, 0, 2, 0, 0, '40.70', '59.30'),
(75, 1, 74, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 5, 3, 1, 2, 0, 2, 0, 0, '38.40', '61.60'),
(76, 1, 75, '0:1', 'away', 'Spokojny fragment meczu.', 1, 2, 4, 5, 5, 3, 1, 2, 0, 2, 0, 0, '38.80', '61.20'),
(77, 1, 76, '0:1', 'away', 'Sheffield United atakuje!', 1, 2, 4, 5, 5, 4, 1, 3, 0, 2, 0, 0, '40.20', '59.80'),
(78, 1, 77, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 5, 4, 1, 3, 0, 2, 0, 0, '42.20', '57.80'),
(79, 1, 78, '0:1', 'away', 'Spokojny fragment meczu.', 1, 2, 4, 5, 5, 4, 1, 3, 0, 2, 0, 0, '44.80', '55.20'),
(80, 1, 79, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 5, 4, 1, 3, 0, 2, 0, 0, '45.30', '54.70'),
(81, 1, 80, '0:1', 'away', 'Man City rusza do przodu!', 1, 2, 4, 5, 6, 4, 1, 3, 0, 2, 0, 0, '43.30', '56.70'),
(82, 1, 81, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 6, 4, 1, 3, 0, 2, 0, 0, '43.40', '56.60'),
(83, 1, 82, '0:1', 'away', 'Wymiana podań w środku pola.', 1, 2, 4, 5, 6, 4, 1, 3, 0, 2, 0, 0, '42.80', '57.20'),
(84, 1, 83, '0:1', 'away', 'Spokojny fragment meczu.', 1, 2, 4, 5, 6, 4, 1, 3, 0, 2, 0, 0, '41.30', '58.70'),
(85, 1, 84, '0:1', 'away', 'Wymiana podań w środku pola.', 1, 2, 4, 5, 6, 4, 1, 3, 0, 2, 0, 0, '41.30', '58.70'),
(86, 1, 85, '0:1', 'away', 'Groźna akcja Man City!', 1, 2, 4, 5, 7, 4, 1, 3, 0, 2, 0, 0, '38.90', '61.10'),
(87, 1, 86, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 1, 2, 4, 5, 7, 4, 1, 3, 0, 2, 0, 0, '36.90', '63.10'),
(88, 1, 87, '0:1', 'away', 'Rzut rożny.', 2, 2, 4, 5, 7, 4, 1, 3, 0, 2, 0, 0, '35.00', '65.00'),
(89, 1, 88, '1:1', 'away', 'GOOOOL! Man City trafia do siatki!', 2, 2, 4, 5, 8, 4, 2, 3, 0, 2, 0, 0, '35.00', '65.00'),
(90, 1, 89, '1:1', 'away', 'Groźna akcja Man City!', 2, 2, 4, 5, 9, 4, 3, 3, 0, 2, 0, 0, '35.00', '65.00'),
(91, 1, 90, '1:1', 'away', 'Koniec meczu!', 2, 2, 4, 5, 9, 4, 3, 3, 0, 2, 0, 0, '37.30', '62.70'),
(92, 2, 0, '0:0', 'away', 'Początek spotkania na stadionie Wolves!', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '49.10', '50.90'),
(93, 2, 1, '0:0', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '49.90', '50.10'),
(94, 2, 2, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.40', '48.60'),
(95, 2, 3, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '48.80', '51.20'),
(96, 2, 4, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '50.60', '49.40'),
(97, 2, 5, '0:0', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '50.00', '50.00'),
(98, 2, 6, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.70', '48.30'),
(99, 2, 7, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '48.80', '51.20'),
(100, 2, 8, '0:0', 'away', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '49.30', '50.70'),
(101, 2, 9, '0:0', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '49.20', '50.80'),
(102, 2, 10, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.80', '48.20'),
(103, 2, 11, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.20', '46.80'),
(104, 2, 12, '0:0', 'home', 'Faul w środku pola.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '52.60', '47.40'),
(105, 2, 13, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '52.30', '47.70'),
(106, 2, 14, '0:0', 'away', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '49.50', '50.50'),
(107, 2, 15, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '51.50', '48.50'),
(108, 2, 16, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '51.20', '48.80'),
(109, 2, 17, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '51.70', '48.30'),
(110, 2, 18, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '51.10', '48.90'),
(111, 2, 19, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '52.60', '47.40'),
(112, 2, 20, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '53.80', '46.20'),
(113, 2, 21, '0:0', 'home', 'Rzut rożny.', 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '51.40', '48.60'),
(114, 2, 22, '0:1', 'away', 'GOOOOL! Crystal Palace zdobywa bramkę!', 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, '49.10', '50.90'),
(115, 2, 23, '0:1', 'home', 'Rzut rożny.', 2, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, '50.20', '49.80'),
(116, 2, 24, '0:1', 'away', 'Spokojny fragment meczu.', 2, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, '47.40', '52.60'),
(117, 2, 25, '0:1', 'away', 'Spokojny fragment meczu.', 2, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, '45.10', '54.90'),
(118, 2, 26, '0:1', 'away', 'Crystal Palace atakuje!', 2, 0, 0, 1, 0, 2, 0, 2, 0, 0, 0, 0, '44.50', '55.50'),
(119, 2, 27, '0:2', 'away', 'GOOOOL! Crystal Palace zdobywa bramkę!', 2, 0, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '45.80', '54.20'),
(120, 2, 28, '0:2', 'away', 'Wymiana podań w środku pola.', 2, 0, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '48.10', '51.90'),
(121, 2, 29, '0:2', 'away', 'Wymiana podań w środku pola.', 2, 0, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '45.10', '54.90'),
(122, 2, 30, '0:2', 'away', 'Spokojny fragment meczu.', 2, 0, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '43.90', '56.10'),
(123, 2, 31, '0:2', 'away', 'Rzut rożny.', 3, 0, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '43.70', '56.30'),
(124, 2, 32, '0:2', 'away', 'Rzut rożny.', 3, 1, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '41.30', '58.70'),
(125, 2, 33, '0:2', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '41.80', '58.20'),
(126, 2, 34, '0:2', 'away', 'Wymiana podań w środku pola.', 3, 1, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '40.20', '59.80'),
(127, 2, 35, '0:2', 'away', 'Wymiana podań w środku pola.', 3, 1, 0, 1, 0, 3, 0, 3, 0, 0, 0, 0, '37.70', '62.30'),
(128, 2, 36, '0:3', 'away', 'Trafienie dla Crystal Palace!', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '35.20', '64.80'),
(129, 2, 37, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '35.00', '65.00'),
(130, 2, 38, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '35.10', '64.90'),
(131, 2, 39, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '35.00', '65.00'),
(132, 2, 40, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '37.00', '63.00'),
(133, 2, 41, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, '35.00', '65.00'),
(134, 2, 42, '0:3', 'away', 'Wolves rusza do przodu!', 3, 1, 0, 1, 1, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(135, 2, 43, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 0, 1, 1, 4, 1, 4, 0, 0, 0, 0, '37.30', '62.70'),
(136, 2, 44, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 0, 1, 1, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(137, 2, 45, '0:3', 'away', 'Przerwa w meczu.', 3, 1, 0, 1, 1, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(138, 2, 46, '0:3', 'away', 'Faul w środku pola.', 3, 1, 1, 1, 1, 4, 1, 4, 0, 0, 0, 0, '36.50', '63.50'),
(139, 2, 47, '0:3', 'away', 'Faul w środku pola.', 3, 1, 2, 1, 1, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(140, 2, 48, '0:3', 'away', 'Faul w środku pola.', 3, 1, 2, 2, 1, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(141, 2, 49, '0:3', 'away', 'Wolves rusza do przodu!', 3, 1, 2, 2, 2, 4, 1, 4, 0, 0, 0, 0, '35.00', '65.00'),
(142, 2, 50, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 2, 2, 2, 4, 1, 4, 0, 0, 0, 0, '37.50', '62.50'),
(143, 2, 51, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 2, 2, 2, 4, 1, 4, 0, 0, 0, 0, '39.90', '60.10'),
(144, 2, 52, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 2, 2, 2, 4, 1, 4, 0, 0, 0, 0, '40.40', '59.60'),
(145, 2, 53, '0:3', 'away', 'Faul w środku pola.', 3, 1, 3, 2, 2, 4, 1, 4, 0, 0, 0, 0, '43.40', '56.60'),
(146, 2, 54, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 2, 2, 4, 1, 4, 0, 0, 0, 0, '42.00', '58.00'),
(147, 2, 55, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 3, 2, 2, 4, 1, 4, 0, 0, 0, 0, '44.90', '55.10'),
(148, 2, 56, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 2, 2, 4, 1, 4, 0, 0, 0, 0, '46.10', '53.90'),
(149, 2, 57, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 2, 2, 4, 1, 4, 0, 0, 0, 0, '47.50', '52.50'),
(150, 2, 58, '0:3', 'away', 'Wolves rusza do przodu!', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '48.00', '52.00'),
(151, 2, 59, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '46.30', '53.70'),
(152, 2, 60, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '44.80', '55.20'),
(153, 2, 61, '0:3', 'away', 'Wymiana podań w środku pola.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '45.00', '55.00'),
(154, 2, 62, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '46.70', '53.30'),
(155, 2, 63, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '44.60', '55.40'),
(156, 2, 64, '0:3', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 2, 3, 4, 2, 4, 0, 0, 0, 0, '43.10', '56.90'),
(157, 2, 65, '0:3', 'away', 'Crystal Palace atakuje!', 3, 1, 3, 2, 3, 5, 2, 4, 0, 0, 0, 0, '44.30', '55.70'),
(158, 2, 66, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 2, 3, 5, 2, 4, 0, 0, 0, 0, '47.10', '52.90'),
(159, 2, 67, '0:3', 'away', 'Crystal Palace atakuje!', 3, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '45.60', '54.40'),
(160, 2, 68, '0:3', 'away', 'Rzut rożny.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '46.40', '53.60'),
(161, 2, 69, '0:3', 'away', 'Wymiana podań w środku pola.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '45.10', '54.90'),
(162, 2, 70, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '46.00', '54.00'),
(163, 2, 71, '0:3', 'away', 'Spokojny fragment meczu.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '46.50', '53.50'),
(164, 2, 72, '0:3', 'away', 'Spokojny fragment meczu.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '49.20', '50.80'),
(165, 2, 73, '0:3', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 3, 2, 3, 6, 2, 4, 0, 0, 0, 0, '46.40', '53.60'),
(166, 2, 74, '0:4', 'away', 'Trafienie dla Crystal Palace!', 4, 1, 3, 2, 3, 7, 2, 5, 0, 0, 0, 0, '47.50', '52.50'),
(167, 2, 75, '0:4', 'away', 'Rzut rożny.', 4, 2, 3, 2, 3, 7, 2, 5, 0, 0, 0, 0, '49.40', '50.60'),
(168, 2, 76, '0:4', 'away', 'Rzut rożny.', 5, 2, 3, 2, 3, 7, 2, 5, 0, 0, 0, 0, '48.10', '51.90'),
(169, 2, 77, '0:4', 'away', 'Obie drużyny kontrolują piłkę.', 5, 2, 3, 2, 3, 7, 2, 5, 0, 0, 0, 0, '49.80', '50.20'),
(170, 2, 78, '0:4', 'home', 'Rzut rożny.', 6, 2, 3, 2, 3, 7, 2, 5, 0, 0, 0, 0, '50.10', '49.90'),
(171, 2, 79, '1:4', 'home', 'Bramka dla Wolves!', 6, 2, 3, 2, 4, 7, 3, 5, 0, 0, 0, 0, '52.50', '47.50'),
(172, 2, 80, '1:4', 'home', 'Kontra Crystal Palace!', 6, 2, 3, 2, 4, 8, 3, 5, 0, 0, 0, 0, '51.10', '48.90'),
(173, 2, 81, '1:4', 'away', 'Wymiana podań w środku pola.', 6, 2, 3, 2, 4, 8, 3, 5, 0, 0, 0, 0, '49.40', '50.60'),
(174, 2, 82, '1:4', 'home', 'Spokojny fragment meczu.', 6, 2, 3, 2, 4, 8, 3, 5, 0, 0, 0, 0, '50.10', '49.90'),
(175, 2, 83, '1:4', 'away', 'Obie drużyny kontrolują piłkę.', 6, 2, 3, 2, 4, 8, 3, 5, 0, 0, 0, 0, '48.30', '51.70'),
(176, 2, 84, '1:4', 'away', 'Spokojny fragment meczu.', 6, 2, 3, 2, 4, 8, 3, 5, 0, 0, 0, 0, '46.90', '53.10'),
(177, 2, 85, '1:4', 'away', 'Faul w środku pola.', 6, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '43.90', '56.10'),
(178, 2, 86, '1:4', 'away', 'Rzut rożny.', 7, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '43.10', '56.90'),
(179, 2, 87, '1:4', 'away', 'Wymiana podań w środku pola.', 7, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '40.80', '59.20'),
(180, 2, 88, '1:4', 'away', 'Spokojny fragment meczu.', 7, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '42.70', '57.30'),
(181, 2, 89, '1:4', 'away', 'Spokojny fragment meczu.', 7, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '41.80', '58.20'),
(182, 2, 90, '1:4', 'away', 'Koniec meczu!', 7, 2, 3, 3, 4, 8, 3, 5, 0, 0, 0, 0, '41.20', '58.80'),
(183, 3, 0, '0:0', 'home', 'Początek spotkania na stadionie Newcastle!', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.40', '48.60'),
(184, 3, 1, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.30', '46.70'),
(185, 3, 2, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.10', '43.90'),
(186, 3, 3, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.70', '46.30'),
(187, 3, 4, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.70', '46.30'),
(188, 3, 5, '0:0', 'home', 'Rzut rożny.', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.60', '43.40'),
(189, 3, 6, '0:0', 'home', 'Newcastle rusza do przodu!', 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '55.50', '44.50'),
(190, 3, 7, '0:0', 'home', 'Rzut rożny.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '56.80', '43.20'),
(191, 3, 8, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '55.40', '44.60'),
(192, 3, 9, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '58.20', '41.80'),
(193, 3, 10, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '57.80', '42.20'),
(194, 3, 11, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '56.20', '43.80'),
(195, 3, 12, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '53.90', '46.10'),
(196, 3, 13, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '54.70', '45.30'),
(197, 3, 14, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '55.50', '44.50'),
(198, 3, 15, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '57.60', '42.40'),
(199, 3, 16, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '57.70', '42.30'),
(200, 3, 17, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '59.50', '40.50'),
(201, 3, 18, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '59.10', '40.90'),
(202, 3, 19, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '60.10', '39.90'),
(203, 3, 20, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '61.50', '38.50'),
(204, 3, 21, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '60.90', '39.10'),
(205, 3, 22, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '62.70', '37.30'),
(206, 3, 23, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '63.80', '36.20'),
(207, 3, 24, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '61.80', '38.20'),
(208, 3, 25, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, '63.90', '36.10'),
(209, 3, 26, '0:0', 'home', 'Groźna akcja Newcastle!', 2, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '63.60', '36.40'),
(210, 3, 27, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '61.90', '38.10'),
(211, 3, 28, '0:0', 'home', 'Wymiana podań w środku pola.', 2, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '63.80', '36.20'),
(212, 3, 29, '0:0', 'home', 'Spokojny fragment meczu.', 2, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(213, 3, 30, '0:0', 'home', 'Rzut rożny.', 3, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '63.30', '36.70'),
(214, 3, 31, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '64.40', '35.60'),
(215, 3, 32, '0:0', 'home', 'Spokojny fragment meczu.', 3, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '61.50', '38.50'),
(216, 3, 33, '0:0', 'home', 'Wymiana podań w środku pola.', 3, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, '62.50', '37.50'),
(217, 3, 34, '0:0', 'home', 'Faul w środku pola.', 3, 0, 0, 1, 2, 0, 1, 0, 0, 0, 0, 0, '60.30', '39.70'),
(218, 3, 35, '0:0', 'home', 'Faul w środku pola.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '62.90', '37.10'),
(219, 3, 36, '0:0', 'home', 'Spokojny fragment meczu.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '62.00', '38.00'),
(220, 3, 37, '0:0', 'home', 'Spokojny fragment meczu.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '63.30', '36.70'),
(221, 3, 38, '0:0', 'home', 'Wymiana podań w środku pola.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '63.90', '36.10'),
(222, 3, 39, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(223, 3, 40, '0:0', 'home', 'Spokojny fragment meczu.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(224, 3, 41, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(225, 3, 42, '0:0', 'home', 'Wymiana podań w środku pola.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(226, 3, 43, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 0, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, '65.00', '35.00'),
(227, 3, 44, '0:0', 'home', 'Kontra Liverpool!', 3, 0, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, '65.00', '35.00'),
(228, 3, 45, '0:0', 'home', 'Przerwa w meczu.', 3, 0, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, '65.00', '35.00'),
(229, 3, 46, '0:0', 'home', 'Wymiana podań w środku pola.', 3, 0, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, '62.90', '37.10'),
(230, 3, 47, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 0, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, '65.00', '35.00'),
(231, 3, 48, '0:0', 'home', 'Spokojny fragment meczu.', 3, 0, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, '65.00', '35.00'),
(232, 3, 49, '0:1', 'home', 'Trafienie dla Liverpool!', 3, 0, 1, 1, 2, 2, 1, 2, 0, 0, 0, 0, '63.70', '36.30'),
(233, 3, 50, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 0, 1, 1, 2, 2, 1, 2, 0, 0, 0, 0, '65.00', '35.00'),
(234, 3, 51, '0:1', 'home', 'Rzut rożny.', 3, 1, 1, 1, 2, 2, 1, 2, 0, 0, 0, 0, '63.10', '36.90'),
(235, 3, 52, '0:1', 'home', 'Liverpool atakuje!', 3, 1, 1, 1, 2, 3, 1, 2, 0, 0, 0, 0, '63.90', '36.10'),
(236, 3, 53, '0:1', 'home', 'Kontra Liverpool!', 3, 1, 1, 1, 2, 4, 1, 3, 0, 0, 0, 0, '65.00', '35.00'),
(237, 3, 54, '0:1', 'home', 'Kontra Liverpool!', 3, 1, 1, 1, 2, 5, 1, 4, 0, 0, 0, 0, '64.80', '35.20'),
(238, 3, 55, '0:1', 'home', 'Faul w środku pola.', 3, 1, 2, 1, 2, 5, 1, 4, 0, 0, 0, 0, '65.00', '35.00'),
(239, 3, 56, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 2, 5, 1, 4, 0, 0, 0, 0, '63.30', '36.70'),
(240, 3, 57, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 2, 1, 2, 5, 1, 4, 0, 0, 0, 0, '61.90', '38.10'),
(241, 3, 58, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 2, 1, 2, 5, 1, 4, 0, 0, 0, 0, '62.90', '37.10'),
(242, 3, 59, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 2, 5, 1, 4, 0, 0, 0, 0, '62.60', '37.40'),
(243, 3, 60, '0:1', 'home', 'Newcastle rusza do przodu!', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '60.90', '39.10'),
(244, 3, 61, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '61.00', '39.00'),
(245, 3, 62, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '58.00', '42.00'),
(246, 3, 63, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '58.80', '41.20'),
(247, 3, 64, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '56.70', '43.30'),
(248, 3, 65, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '59.00', '41.00'),
(249, 3, 66, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '59.60', '40.40'),
(250, 3, 67, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '57.10', '42.90'),
(251, 3, 68, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '56.20', '43.80'),
(252, 3, 69, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '53.50', '46.50'),
(253, 3, 70, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '51.70', '48.30'),
(254, 3, 71, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '52.70', '47.30'),
(255, 3, 72, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '52.80', '47.20'),
(256, 3, 73, '0:1', 'home', 'Rzut rożny.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '50.80', '49.20'),
(257, 3, 74, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '52.80', '47.20'),
(258, 3, 75, '0:1', 'home', 'Spokojny fragment meczu.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '50.50', '49.50'),
(259, 3, 76, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '47.80', '52.20'),
(260, 3, 77, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '49.70', '50.30'),
(261, 3, 78, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '49.70', '50.30'),
(262, 3, 79, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '48.00', '52.00'),
(263, 3, 80, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '50.00', '50.00'),
(264, 3, 81, '0:1', 'away', 'Spokojny fragment meczu.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '49.10', '50.90'),
(265, 3, 82, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '47.10', '52.90'),
(266, 3, 83, '0:1', 'away', 'Spokojny fragment meczu.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '47.90', '52.10'),
(267, 3, 84, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '47.20', '52.80'),
(268, 3, 85, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '48.50', '51.50'),
(269, 3, 86, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 3, 5, 1, 4, 0, 0, 0, 0, '48.80', '51.20'),
(270, 3, 87, '1:1', 'away', 'Bramka dla Newcastle!', 3, 2, 2, 1, 4, 5, 2, 4, 0, 0, 0, 0, '49.10', '50.90'),
(271, 3, 88, '1:1', 'away', 'Wymiana podań w środku pola.', 3, 2, 2, 1, 4, 5, 2, 4, 0, 0, 0, 0, '47.30', '52.70'),
(272, 3, 89, '1:1', 'away', 'Spokojny fragment meczu.', 3, 2, 2, 1, 4, 5, 2, 4, 0, 0, 0, 0, '47.60', '52.40'),
(273, 3, 90, '1:1', 'away', 'Koniec meczu!', 3, 2, 2, 1, 4, 5, 2, 4, 0, 0, 0, 0, '49.30', '50.70'),
(274, 4, 0, '0:0', 'away', 'Sędzia rozpoczyna mecz! Burnley zagrywa pierwszą piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '50.00', '50.00'),
(275, 4, 1, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '52.00', '48.00'),
(276, 4, 2, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '50.40', '49.60'),
(277, 4, 3, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.20', '46.80'),
(278, 4, 4, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '52.70', '47.30'),
(279, 4, 5, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.40', '45.60'),
(280, 4, 6, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '55.90', '44.10'),
(281, 4, 7, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.70', '43.30'),
(282, 4, 8, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '57.30', '42.70'),
(283, 4, 9, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.00', '44.00'),
(284, 4, 10, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.00', '44.00'),
(285, 4, 11, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '57.30', '42.70'),
(286, 4, 12, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.30', '43.70'),
(287, 4, 13, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '58.30', '41.70'),
(288, 4, 14, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '59.50', '40.50'),
(289, 4, 15, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '58.60', '41.40'),
(290, 4, 16, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '59.40', '40.60'),
(291, 4, 17, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '57.40', '42.60'),
(292, 4, 18, '0:0', 'home', 'Spokojny fragment meczu.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '57.70', '42.30'),
(293, 4, 19, '0:0', 'home', 'Rzut rożny.', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '60.50', '39.50'),
(294, 4, 20, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '60.90', '39.10'),
(295, 4, 21, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '61.00', '39.00'),
(296, 4, 22, '0:0', 'home', 'Rzut rożny.', 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '62.80', '37.20'),
(297, 4, 23, '0:0', 'home', 'Tottenham atakuje!', 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, '61.60', '38.40'),
(298, 4, 24, '0:0', 'home', 'Rzut rożny.', 2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, '61.20', '38.80'),
(299, 4, 25, '0:0', 'home', 'Faul w środku pola.', 2, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '60.40', '39.60'),
(300, 4, 26, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '59.90', '40.10'),
(301, 4, 27, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '59.70', '40.30'),
(302, 4, 28, '0:0', 'home', 'Rzut rożny.', 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '59.10', '40.90'),
(303, 4, 29, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '58.30', '41.70'),
(304, 4, 30, '0:0', 'home', 'Spokojny fragment meczu.', 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '61.30', '38.70'),
(305, 4, 31, '0:0', 'home', 'Spokojny fragment meczu.', 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '59.20', '40.80'),
(306, 4, 32, '0:0', 'home', 'Spokojny fragment meczu.', 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, '58.40', '41.60'),
(307, 4, 33, '0:0', 'home', 'Burnley rusza do przodu!', 2, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '58.20', '41.80'),
(308, 4, 34, '0:0', 'home', 'Rzut rożny.', 3, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '57.70', '42.30'),
(309, 4, 35, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '56.00', '44.00'),
(310, 4, 36, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '53.10', '46.90'),
(311, 4, 37, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 3, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '52.00', '48.00'),
(312, 4, 38, '0:0', 'away', 'Rzut rożny.', 3, 3, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '49.90', '50.10'),
(313, 4, 39, '0:0', 'home', 'Spokojny fragment meczu.', 3, 3, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, '50.60', '49.40'),
(314, 4, 40, '0:1', 'home', 'Trafienie dla Tottenham!', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '50.40', '49.60'),
(315, 4, 41, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '48.60', '51.40'),
(316, 4, 42, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '48.30', '51.70'),
(317, 4, 43, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '49.70', '50.30'),
(318, 4, 44, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '47.10', '52.90'),
(319, 4, 45, '0:1', 'away', 'Koniec pierwszej połowy!', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '50.00', '50.00'),
(320, 4, 46, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 3, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, '52.70', '47.30'),
(321, 4, 47, '0:1', 'away', 'Faul w środku pola.', 3, 3, 1, 1, 1, 2, 0, 1, 0, 0, 0, 0, '49.90', '50.10'),
(322, 4, 48, '0:1', 'away', 'Faul w środku pola.', 3, 3, 1, 2, 1, 2, 0, 1, 0, 0, 0, 0, '47.10', '52.90'),
(323, 4, 49, '0:1', 'away', 'Burnley rusza do przodu!', 3, 3, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, '48.70', '51.30'),
(324, 4, 50, '0:1', 'home', 'Spokojny fragment meczu.', 3, 3, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, '50.80', '49.20'),
(325, 4, 51, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, '48.70', '51.30'),
(326, 4, 52, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, '46.20', '53.80'),
(327, 4, 53, '0:1', 'away', 'Kontra Tottenham!', 3, 3, 1, 2, 2, 3, 1, 1, 0, 0, 0, 0, '43.20', '56.80'),
(328, 4, 54, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 2, 2, 3, 1, 1, 0, 0, 0, 0, '40.60', '59.40'),
(329, 4, 55, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 3, 1, 2, 2, 3, 1, 1, 0, 0, 0, 0, '37.80', '62.20'),
(330, 4, 56, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 3, 1, 2, 2, 3, 1, 1, 0, 0, 0, 0, '40.20', '59.80'),
(331, 4, 57, '0:1', 'away', 'Tottenham atakuje!', 3, 3, 1, 2, 2, 4, 1, 1, 0, 0, 0, 0, '38.60', '61.40'),
(332, 4, 58, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 3, 1, 2, 2, 4, 1, 1, 0, 0, 0, 0, '40.80', '59.20'),
(333, 4, 59, '0:1', 'away', 'Tottenham atakuje!', 3, 3, 1, 2, 2, 5, 1, 1, 0, 0, 0, 0, '42.30', '57.70'),
(334, 4, 60, '0:1', 'away', 'Spokojny fragment meczu.', 3, 3, 1, 2, 2, 5, 1, 1, 0, 0, 0, 0, '44.20', '55.80'),
(335, 4, 61, '0:1', 'away', 'Faul w środku pola.', 3, 3, 1, 3, 2, 5, 1, 1, 0, 0, 0, 0, '43.10', '56.90'),
(336, 4, 62, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 3, 1, 3, 2, 5, 1, 1, 0, 0, 0, 0, '42.90', '57.10'),
(337, 4, 63, '0:1', 'away', 'Rzut rożny.', 3, 4, 1, 3, 2, 5, 1, 1, 0, 0, 0, 0, '41.90', '58.10'),
(338, 4, 64, '1:1', 'away', 'Bramka dla Burnley!', 3, 4, 1, 3, 3, 5, 2, 1, 0, 0, 0, 0, '44.20', '55.80'),
(339, 4, 65, '1:1', 'away', 'Spokojny fragment meczu.', 3, 4, 1, 3, 3, 5, 2, 1, 0, 0, 0, 0, '45.20', '54.80'),
(340, 4, 66, '1:1', 'away', 'Wymiana podań w środku pola.', 3, 4, 1, 3, 3, 5, 2, 1, 0, 0, 0, 0, '47.30', '52.70'),
(341, 4, 67, '1:1', 'away', 'Spokojny fragment meczu.', 3, 4, 1, 3, 3, 5, 2, 1, 0, 0, 0, 0, '46.90', '53.10'),
(342, 4, 68, '1:1', 'away', 'Faul w środku pola.', 3, 4, 1, 4, 3, 5, 2, 1, 0, 1, 0, 0, '46.80', '53.20'),
(343, 4, 69, '1:1', 'away', 'Groźna akcja Burnley!', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '49.50', '50.50'),
(344, 4, 70, '1:1', 'away', 'Spokojny fragment meczu.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '49.10', '50.90'),
(345, 4, 71, '1:1', 'away', 'Spokojny fragment meczu.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '49.90', '50.10'),
(346, 4, 72, '1:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '50.70', '49.30'),
(347, 4, 73, '1:1', 'home', 'Wymiana podań w środku pola.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '52.50', '47.50'),
(348, 4, 74, '1:1', 'home', 'Spokojny fragment meczu.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '51.90', '48.10'),
(349, 4, 75, '1:1', 'home', 'Wymiana podań w środku pola.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '52.60', '47.40'),
(350, 4, 76, '1:1', 'home', 'Spokojny fragment meczu.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '50.10', '49.90'),
(351, 4, 77, '1:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 4, 1, 4, 4, 5, 3, 1, 0, 1, 0, 0, '47.70', '52.30'),
(352, 4, 78, '1:1', 'away', 'Groźna akcja Burnley!', 3, 4, 1, 4, 5, 5, 3, 1, 0, 1, 0, 0, '47.00', '53.00'),
(353, 4, 79, '1:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 4, 1, 4, 5, 5, 3, 1, 0, 1, 0, 0, '48.40', '51.60'),
(354, 4, 80, '1:1', 'home', 'Wymiana podań w środku pola.', 3, 4, 1, 4, 5, 5, 3, 1, 0, 1, 0, 0, '51.20', '48.80'),
(355, 4, 81, '1:1', 'home', 'Tottenham atakuje!', 3, 4, 1, 4, 5, 6, 3, 1, 0, 1, 0, 0, '52.90', '47.10'),
(356, 4, 82, '1:1', 'home', 'Wymiana podań w środku pola.', 3, 4, 1, 4, 5, 6, 3, 1, 0, 1, 0, 0, '50.40', '49.60'),
(357, 4, 83, '1:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 4, 1, 4, 5, 6, 3, 1, 0, 1, 0, 0, '47.40', '52.60'),
(358, 4, 84, '1:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 4, 1, 4, 5, 6, 3, 1, 0, 1, 0, 0, '45.20', '54.80'),
(359, 4, 85, '1:1', 'away', 'Spokojny fragment meczu.', 3, 4, 1, 4, 5, 6, 3, 1, 0, 1, 0, 0, '44.30', '55.70'),
(360, 4, 86, '1:2', 'away', 'Trafienie dla Tottenham!', 3, 4, 1, 4, 5, 7, 3, 2, 0, 1, 0, 0, '42.70', '57.30'),
(361, 4, 87, '1:2', 'away', 'Rzut rożny.', 4, 4, 1, 4, 5, 7, 3, 2, 0, 1, 0, 0, '42.10', '57.90'),
(362, 4, 88, '1:2', 'away', 'Kontra Tottenham!', 4, 4, 1, 4, 5, 8, 3, 3, 0, 1, 0, 0, '43.20', '56.80'),
(363, 4, 89, '1:2', 'away', 'Spokojny fragment meczu.', 4, 4, 1, 4, 5, 8, 3, 3, 0, 1, 0, 0, '41.30', '58.70'),
(364, 4, 90, '1:2', 'away', 'Sędzia kończy spotkanie!', 4, 4, 1, 4, 5, 8, 3, 3, 0, 1, 0, 0, '39.50', '60.50'),
(365, 5, 0, '0:0', 'home', 'Sędzia rozpoczyna mecz! Bournemouth zagrywa pierwszą piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.10', '48.90'),
(366, 5, 1, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.00', '47.00'),
(367, 5, 2, '0:0', 'home', 'Wymiana podań w środku pola.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '50.70', '49.30'),
(368, 5, 3, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.40', '48.60'),
(369, 5, 4, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.60', '48.40'),
(370, 5, 5, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.00', '46.00'),
(371, 5, 6, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '51.20', '48.80'),
(372, 5, 7, '0:0', 'home', 'Rzut rożny.', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.30', '46.70'),
(373, 5, 8, '0:0', 'home', 'Faul w środku pola.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.60', '46.40'),
(374, 5, 9, '0:0', 'home', 'Wymiana podań w środku pola.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.20', '45.80'),
(375, 5, 10, '0:0', 'home', 'Wymiana podań w środku pola.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.10', '45.90'),
(376, 5, 11, '0:0', 'home', 'Spokojny fragment meczu.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.20', '43.80'),
(377, 5, 12, '0:0', 'home', 'Spokojny fragment meczu.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '55.40', '44.60'),
(378, 5, 13, '0:0', 'home', 'Spokojny fragment meczu.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.20', '43.80'),
(379, 5, 14, '0:0', 'home', 'Spokojny fragment meczu.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.00', '44.00'),
(380, 5, 15, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.20', '43.80'),
(381, 5, 16, '0:0', 'home', 'Faul w środku pola.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.70', '46.30'),
(382, 5, 17, '0:0', 'home', 'Spokojny fragment meczu.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '55.50', '44.50'),
(383, 5, 18, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.10', '45.90'),
(384, 5, 19, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '53.10', '46.90'),
(385, 5, 20, '0:0', 'home', 'Wymiana podań w środku pola.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '54.10', '45.90'),
(386, 5, 21, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '55.50', '44.50'),
(387, 5, 22, '0:0', 'home', 'Rzut rożny.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.80', '43.20'),
(388, 5, 23, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.50', '43.50'),
(389, 5, 24, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '57.10', '42.90'),
(390, 5, 25, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '58.80', '41.20'),
(391, 5, 26, '0:0', 'home', 'Obie drużyny kontrolują piłkę.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '59.10', '40.90'),
(392, 5, 27, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '56.70', '43.30'),
(393, 5, 28, '0:0', 'home', 'Chelsea atakuje!', 1, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, '58.60', '41.40'),
(394, 5, 29, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, '57.50', '42.50'),
(395, 5, 30, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, '58.60', '41.40'),
(396, 5, 31, '0:0', 'home', 'Wymiana podań w środku pola.', 1, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, '59.30', '40.70'),
(397, 5, 32, '0:0', 'home', 'Kontra Chelsea!', 1, 1, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, '60.70', '39.30'),
(398, 5, 33, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, '58.40', '41.60'),
(399, 5, 34, '0:0', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, '60.00', '40.00'),
(400, 5, 35, '0:1', 'home', 'GOOOOL! Chelsea zdobywa bramkę!', 1, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '60.40', '39.60'),
(401, 5, 36, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 1, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '61.20', '38.80'),
(402, 5, 37, '0:1', 'home', 'Wymiana podań w środku pola.', 1, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '64.00', '36.00'),
(403, 5, 38, '0:1', 'home', 'Spokojny fragment meczu.', 1, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '62.90', '37.10'),
(404, 5, 39, '0:1', 'home', 'Rzut rożny.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '61.30', '38.70'),
(405, 5, 40, '0:1', 'home', 'Spokojny fragment meczu.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '60.90', '39.10'),
(406, 5, 41, '0:1', 'home', 'Spokojny fragment meczu.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '62.00', '38.00'),
(407, 5, 42, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '59.80', '40.20'),
(408, 5, 43, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '57.60', '42.40'),
(409, 5, 44, '0:1', 'home', 'Spokojny fragment meczu.', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '54.80', '45.20'),
(410, 5, 45, '0:1', 'home', 'Koniec pierwszej połowy!', 2, 1, 2, 0, 0, 3, 0, 1, 0, 0, 0, 0, '55.50', '44.50'),
(411, 5, 46, '0:1', 'home', 'Faul w środku pola.', 2, 1, 3, 0, 0, 3, 0, 1, 0, 0, 0, 0, '56.80', '43.20'),
(412, 5, 47, '0:1', 'home', 'Rzut rożny.', 3, 1, 3, 0, 0, 3, 0, 1, 0, 0, 0, 0, '59.50', '40.50'),
(413, 5, 48, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 0, 3, 0, 1, 0, 0, 0, 0, '60.80', '39.20'),
(414, 5, 49, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 0, 0, 3, 0, 1, 0, 0, 0, 0, '58.10', '41.90'),
(415, 5, 50, '0:1', 'home', 'Chelsea atakuje!', 3, 1, 3, 0, 0, 4, 0, 1, 0, 0, 0, 0, '56.50', '43.50'),
(416, 5, 51, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 0, 4, 0, 1, 0, 0, 0, 0, '55.20', '44.80'),
(417, 5, 52, '0:1', 'home', 'Chelsea atakuje!', 3, 1, 3, 0, 0, 5, 0, 2, 0, 0, 0, 0, '54.00', '46.00'),
(418, 5, 53, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 3, 0, 0, 5, 0, 2, 0, 0, 0, 0, '53.20', '46.80'),
(419, 5, 54, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 0, 5, 0, 2, 0, 0, 0, 0, '51.00', '49.00'),
(420, 5, 55, '0:1', 'away', 'Bournemouth rusza do przodu!', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '50.00', '50.00'),
(421, 5, 56, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '50.50', '49.50'),
(422, 5, 57, '0:1', 'away', 'Spokojny fragment meczu.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '48.10', '51.90'),
(423, 5, 58, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '47.80', '52.20'),
(424, 5, 59, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '49.30', '50.70'),
(425, 5, 60, '0:1', 'away', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '47.80', '52.20'),
(426, 5, 61, '0:1', 'home', 'Wymiana podań w środku pola.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '50.20', '49.80'),
(427, 5, 62, '0:1', 'home', 'Spokojny fragment meczu.', 3, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '51.60', '48.40'),
(428, 5, 63, '0:1', 'away', 'Rzut rożny.', 4, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '49.10', '50.90'),
(429, 5, 64, '0:1', 'away', 'Wymiana podań w środku pola.', 4, 1, 3, 0, 1, 5, 1, 2, 0, 0, 0, 0, '47.90', '52.10'),
(430, 5, 65, '0:1', 'away', 'Chelsea atakuje!', 4, 1, 3, 0, 1, 6, 1, 2, 0, 0, 0, 0, '48.50', '51.50'),
(431, 5, 66, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 3, 0, 1, 6, 1, 2, 0, 0, 0, 0, '47.30', '52.70'),
(432, 5, 67, '0:1', 'away', 'Faul w środku pola.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '48.50', '51.50'),
(433, 5, 68, '0:1', 'away', 'Wymiana podań w środku pola.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '48.80', '51.20'),
(434, 5, 69, '0:1', 'home', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '51.00', '49.00'),
(435, 5, 70, '0:1', 'home', 'Obie drużyny kontrolują piłkę.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '52.20', '47.80'),
(436, 5, 71, '0:1', 'home', 'Wymiana podań w środku pola.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '51.50', '48.50'),
(437, 5, 72, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '48.60', '51.40'),
(438, 5, 73, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '46.20', '53.80'),
(439, 5, 74, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 4, 0, 1, 6, 1, 2, 0, 0, 0, 0, '45.10', '54.90'),
(440, 5, 75, '0:1', 'away', 'Kontra Chelsea!', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '45.10', '54.90'),
(441, 5, 76, '0:1', 'away', 'Wymiana podań w środku pola.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '43.00', '57.00'),
(442, 5, 77, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '43.20', '56.80'),
(443, 5, 78, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '41.50', '58.50'),
(444, 5, 79, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '43.60', '56.40'),
(445, 5, 80, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '41.60', '58.40'),
(446, 5, 81, '0:1', 'away', 'Spokojny fragment meczu.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '42.00', '58.00'),
(447, 5, 82, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 4, 1, 4, 0, 1, 7, 1, 2, 0, 0, 0, 0, '44.20', '55.80'),
(448, 5, 83, '0:1', 'away', 'Bournemouth rusza do przodu!', 4, 1, 4, 0, 2, 7, 1, 2, 0, 0, 0, 0, '41.20', '58.80'),
(449, 5, 84, '0:1', 'away', 'Rzut rożny.', 5, 1, 4, 0, 2, 7, 1, 2, 0, 0, 0, 0, '39.30', '60.70'),
(450, 5, 85, '0:1', 'away', 'Obie drużyny kontrolują piłkę.', 5, 1, 4, 0, 2, 7, 1, 2, 0, 0, 0, 0, '40.20', '59.80'),
(451, 5, 86, '0:1', 'away', 'Wymiana podań w środku pola.', 5, 1, 4, 0, 2, 7, 1, 2, 0, 0, 0, 0, '42.80', '57.20'),
(452, 5, 87, '1:1', 'away', 'GOOOOL! Bournemouth trafia do siatki!', 5, 1, 4, 0, 3, 7, 2, 2, 0, 0, 0, 0, '43.30', '56.70');
INSERT INTO `przebieg_meczu` (`id`, `mecz_id`, `minuta`, `wynik`, `posiadanie`, `komentarz`, `rozne_gospodarz`, `rozne_gosc`, `faule_gospodarz`, `faule_gosc`, `strzaly_gospodarz`, `strzaly_gosc`, `strzaly_celne_gospodarz`, `strzaly_celne_gosc`, `zolte_kartki_gospodarz`, `zolte_kartki_gosc`, `czerwone_kartki_gospodarz`, `czerwone_kartki_gosc`, `posiadanie_gospodarz`, `posiadanie_gosc`) VALUES
(453, 5, 88, '1:1', 'away', 'Obie drużyny kontrolują piłkę.', 5, 1, 4, 0, 3, 7, 2, 2, 0, 0, 0, 0, '42.00', '58.00'),
(454, 5, 89, '1:1', 'away', 'Spokojny fragment meczu.', 5, 1, 4, 0, 3, 7, 2, 2, 0, 0, 0, 0, '41.60', '58.40'),
(455, 5, 90, '1:1', 'away', 'Koniec meczu!', 5, 1, 4, 0, 3, 7, 2, 2, 0, 0, 0, 0, '42.10', '57.90');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Zrzut danych tabeli `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('QHuB9MpT2ls7_s_BiHt8zAcNgC0JQjgP', 1765407184, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T22:53:04.148Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}'),
('VksQ8Je9Lf9mdJWll99XErMSmKe0i8Uu', 1765406907, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T22:48:27.259Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}'),
('ZHq60laYfrmjflsEsScVAcqsb1oq-ek8', 1765407886, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T23:04:45.751Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}'),
('gnHYWWhyfNhunAek3obht8H5XpiHwZn9', 1765407470, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T22:57:50.344Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}'),
('kUkzlIGX05KKVBsCyomWwNrPpesQSM-4', 1765407963, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T23:06:02.927Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"username\":\"smecik\"}'),
('mgEjlWvCZxSyZWOd9UgzhIMFeXLZ_igS', 1765407698, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T23:01:38.257Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}'),
('x9jOyvv2BVHm5Q6oBemsKJn0H9kIcM-w', 1765406550, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T22:42:29.839Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":4,\"username\":\"smeccik\"}'),
('zduPnYIwaiotnJDTmmG1TVJZyTUYOYO7', 1765407353, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-12-10T22:55:52.504Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"username\":\"smecik\"}');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `statystyki_meczu`
--

CREATE TABLE `statystyki_meczu` (
  `id` int NOT NULL,
  `mecz_id` int NOT NULL,
  `gole_gospodarz` int DEFAULT '0',
  `gole_gosc` int DEFAULT '0',
  `rozne_gospodarz` int DEFAULT '0',
  `rozne_gosc` int DEFAULT '0',
  `faule_gospodarz` int DEFAULT '0',
  `faule_gosc` int DEFAULT '0',
  `zolte_kartki_gospodarz` int DEFAULT '0',
  `zolte_kartki_gosc` int DEFAULT '0',
  `czerwone_kartki_gospodarz` int DEFAULT '0',
  `czerwone_kartki_gosc` int DEFAULT '0',
  `strzaly_gospodarz` int DEFAULT '0',
  `strzaly_gosc` int DEFAULT '0',
  `strzaly_celne_gospodarz` int DEFAULT '0',
  `strzaly_celne_gosc` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `statystyki_meczu`
--

INSERT INTO `statystyki_meczu` (`id`, `mecz_id`, `gole_gospodarz`, `gole_gosc`, `rozne_gospodarz`, `rozne_gosc`, `faule_gospodarz`, `faule_gosc`, `zolte_kartki_gospodarz`, `zolte_kartki_gosc`, `czerwone_kartki_gospodarz`, `czerwone_kartki_gosc`, `strzaly_gospodarz`, `strzaly_gosc`, `strzaly_celne_gospodarz`, `strzaly_celne_gosc`) VALUES
(1, 1, 1, 1, 2, 2, 4, 5, 0, 2, 0, 0, 9, 4, 3, 3),
(2, 2, 1, 4, 7, 2, 3, 3, 0, 0, 0, 0, 4, 8, 3, 5),
(3, 3, 1, 1, 3, 2, 2, 1, 0, 0, 0, 0, 4, 5, 2, 4),
(4, 4, 1, 2, 4, 4, 1, 4, 0, 1, 0, 0, 5, 8, 3, 3),
(5, 5, 1, 1, 5, 1, 4, 0, 0, 0, 0, 0, 3, 7, 2, 2);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `transakcje`
--

CREATE TABLE `transakcje` (
  `id` int NOT NULL,
  `uzytkownik_id` int NOT NULL,
  `typ` enum('WPLATA','WYPLATA','STAWKA','WYGRANA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `kwota` decimal(10,2) NOT NULL,
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  `opis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `transakcje`
--

INSERT INTO `transakcje` (`id`, `uzytkownik_id`, `typ`, `kwota`, `data`, `opis`) VALUES
(1, 2, 'WPLATA', '100.00', '2026-01-17 19:47:28', 'Wpłata środków'),
(2, 2, 'STAWKA', '10.00', '2026-01-17 19:47:34', 'Postawienie kuponu'),
(3, 2, 'STAWKA', '10.00', '2026-01-17 19:50:30', 'Postawienie kuponu'),
(4, 2, 'STAWKA', '10.00', '2026-01-17 19:53:31', 'Postawienie kuponu'),
(5, 2, 'STAWKA', '10.00', '2026-01-17 20:37:56', 'Postawienie kuponu'),
(6, 2, 'WYGRANA', '72.10', '2026-01-18 14:42:00', 'Wygrana z kuponu #2'),
(7, 2, 'WYGRANA', '107.90', '2026-01-18 14:42:00', 'Wygrana z kuponu #3'),
(8, 2, 'STAWKA', '10.00', '2026-01-18 14:47:56', 'Postawienie kuponu'),
(9, 3, 'WPLATA', '100.00', '2026-01-27 14:12:37', 'Wpłata środków'),
(10, 3, 'STAWKA', '10.00', '2026-01-27 20:09:39', 'Postawienie kuponu'),
(11, 3, 'STAWKA', '10.00', '2026-01-28 18:40:29', 'Postawienie kuponu');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `uzytkownicy`
--

CREATE TABLE `uzytkownicy` (
  `id` int NOT NULL,
  `nazwa` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `haslo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saldo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `data_rejestracji` datetime DEFAULT CURRENT_TIMESTAMP,
  `rola` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `uzytkownicy`
--

INSERT INTO `uzytkownicy` (`id`, `nazwa`, `email`, `haslo`, `saldo`, `data_rejestracji`, `rola`) VALUES
(1, 'test_user', 'test@example.com', '$2b$10$X7v7k.1.1.1.1.1.1.1.1.1', '100.00', '2026-01-17 18:20:46', 'user'),
(2, 'nowy', 'now@now.pl', '$2b$10$tQb2Va6E/IIxh3RWdfox4OuRN15zgXbZMgsjJz1Bpn5Ulq80sqxV6', '230.00', '2026-01-17 19:43:26', 'user'),
(3, 'smecik', 'nowy@nowy.pl', '$2b$10$XL52U.x3fyrOpxRl8wE71eDquA/vznGBA74gJ36NQTDjhnvX42Ed2', '80.00', '2026-01-27 14:10:52', 'user');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `kupony`
--
ALTER TABLE `kupony`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uzytkownik_id` (`uzytkownik_id`);

--
-- Indeksy dla tabeli `kupon_pozycje`
--
ALTER TABLE `kupon_pozycje`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kupon_id` (`kupon_id`),
  ADD KEY `kurs_id` (`kurs_id`);

--
-- Indeksy dla tabeli `kursy`
--
ALTER TABLE `kursy`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mecz_id` (`mecz_id`);

--
-- Indeksy dla tabeli `mecze`
--
ALTER TABLE `mecze`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mid` (`mid`);

--
-- Indeksy dla tabeli `przebieg_meczu`
--
ALTER TABLE `przebieg_meczu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mecz_id` (`mecz_id`);

--
-- Indeksy dla tabeli `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indeksy dla tabeli `statystyki_meczu`
--
ALTER TABLE `statystyki_meczu`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mecz_id` (`mecz_id`);

--
-- Indeksy dla tabeli `transakcje`
--
ALTER TABLE `transakcje`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uzytkownik_id` (`uzytkownik_id`);

--
-- Indeksy dla tabeli `uzytkownicy`
--
ALTER TABLE `uzytkownicy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nazwa` (`nazwa`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT dla zrzuconych tabel
--

--
-- AUTO_INCREMENT dla tabeli `kupony`
--
ALTER TABLE `kupony`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT dla tabeli `kupon_pozycje`
--
ALTER TABLE `kupon_pozycje`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT dla tabeli `kursy`
--
ALTER TABLE `kursy`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT dla tabeli `mecze`
--
ALTER TABLE `mecze`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT dla tabeli `przebieg_meczu`
--
ALTER TABLE `przebieg_meczu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=456;

--
-- AUTO_INCREMENT dla tabeli `statystyki_meczu`
--
ALTER TABLE `statystyki_meczu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT dla tabeli `transakcje`
--
ALTER TABLE `transakcje`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT dla tabeli `uzytkownicy`
--
ALTER TABLE `uzytkownicy`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `kupony`
--
ALTER TABLE `kupony`
  ADD CONSTRAINT `kupony_ibfk_1` FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `kupon_pozycje`
--
ALTER TABLE `kupon_pozycje`
  ADD CONSTRAINT `kupon_pozycje_ibfk_1` FOREIGN KEY (`kupon_id`) REFERENCES `kupony` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kupon_pozycje_ibfk_2` FOREIGN KEY (`kurs_id`) REFERENCES `kursy` (`id`);

--
-- Ograniczenia dla tabeli `kursy`
--
ALTER TABLE `kursy`
  ADD CONSTRAINT `kursy_ibfk_1` FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `przebieg_meczu`
--
ALTER TABLE `przebieg_meczu`
  ADD CONSTRAINT `przebieg_meczu_ibfk_1` FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `statystyki_meczu`
--
ALTER TABLE `statystyki_meczu`
  ADD CONSTRAINT `statystyki_meczu_ibfk_1` FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `transakcje`
--
ALTER TABLE `transakcje`
  ADD CONSTRAINT `transakcje_ibfk_1` FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
