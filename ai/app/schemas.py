"""
Pydantic schemas dla walidacji danych wejściowych/wyjściowych
JSON Schema dla function-calling z pełną walidacją
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Literal
from enum import Enum
from datetime import datetime
import re


# =============================================================================
# Enums
# =============================================================================

class MatchEventType(str, Enum):
    """Typy zdarzeń meczowych"""
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


class ToolName(str, Enum):
    """Dozwolone narzędzia"""
    GENERATE_MATCH_SIMULATION = "generate_match_simulation"
    GET_TEAM_STATS = "get_team_stats"
    SEARCH_MATCHES = "search_matches"
    CALCULATE_ODDS = "calculate_odds"
    GET_HISTORICAL_DATA = "get_historical_data"


# =============================================================================
# Match Event Schemas
# =============================================================================

class MatchEvent(BaseModel):
    """Pojedyncze zdarzenie w meczu"""
    minute: int = Field(..., ge=0, le=120, description="Minuta meczu (0-120)")
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
    
    # Statystyki bieżące
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


class PreMatchOdds(BaseModel):
    """Kursy przedmeczowe"""
    home_win: float = Field(..., gt=1.0, le=100.0)
    draw: float = Field(..., gt=1.0, le=100.0)
    away_win: float = Field(..., gt=1.0, le=100.0)
    over_2_5: float = Field(..., gt=1.0, le=50.0)
    under_2_5: float = Field(..., gt=1.0, le=50.0)
    btts_yes: float = Field(..., gt=1.0, le=20.0)
    btts_no: float = Field(..., gt=1.0, le=20.0)
    
    # Asian Handicap
    asian_handicap_line: float = Field(0.0, ge=-5.0, le=5.0)
    asian_handicap_home: float = Field(1.9, gt=1.0, le=10.0)
    asian_handicap_away: float = Field(1.9, gt=1.0, le=10.0)


class MatchSimulation(BaseModel):
    """Pełna symulacja meczu w formacie JSON"""
    match_id: str = Field(..., max_length=50)
    home_team: str = Field(..., max_length=50)
    away_team: str = Field(..., max_length=50)
    date: str = Field(..., description="Data meczu YYYY-MM-DD")
    kick_off_time: str = Field(..., description="Godzina rozpoczęcia HH:MM")
    stadium: Optional[str] = Field(None, max_length=100)
    referee: Optional[str] = Field(None, max_length=100)
    
    # Kursy przedmeczowe
    pre_match_odds: PreMatchOdds
    
    # Minuta po minucie
    minutes: List[MatchMinuteData] = Field(..., min_length=1)
    
    # Wynik końcowy
    final_score_home: int = Field(..., ge=0, le=20)
    final_score_away: int = Field(..., ge=0, le=20)
    
    # Metadata
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
# API Request/Response Schemas
# =============================================================================

class AskRequest(BaseModel):
    """Request dla endpointu /ask"""
    question: str = Field(..., min_length=1, max_length=2000)
    k: int = Field(5, ge=1, le=20, description="Liczba dokumentów do retrieval")
    mode: Literal["api", "local"] = Field("local", description="Tryb LLM")
    use_functions: bool = Field(True, description="Czy używać function-calling")
    
    @field_validator("question")
    @classmethod
    def sanitize_question(cls, v: str) -> str:
        # Usuwanie potencjalnie niebezpiecznych znaków
        v = v.strip()
        # Blokada path traversal
        if ".." in v or "~" in v:
            raise ValueError("Niedozwolone znaki w pytaniu")
        return v


class GenerateMatchRequest(BaseModel):
    """Request do generowania symulacji meczu"""
    home_team: str = Field(..., min_length=1, max_length=50)
    away_team: str = Field(..., min_length=1, max_length=50)
    date: Optional[str] = Field(None, description="Data meczu YYYY-MM-DD")
    use_historical_data: bool = Field(True, description="Czy bazować na danych historycznych")
    
    @field_validator("home_team", "away_team")
    @classmethod
    def sanitize_team_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Nazwa drużyny zawiera niedozwolone znaki")
        return v


class GenerateBatchRequest(BaseModel):
    """Request do generowania wielu meczów"""
    matches: List[GenerateMatchRequest] = Field(..., min_length=1, max_length=10)


class ToolCallRequest(BaseModel):
    """Request do wywołania narzędzia"""
    tool_name: ToolName
    arguments: dict = Field(default_factory=dict)


class APIResponse(BaseModel):
    """Standardowa odpowiedź API"""
    status: Literal["ok", "error"]
    data: Optional[dict] = None
    error: Optional[str] = None
    meta: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Odpowiedź błędu"""
    status: Literal["error"] = "error"
    error_type: Literal["validation_error", "timeout", "tool_error", "security_blocked"]
    message: str
    details: Optional[dict] = None


# =============================================================================
# Function-calling Schemas (JSON Schema format)
# =============================================================================

FUNCTION_SCHEMAS = [
    {
        "name": "generate_match_simulation",
        "description": "Generuje pełną symulację meczu piłkarskiego z komentarzami minuta po minucie",
        "parameters": {
            "type": "object",
            "properties": {
                "home_team": {
                    "type": "string",
                    "description": "Nazwa drużyny gospodarzy",
                    "maxLength": 50
                },
                "away_team": {
                    "type": "string",
                    "description": "Nazwa drużyny gości",
                    "maxLength": 50
                },
                "date": {
                    "type": "string",
                    "description": "Data meczu w formacie YYYY-MM-DD",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                },
                "use_historical_data": {
                    "type": "boolean",
                    "description": "Czy bazować na danych historycznych",
                    "default": True
                }
            },
            "required": ["home_team", "away_team"]
        }
    },
    {
        "name": "get_team_stats",
        "description": "Pobiera statystyki drużyny z bazy danych historycznych",
        "parameters": {
            "type": "object",
            "properties": {
                "team_name": {
                    "type": "string",
                    "description": "Nazwa drużyny",
                    "maxLength": 50
                },
                "season": {
                    "type": "string",
                    "description": "Sezon (np. 2023-2024)",
                    "pattern": "^\\d{4}-\\d{4}$"
                }
            },
            "required": ["team_name"]
        }
    },
    {
        "name": "search_matches",
        "description": "Wyszukuje mecze w bazie danych",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Zapytanie wyszukiwania",
                    "maxLength": 200
                },
                "top_k": {
                    "type": "integer",
                    "description": "Liczba wyników",
                    "minimum": 1,
                    "maximum": 20,
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "calculate_odds",
        "description": "Oblicza kursy na podstawie statystyk drużyn",
        "parameters": {
            "type": "object",
            "properties": {
                "home_team": {
                    "type": "string",
                    "maxLength": 50
                },
                "away_team": {
                    "type": "string",
                    "maxLength": 50
                }
            },
            "required": ["home_team", "away_team"]
        }
    },
    {
        "name": "get_historical_data",
        "description": "Pobiera historyczne dane meczów między dwoma drużynami",
        "parameters": {
            "type": "object",
            "properties": {
                "team1": {
                    "type": "string",
                    "maxLength": 50
                },
                "team2": {
                    "type": "string",
                    "maxLength": 50
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 50,
                    "default": 10
                }
            },
            "required": ["team1", "team2"]
        }
    }
]
