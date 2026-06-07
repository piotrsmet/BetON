"""
Pydantic schemas - walidacja wejścia/wyjścia API.
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Literal
from enum import Enum
from datetime import datetime
import re


# =============================================================================
# Match domain
# =============================================================================

class MatchEventType(str, Enum):
    GOAL = "goal"
    YELLOW_CARD = "yellow_card"
    RED_CARD = "red_card"
    SUBSTITUTION = "substitution"
    CORNER = "corner"
    SHOT = "shot"
    SHOT_ON_TARGET = "shot_on_target"
    FOUL = "foul"
    OFFSIDE = "offside"
    PENALTY = "penalty"
    VAR_REVIEW = "var_review"
    INJURY = "injury"
    HALF_TIME = "half_time"
    FULL_TIME = "full_time"
    KICK_OFF = "kick_off"


class MatchEvent(BaseModel):
    minute: int = Field(..., ge=0, le=120)
    event_type: MatchEventType
    team: Optional[str] = Field(None, max_length=50)
    player: Optional[str] = Field(None, max_length=100)
    description: str = Field(..., max_length=500)

    model_config = ConfigDict(use_enum_values=True)


class MatchMinuteData(BaseModel):
    """Dane dla pojedynczej minuty symulacji"""
    minute: int = Field(..., ge=0, le=120)
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)
    home_possession: float = Field(..., ge=0, le=100)
    away_possession: float = Field(..., ge=0, le=100)
    commentary: str = Field(..., max_length=1000)
    events: List[MatchEvent] = Field(default_factory=list)

    # Statystyki narastające
    home_shots: int = Field(0, ge=0, le=50)
    away_shots: int = Field(0, ge=0, le=50)
    home_shots_on_target: int = Field(0, ge=0, le=30)
    away_shots_on_target: int = Field(0, ge=0, le=30)
    home_corners: int = Field(0, ge=0, le=20)
    away_corners: int = Field(0, ge=0, le=20)
    home_fouls: int = Field(0, ge=0, le=30)
    away_fouls: int = Field(0, ge=0, le=30)
    home_yellow_cards: int = Field(0, ge=0, le=11)
    away_yellow_cards: int = Field(0, ge=0, le=11)
    home_red_cards: int = Field(0, ge=0, le=3)
    away_red_cards: int = Field(0, ge=0, le=3)
    home_offsides: int = Field(0, ge=0, le=20)
    away_offsides: int = Field(0, ge=0, le=20)


class PreMatchOdds(BaseModel):
    """Kursy przedmeczowe dla wszystkich obsługiwanych rynków."""
    # 1X2
    home_win: float = Field(..., gt=1.0, le=100.0)
    draw: float = Field(..., gt=1.0, le=100.0)
    away_win: float = Field(..., gt=1.0, le=100.0)

    # Over/Under bramek
    over_2_5: float = Field(..., gt=1.0, le=50.0)
    under_2_5: float = Field(..., gt=1.0, le=50.0)
    goals_line: float = Field(2.5, ge=0.5, le=6.5)

    # BTTS
    btts_yes: float = Field(..., gt=1.0, le=20.0)
    btts_no: float = Field(..., gt=1.0, le=20.0)

    # Rzuty rożne
    corners_line: float = Field(9.5, ge=2.5, le=20.5)
    corners_over: float = Field(1.9, gt=1.0, le=20.0)
    corners_under: float = Field(1.9, gt=1.0, le=20.0)

    # Kartki
    cards_line: float = Field(4.5, ge=0.5, le=15.5)
    cards_over: float = Field(1.9, gt=1.0, le=20.0)
    cards_under: float = Field(1.9, gt=1.0, le=20.0)

    # Celne strzały
    sot_line: float = Field(8.5, ge=0.5, le=30.5)
    sot_over: float = Field(1.9, gt=1.0, le=20.0)
    sot_under: float = Field(1.9, gt=1.0, le=20.0)

    # Spalone
    offsides_line: float = Field(3.5, ge=0.5, le=20.5)
    offsides_over: float = Field(1.9, gt=1.0, le=20.0)
    offsides_under: float = Field(1.9, gt=1.0, le=20.0)

    # HT/FT
    htft_1_1: float = Field(4.5, gt=1.0, le=100.0)
    htft_1_x: float = Field(15.0, gt=1.0, le=200.0)
    htft_1_2: float = Field(35.0, gt=1.0, le=500.0)
    htft_x_1: float = Field(6.0, gt=1.0, le=200.0)
    htft_x_x: float = Field(4.5, gt=1.0, le=100.0)
    htft_x_2: float = Field(7.5, gt=1.0, le=200.0)
    htft_2_1: float = Field(45.0, gt=1.0, le=500.0)
    htft_2_x: float = Field(16.0, gt=1.0, le=200.0)
    htft_2_2: float = Field(5.5, gt=1.0, le=100.0)

    # Asian Handicap (zostawione, AI ustawia neutralnie)
    asian_handicap_line: float = Field(0.0, ge=-5.0, le=5.0)
    asian_handicap_home: float = Field(1.9, gt=1.0, le=10.0)
    asian_handicap_away: float = Field(1.9, gt=1.0, le=10.0)


class MatchSimulation(BaseModel):
    """Pełna symulacja meczu zwracana z /generate/match."""
    match_id: str = Field(..., max_length=50)
    home_team: str = Field(..., max_length=50)
    away_team: str = Field(..., max_length=50)
    date: str = Field(..., description="YYYY-MM-DD")
    kick_off_time: str = Field(..., description="HH:MM")
    stadium: Optional[str] = Field(None, max_length=100)
    referee: Optional[str] = Field(None, max_length=100)
    pre_match_odds: PreMatchOdds
    minutes: List[MatchMinuteData] = Field(..., min_length=1)
    final_score_home: int = Field(..., ge=0, le=20)
    final_score_away: int = Field(..., ge=0, le=20)
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Data musi być w formacie YYYY-MM-DD")
        return v

    @field_validator("kick_off_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Czas musi być w formacie HH:MM")
        return v


# =============================================================================
# Requests / Responses
# =============================================================================

class GenerateMatchRequest(BaseModel):
    home_team: str = Field(..., min_length=1, max_length=50)
    away_team: str = Field(..., min_length=1, max_length=50)
    date: Optional[str] = Field(None)
    use_historical_data: bool = Field(True)

    @field_validator("home_team", "away_team")
    @classmethod
    def sanitize_team_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Nazwa drużyny zawiera niedozwolone znaki")
        return v


class LiveOddsRequest(BaseModel):
    """Wejście do /odds/live - aktualny stan meczu na potrzeby przeliczenia kursów."""
    home_team: str = Field(..., max_length=50)
    away_team: str = Field(..., max_length=50)
    minute: int = Field(..., ge=0, le=120)
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)
    home_corners: int = Field(0, ge=0, le=40)
    away_corners: int = Field(0, ge=0, le=40)
    home_yellow_cards: int = Field(0, ge=0, le=22)
    away_yellow_cards: int = Field(0, ge=0, le=22)
    home_red_cards: int = Field(0, ge=0, le=10)
    away_red_cards: int = Field(0, ge=0, le=10)
    home_shots_on_target: int = Field(0, ge=0, le=40)
    away_shots_on_target: int = Field(0, ge=0, le=40)
    home_offsides: int = Field(0, ge=0, le=30)
    away_offsides: int = Field(0, ge=0, le=30)
    goals_line: float = Field(2.5, ge=0.5, le=10.5)
    corners_line: float = Field(9.5, ge=2.5, le=25.5)
    cards_line: float = Field(4.5, ge=0.5, le=20.5)
    sot_line: float = Field(8.5, ge=0.5, le=40.5)
    offsides_line: float = Field(3.5, ge=0.5, le=30.5)


class APIResponse(BaseModel):
    status: Literal["ok", "error"]
    data: Optional[dict] = None
    error: Optional[str] = None
    meta: Optional[dict] = None
