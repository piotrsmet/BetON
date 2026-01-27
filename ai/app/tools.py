"""
Implementacje narzędzi (tools) z function-calling.
Registry i dispatcher z walidacją argumentów.
"""
import json
import random
from datetime import datetime
from typing import Dict, Any, Callable, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
import structlog

from app.config import get_settings, ALLOWED_TOOLS, SECURITY_LIMITS
from app.schemas import (GenerateMatchRequest, MatchSimulation, MatchMinuteData, 
                         MatchEvent, PreMatchOdds, MatchEventType)
from app.guardrails import validate_team_name, sanitize_path

logger = structlog.get_logger()


# =============================================================================
# Tool Registry
# =============================================================================

class ToolRegistry:
    """Rejestr dozwolonych narzędzi z walidacją"""
    
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: Dict[str, dict] = {}
        
    def register(self, name: str, func: Callable, schema: dict):
        if name not in ALLOWED_TOOLS:
            raise ValueError(f"Narzędzie '{name}' nie jest na liście dozwolonych")
        self._tools[name] = func
        self._schemas[name] = schema
        
    def get(self, name: str) -> Optional[Callable]:
        return self._tools.get(name)
    
    def get_schema(self, name: str) -> Optional[dict]:
        return self._schemas.get(name)
    
    def list_tools(self) -> list:
        return list(self._tools.keys())


# Globalny rejestr
registry = ToolRegistry()


# =============================================================================
# Tool Implementations
# =============================================================================

def generate_match_simulation(
    home_team: str,
    away_team: str,
    date: Optional[str] = None,
    use_historical_data: bool = True
) -> Dict[str, Any]:
    """Generuje pełną symulację meczu z kursami i komentarzami minuta po minucie"""
    
    # Walidacja
    valid_h, home_team = validate_team_name(home_team)
    valid_a, away_team = validate_team_name(away_team)
    if not valid_h or not valid_a:
        return {"error": "Nieprawidłowa nazwa drużyny"}
    
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Generowanie kursów na podstawie losowej siły drużyn
    home_strength = random.uniform(0.4, 0.6)
    away_strength = 1 - home_strength
    
    # Oblicz kursy (simplified Poisson)
    home_win_prob = home_strength * 0.5 + 0.2
    draw_prob = 0.25
    away_win_prob = 1 - home_win_prob - draw_prob
    
    odds = PreMatchOdds(
        home_win=round(0.95 / home_win_prob, 2),
        draw=round(0.95 / draw_prob, 2),
        away_win=round(0.95 / away_win_prob, 2),
        over_2_5=round(random.uniform(1.7, 2.3), 2),
        under_2_5=round(random.uniform(1.6, 2.1), 2),
        btts_yes=round(random.uniform(1.7, 2.0), 2),
        btts_no=round(random.uniform(1.8, 2.1), 2),
        asian_handicap_line=round(random.uniform(-1.5, 1.5) * 2) / 2,
        asian_handicap_home=1.9,
        asian_handicap_away=1.9
    )
    
    # Generowanie symulacji minuta po minucie
    minutes_data = _generate_minute_by_minute(home_team, away_team, home_strength)
    
    final_minute = minutes_data[-1]
    
    simulation = MatchSimulation(
        match_id=f"SIM_{home_team[:3].upper()}_{away_team[:3].upper()}_{date.replace('-','')}",
        home_team=home_team,
        away_team=away_team,
        date=date,
        kick_off_time="15:00",
        stadium=f"Stadium of {home_team}",
        referee=random.choice(["M. Oliver", "A. Taylor", "C. Pawson", "P. Tierney"]),
        pre_match_odds=odds,
        minutes=minutes_data,
        final_score_home=final_minute.home_score,
        final_score_away=final_minute.away_score
    )
    
    return simulation.model_dump()


