"""
Football Simulation API - czysty silnik symulacji i live odds.

Endpointy:
    GET  /                 - status
    GET  /health           - health check
    POST /generate/match   - pełna symulacja meczu (kursy + minuta po minucie)
    POST /odds/live        - przeliczenie kursów na żywo z bieżącego stanu meczu
"""
import random
from datetime import datetime
from math import exp

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.schemas import (
    GenerateMatchRequest, LiveOddsRequest, APIResponse
)
from app.tools import generate_match_simulation

logger = structlog.get_logger()

app = FastAPI(
    title="Football Match Simulation API",
    description="Symulacja meczów piłkarskich + kalkulator kursów na żywo",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "Football Match Simulation API", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/generate/match", response_model=APIResponse)
async def generate_single_match(request: GenerateMatchRequest):
    """Generuje pełną symulację meczu z kursami przedmeczowymi."""
    try:
        result = generate_match_simulation(
            home_team=request.home_team,
            away_team=request.away_team,
            date=request.date,
            use_historical_data=request.use_historical_data
        )
        return APIResponse(status="ok", data=result)
    except Exception as e:
        logger.error("generate_match_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/odds/live", response_model=APIResponse)
async def compute_live_odds(request: LiveOddsRequest):
    """
    Przelicza kursy live na podstawie aktualnego stanu meczu.
    Zwraca 15 kursów: 1X2, OU_GOALS, BTTS, OU_CORNERS, OU_CARDS, OU_SOT, OU_OFFSIDES.
    """
    try:
        MARGIN = 0.95
        progress = min(max(request.minute / 90.0, 0.0), 1.0)
        remaining = max(1.0 - progress, 0.01)

        # 1X2
        diff = request.home_score - request.away_score
        home_lead_bonus = 0.20 * diff * (0.4 + 0.6 * progress)
        home_p = max(0.05, min(0.92, 0.45 + home_lead_bonus))
        away_p_base = max(0.05, min(0.92, 0.35 - home_lead_bonus))
        draw_p = max(0.05, 0.25 * (1 - abs(diff) * 0.3) + 0.35 * progress * (1 if diff == 0 else 0.3))
        s = home_p + away_p_base + draw_p
        home_p /= s
        draw_p /= s
        away_p_base /= s

        # Over/Under bramek
        total_goals = request.home_score + request.away_score
        expected_total = total_goals + 2.5 * remaining
        z_goals = (expected_total - request.goals_line) / max(0.8, 1.2 * remaining + 0.2)
        over_goals_p = 1 / (1 + exp(-z_goals))
        under_goals_p = 1 - over_goals_p

        # BTTS
        if request.home_score > 0 and request.away_score > 0:
            btts_yes_p = 0.98
        else:
            need_home = request.home_score == 0
            need_away = request.away_score == 0
            p_home_scores_rest = 1 - exp(-1.3 * remaining)
            p_away_scores_rest = 1 - exp(-1.1 * remaining)
            btts_yes_p = 1.0
            if need_home:
                btts_yes_p *= p_home_scores_rest
            if need_away:
                btts_yes_p *= p_away_scores_rest
            btts_yes_p = max(0.03, min(0.97, btts_yes_p))
        btts_no_p = 1 - btts_yes_p

        # Rzuty rożne
        total_corners = request.home_corners + request.away_corners
        expected_corners = total_corners + 10 * remaining
        z_corners = (expected_corners - request.corners_line) / max(1.5, 2.0 * remaining + 0.5)
        over_corners_p = 1 / (1 + exp(-z_corners))
        under_corners_p = 1 - over_corners_p

        # Kartki
        total_cards = (request.home_yellow_cards + request.away_yellow_cards
                       + request.home_red_cards + request.away_red_cards)
        expected_cards = total_cards + 4.5 * remaining
        z_cards = (expected_cards - request.cards_line) / max(1.0, 1.5 * remaining + 0.3)
        over_cards_p = 1 / (1 + exp(-z_cards))
        under_cards_p = 1 - over_cards_p

        # Celne strzały
        total_sot = request.home_shots_on_target + request.away_shots_on_target
        expected_sot = total_sot + 8.5 * remaining
        z_sot = (expected_sot - request.sot_line) / max(1.0, 1.8 * remaining + 0.4)
        over_sot_p = 1 / (1 + exp(-z_sot))
        under_sot_p = 1 - over_sot_p

        # Spalone
        total_offsides = request.home_offsides + request.away_offsides
        expected_offsides = total_offsides + 3.5 * remaining
        z_off = (expected_offsides - request.offsides_line) / max(0.8, 1.2 * remaining + 0.3)
        over_off_p = 1 / (1 + exp(-z_off))
        under_off_p = 1 - over_off_p

        def to_odd(p: float) -> float:
            """Probability -> kurs z marginesem i lekkim jitterem."""
            p = max(0.02, min(0.98, p))
            base = MARGIN / p
            jitter = random.uniform(-0.04, 0.04)
            return round(max(1.05, min(50.0, base + jitter)), 2)

        result = {
            "home_win": to_odd(home_p),
            "draw": to_odd(draw_p),
            "away_win": to_odd(away_p_base),
            "over_goals": to_odd(over_goals_p),
            "under_goals": to_odd(under_goals_p),
            "btts_yes": to_odd(btts_yes_p),
            "btts_no": to_odd(btts_no_p),
            "over_corners": to_odd(over_corners_p),
            "under_corners": to_odd(under_corners_p),
            "over_cards": to_odd(over_cards_p),
            "under_cards": to_odd(under_cards_p),
            "over_sot": to_odd(over_sot_p),
            "under_sot": to_odd(under_sot_p),
            "over_offsides": to_odd(over_off_p),
            "under_offsides": to_odd(under_off_p)
        }
        return APIResponse(status="ok", data=result)
    except Exception as e:
        logger.error("live_odds_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Error handlers
# =============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "error_type": "http_error", "message": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import traceback
    trace = traceback.format_exc()
    logger.error("unhandled_exception", error=str(exc), traceback=trace)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "error_type": "internal_error",
                 "message": f"{str(exc)}\n{trace}"}
    )


# =============================================================================
# Run
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
