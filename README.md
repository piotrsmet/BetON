# BetON - Wirtualny Bukmacher

Kompletny system bukmacherski wykorzystujący sztuczną inteligencję (LLM, RAG) do symulacji meczów i generowania realistycznych kursów na żywo. Projekt składa się z backendu Node.js, frontendu React oraz mikroserwisu AI w Pythonie (FastAPI).

## Szybki start (Uruchomienie za pomocą Docker Compose)

Aby uruchomić całą aplikację za pomocą jednej komendy, upewnij się, że masz zainstalowanego Dockera i Docker Compose, a następnie uruchom w tym katalogu polecenie:

```bash
docker compose up -d --build
```

### Co robi ta komenda?
- Uruchamia serwer bazy danych **MySQL** (na porcie `3307`)
- Buduje i uruchamia **Mikroserwis AI** z RAG i symulacjami meczów (na porcie `8000`)
- Buduje **Frontend React** i paczkuje go razem z **Backendem Node.js**, który serwuje całą aplikację pod jednym portem `5001`.

Zanim usługa webowa wystartuje, musi najpierw pobrać pakiety i przygotować modele. Pierwsze uruchomienie może chwilę potrwać. Pamiętaj też, że mikroserwis AI musi załadować i zindeksować dane z folderu `ai/DANE`, zanim zacznie odpowiadać.

### Dostęp do aplikacji
Po tym jak kontenery wystartują (baza danych zasygnalizuje zdrowie, a AI się załaduje), możesz przejść do:

👉 **[http://localhost:5001](http://localhost:5001)**

### Czyszczenie bazy danych (Migracja)
Jeśli uruchamiasz aplikację w Dockerze pierwszy raz na nowym środowisku, musisz przepchnąć schemat bazy danych. Gdy kontenery już działają, wpisz:

```bash
docker exec -it beton-webapp npx prisma db push
```

## Przydatne komendy Docker:
- Zatrzymanie aplikacji: `docker compose down` ( -v dla  usunięcia woluminu bazy danych )
- Podgląd logów (np. by zobaczyć, czy AI już odpaliło modele): `docker compose logs -f`
- Restart tylko aplikacji Node: `docker compose restart webapp`