def _generate_minute_by_minute(home_team: str, away_team: str, 
                               home_strength: float) -> list:
    """Generuje dane minuta po minucie"""
    minutes = []
    
    home_score = 0
    away_score = 0
    home_shots = 0
    away_shots = 0
    home_shots_ot = 0
    away_shots_ot = 0
    home_corners = 0
    away_corners = 0
    home_fouls = 0
    away_fouls = 0
    home_yellows = 0
    away_yellows = 0
    
    possession_home = 50.0
    
    commentaries = {
        "start": [f"Sędzia rozpoczyna mecz! {home_team} zagrywa pierwszą piłkę.",
                  f"Początek spotkania na stadionie {home_team}!"],
        "boring": ["Spokojny fragment meczu.", "Obie drużyny kontrolują piłkę.",
                   "Wymiana podań w środku pola."],
        "attack_home": [f"{home_team} rusza do przodu!", f"Groźna akcja {home_team}!"],
        "attack_away": [f"{away_team} atakuje!", f"Kontra {away_team}!"],
        "goal_home": [f"GOOOOL! {home_team} trafia do siatki!", f"Bramka dla {home_team}!"],
        "goal_away": [f"GOOOOL! {away_team} zdobywa bramkę!", f"Trafienie dla {away_team}!"],
        "half_time": ["Koniec pierwszej połowy!", "Przerwa w meczu."],
        "full_time": ["Koniec meczu!", "Sędzia kończy spotkanie!"]
    }
    
    for minute in range(0, 91):
        events = []
        commentary = ""
        
        if minute == 0:
            commentary = random.choice(commentaries["start"])
            events.append(MatchEvent(minute=0, event_type=MatchEventType.KICK_OFF,
                                    description="Początek meczu"))
        elif minute == 45:
            commentary = random.choice(commentaries["half_time"])
            events.append(MatchEvent(minute=45, event_type=MatchEventType.HALF_TIME,
                                    description=f"Wynik do przerwy: {home_score}-{away_score}"))
        elif minute == 90:
            commentary = random.choice(commentaries["full_time"])
            events.append(MatchEvent(minute=90, event_type=MatchEventType.FULL_TIME,
                                    description=f"Wynik końcowy: {home_score}-{away_score}"))
        else:
            # Losowe zdarzenia
            rand = random.random()
            
            # Gol (ok 2-3 na mecz średnio)
            goal_chance = 0.03 if minute < 80 else 0.04
            if rand < goal_chance:
                if random.random() < home_strength:
                    home_score += 1
                    home_shots_ot += 1
                    home_shots += 1
                    commentary = random.choice(commentaries["goal_home"])
                    events.append(MatchEvent(minute=minute, event_type=MatchEventType.GOAL,
                                           team=home_team, description=f"Gol dla {home_team}!"))
                else:
                    away_score += 1
                    away_shots_ot += 1
                    away_shots += 1
                    commentary = random.choice(commentaries["goal_away"])
                    events.append(MatchEvent(minute=minute, event_type=MatchEventType.GOAL,
                                           team=away_team, description=f"Gol dla {away_team}!"))
            # Strzał
            elif rand < 0.15:
                if random.random() < home_strength:
                    home_shots += 1
                    if random.random() < 0.4:
                        home_shots_ot += 1
                    commentary = random.choice(commentaries["attack_home"])
                else:
                    away_shots += 1
                    if random.random() < 0.4:
                        away_shots_ot += 1
                    commentary = random.choice(commentaries["attack_away"])
            # Rzut rożny
            elif rand < 0.22:
                if random.random() < home_strength:
                    home_corners += 1
                else:
                    away_corners += 1
                commentary = "Rzut rożny."
            # Faul
            elif rand < 0.30:
                if random.random() < 0.5:
                    home_fouls += 1
                else:
                    away_fouls += 1
                commentary = "Faul w środku pola."
                # Żółta kartka (20% fauli)
                if random.random() < 0.2:
                    if home_fouls > away_fouls:
                        home_yellows += 1
                        events.append(MatchEvent(minute=minute, event_type=MatchEventType.YELLOW_CARD,
                                               team=home_team, description="Żółta kartka"))
                    else:
                        away_yellows += 1
                        events.append(MatchEvent(minute=minute, event_type=MatchEventType.YELLOW_CARD,
                                               team=away_team, description="Żółta kartka"))
            else:
                commentary = random.choice(commentaries["boring"])
        
        # Aktualizacja posiadania
        possession_home = max(35, min(65, possession_home + random.uniform(-3, 3)))
        
        minute_data = MatchMinuteData(
            minute=minute,
            home_score=home_score,
            away_score=away_score,
            home_possession=round(possession_home, 1),
            away_possession=round(100 - possession_home, 1),
            commentary=commentary,
            events=events,
            home_shots=home_shots,
            away_shots=away_shots,
            home_shots_on_target=home_shots_ot,
            away_shots_on_target=away_shots_ot,
            home_corners=home_corners,
            away_corners=away_corners,
            home_fouls=home_fouls,
            away_fouls=away_fouls,
            home_yellow_cards=home_yellows,
            away_yellow_cards=away_yellows,
            home_red_cards=0,
            away_red_cards=0
        )
        minutes.append(minute_data)
    
    return minutes


def get_team_stats(team_name: str, season: Optional[str] = None) -> Dict[str, Any]:
    """Pobiera statystyki drużyny"""
    valid, team_name = validate_team_name(team_name)
    if not valid:
        return {"error": team_name}
    
    from app.rag_service import get_rag_service
    rag = get_rag_service()
    return rag.get_team_historical_stats(team_name)


