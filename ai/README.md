# Football Simulation API

Mikrousługa FastAPI dla projektu BetON. Czysty silnik symulacji meczu piłkarskiego +
kalkulator kursów na żywo. Bez LLM, bez RAG, bez danych historycznych — same matematyczne
heurystyki.

## Endpointy

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/` | status serwisu |
| GET | `/health` | health check (status + timestamp) |
| POST | `/generate/match` | pełna symulacja meczu (kursy przedmeczowe + 91 minut) |
| POST | `/odds/live` | przeliczenie kursów na żywo z bieżącego stanu meczu |

### POST `/generate/match`

```json
{
  "home_team": "Liverpool",
  "away_team": "Arsenal",
  "date": "2026-06-07",
  "use_historical_data": true
}
```

Zwraca `MatchSimulation` z `pre_match_odds` (kursy dla rynków: 1X2, OU_GOALS, BTTS,
OU_CORNERS, OU_CARDS, OU_SOT, OU_OFFSIDES, HTFT 9-pole) oraz `minutes` (91 obiektów
`MatchMinuteData` z kumulatywnymi statystykami i komentarzami).

### POST `/odds/live`

```json
{
  "home_team": "Liverpool",
  "away_team": "Arsenal",
  "minute": 60,
  "home_score": 1,
  "away_score": 0,
  "home_corners": 4,
  "away_corners": 2,
  "home_yellow_cards": 1,
  "away_yellow_cards": 2,
  "home_red_cards": 0,
  "away_red_cards": 0,
  "home_shots_on_target": 5,
  "away_shots_on_target": 2,
  "home_offsides": 1,
  "away_offsides": 2,
  "goals_line": 2.5,
  "corners_line": 9.5,
  "cards_line": 4.5,
  "sot_line": 8.5,
  "offsides_line": 3.5
}
```

Zwraca 15 kursów (`home_win`, `draw`, `away_win`, `over_goals`, `under_goals`, `btts_yes`,
`btts_no`, `over_corners`, `under_corners`, `over_cards`, `under_cards`, `over_sot`,
`under_sot`, `over_offsides`, `under_offsides`) z marginesem 5% + jitter.

## Uruchomienie

### Lokalnie

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker compose up -d --build
```

## Konfiguracja

Plik `.env` (opcjonalny, defaulty w `app/config.py`):

```
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

## Struktura

```
ai/
├── app/
│   ├── __init__.py
│   ├── config.py       # Settings (api_host, api_port, log_level)
│   ├── main.py         # FastAPI + 4 endpointy
│   ├── schemas.py      # Pydantic modele I/O
│   └── tools.py        # generate_match_simulation + helpery
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```