def search_matches(query: str, top_k: int = 5) -> Dict[str, Any]:
    """Wyszukuje mecze w bazie"""
    top_k = min(top_k, SECURITY_LIMITS["max_context_chunks"])
    
    from app.rag_service import get_rag_service
    rag = get_rag_service()
    results = rag.retrieve(query, top_k)
    
    return {"matches": results, "count": len(results)}


def calculate_odds(home_team: str, away_team: str) -> Dict[str, Any]:
    """Oblicza kursy na podstawie danych historycznych"""
    valid_h, home_team = validate_team_name(home_team)
    valid_a, away_team = validate_team_name(away_team)
    
    from app.rag_service import get_rag_service
    rag = get_rag_service()
    
    home_stats = rag.get_team_historical_stats(home_team)
    away_stats = rag.get_team_historical_stats(away_team)
    
    # Prosta kalkulacja kursów
    home_wr = home_stats.get("win_rate", 50) / 100
    away_wr = away_stats.get("win_rate", 50) / 100
    
    home_prob = (home_wr * 0.55 + 0.1)  # Bonus gospodarzy
    away_prob = away_wr * 0.35
    draw_prob = 1 - home_prob - away_prob
    
    margin = 0.05
    
    return {
        "home_team": home_team,
        "away_team": away_team,
        "odds": {
            "home_win": round((1 - margin) / max(home_prob, 0.05), 2),
            "draw": round((1 - margin) / max(draw_prob, 0.15), 2),
            "away_win": round((1 - margin) / max(away_prob, 0.05), 2)
        },
        "probabilities": {
            "home_win": round(home_prob * 100, 1),
            "draw": round(draw_prob * 100, 1),
            "away_win": round(away_prob * 100, 1)
        }
    }


def get_historical_data(team1: str, team2: str, limit: int = 10) -> Dict[str, Any]:
    """Pobiera historyczne mecze między drużynami"""
    valid1, team1 = validate_team_name(team1)
    valid2, team2 = validate_team_name(team2)
    
    from app.rag_service import get_rag_service
    rag = get_rag_service()
    
    query = f"{team1} vs {team2}"
    results = rag.retrieve(query, limit * 2)
    
    # Filtruj tylko mecze między tymi drużynami
    h2h = [r for r in results if (team1.lower() in r.get("home_team", "").lower() or 
                                   team1.lower() in r.get("away_team", "").lower()) and
                                  (team2.lower() in r.get("home_team", "").lower() or
                                   team2.lower() in r.get("away_team", "").lower())]
    
    return {"team1": team1, "team2": team2, "matches": h2h[:limit], "count": len(h2h)}


# =============================================================================
# Dispatcher
# =============================================================================

from app.schemas import FUNCTION_SCHEMAS

# Rejestracja narzędzi
for schema in FUNCTION_SCHEMAS:
    name = schema["name"]
    if name == "generate_match_simulation":
        registry.register(name, generate_match_simulation, schema)
    elif name == "get_team_stats":
        registry.register(name, get_team_stats, schema)
    elif name == "search_matches":
        registry.register(name, search_matches, schema)
    elif name == "calculate_odds":
        registry.register(name, calculate_odds, schema)
    elif name == "get_historical_data":
        registry.register(name, get_historical_data, schema)


class ToolDispatcher:
    """Dispatcher z timeoutem i obsługą błędów"""
    
    def __init__(self):
        self.settings = get_settings()
        
    def dispatch(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Wywołuje narzędzie z walidacją i timeoutem"""
        
        # Sprawdź allowlist
        if tool_name not in ALLOWED_TOOLS:
            logger.warning("blocked_tool", tool=tool_name)
            return {"error_type": "security_blocked", "message": f"Narzędzie '{tool_name}' nie jest dozwolone"}
        
        # Pobierz funkcję
        func = registry.get(tool_name)
        if not func:
            return {"error_type": "tool_error", "message": f"Narzędzie '{tool_name}' nie znalezione"}
        
        # Wykonaj z timeoutem
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(func, **arguments)
                result = future.result(timeout=self.settings.timeout_seconds)
                
            logger.info("tool_executed", tool=tool_name, status="ok")
            return {"status": "ok", "result": result}
            
        except FuturesTimeout:
            logger.error("tool_timeout", tool=tool_name)
            return {"error_type": "timeout", "message": f"Timeout podczas wykonywania {tool_name}"}
        except TypeError as e:
            logger.error("tool_validation_error", tool=tool_name, error=str(e))
            return {"error_type": "validation_error", "message": str(e)}
        except Exception as e:
            logger.error("tool_error", tool=tool_name, error=str(e))
            return {"error_type": "tool_error", "message": str(e)}


dispatcher = ToolDispatcher()
