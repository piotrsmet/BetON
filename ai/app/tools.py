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
    
    # Generowanie kursów na podstawie statystyk historycznych
    if use_historical_data:
        from app.rag_service import get_rag_service
        rag = get_rag_service()
        home_stats = rag.get_team_historical_stats(home_team)
        away_stats = rag.get_team_historical_stats(away_team)
        
        home_wr = home_stats.get("win_rate", 45.0) / 100.0 if "error" not in home_stats else 0.45
        away_wr = away_stats.get("win_rate", 35.0) / 100.0 if "error" not in away_stats else 0.35
        home_avg_goals = home_stats.get("avg_goals_scored", 1.5) if "error" not in home_stats else 1.5
        away_avg_goals = away_stats.get("avg_goals_scored", 1.1) if "error" not in away_stats else 1.1
        
        s_rate = home_wr + away_wr + 0.25 # 0.25 jako bazowe na remis
        home_win_prob = max(0.1, min(0.8, home_wr / s_rate))
        away_win_prob = max(0.1, min(0.8, away_wr / s_rate))
        draw_prob = max(0.1, 1.0 - home_win_prob - away_win_prob)
        
        expected_goals = home_avg_goals + away_avg_goals
        home_strength = home_win_prob
    else:
        home_strength = random.uniform(0.4, 0.6)
        home_win_prob = home_strength * 0.5 + 0.2
        draw_prob = 0.25
        away_win_prob = 1 - home_win_prob - draw_prob
        expected_goals = 2.5
        home_avg_goals = 1.2
        away_avg_goals = 1.0
        
    def prob_to_odd(p):
        p = max(0.02, min(0.98, p))
        # Dodajemy delikatny szum do kursu
        jitter = random.uniform(-0.02, 0.02)
        return round(max(1.05, min(50.0, 0.95 / p + jitter)), 2)
        
    import math
    # OU 2.5
    z_goals = (expected_goals - 2.5) / 1.5
    over_2_5_prob = 1 / (1 + math.exp(-z_goals))
    
    # BTTS
    btts_yes_prob = 1 - math.exp(-home_avg_goals * 0.8) * math.exp(-away_avg_goals * 0.8)
    btts_yes_prob = max(0.3, min(0.8, btts_yes_prob))
    
    # HT/FT - prawdopodobieństwa z prostego modelu
    htft = _compute_htft_odds(home_win_prob, draw_prob, away_win_prob)

    odds = PreMatchOdds(
        home_win=prob_to_odd(home_win_prob),
        draw=prob_to_odd(draw_prob),
        away_win=prob_to_odd(away_win_prob),
        over_2_5=prob_to_odd(over_2_5_prob),
        under_2_5=prob_to_odd(1 - over_2_5_prob),
        btts_yes=prob_to_odd(btts_yes_prob),
        btts_no=prob_to_odd(1 - btts_yes_prob),
        goals_line=2.5,
        corners_line=9.5,
        corners_over=prob_to_odd(0.55),
        corners_under=prob_to_odd(0.45),
        cards_line=4.5,
        cards_over=prob_to_odd(0.50),
        cards_under=prob_to_odd(0.50),
        sot_line=8.5,
        sot_over=prob_to_odd(0.50),
        sot_under=prob_to_odd(0.50),
        offsides_line=3.5,
        offsides_over=prob_to_odd(0.45),
        offsides_under=prob_to_odd(0.55),
        htft_1_1=htft["1/1"],
        htft_1_x=htft["1/X"],
        htft_1_2=htft["1/2"],
        htft_x_1=htft["X/1"],
        htft_x_x=htft["X/X"],
        htft_x_2=htft["X/2"],
        htft_2_1=htft["2/1"],
        htft_2_x=htft["2/X"],
        htft_2_2=htft["2/2"],
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


def _compute_htft_odds(p_home: float, p_draw: float, p_away: float) -> Dict[str, float]:
    """Heurystyka kursów HT/FT na podstawie prawdopodobieństw 1X2.
    Prawdopodobieństwo HT zakłada większą szansę remisu w połowie."""
    # Korekta na połowę (krótszy czas -> więcej remisów)
    ht_home = p_home * 0.55
    ht_away = p_away * 0.55
    ht_draw = max(0.05, 1 - ht_home - ht_away)

    ft = {"1": p_home, "X": p_draw, "2": p_away}
    ht = {"1": ht_home, "X": ht_draw, "2": ht_away}

    MARGIN = 0.92
    out = {}
    for h_key in ["1", "X", "2"]:
        for f_key in ["1", "X", "2"]:
            # przybliżenie: zakładamy niezależność HT i FT (lekko zaniżone dla nierealistycznych par jak 2/1)
            p = ht[h_key] * ft[f_key]
            # bonus probabilistyczny dla "konsystentnych" wyników (1/1, X/X, 2/2)
            if h_key == f_key:
                p *= 1.6
            p = max(0.005, min(0.50, p))
            odd = round(max(1.1, min(500.0, MARGIN / p)), 2)
            out[f"{h_key}/{f_key}"] = odd
    return out


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
    home_offsides = 0
    away_offsides = 0

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
            # Spalony
            elif rand < 0.36:
                if random.random() < home_strength:
                    home_offsides += 1
                    events.append(MatchEvent(minute=minute, event_type=MatchEventType.OFFSIDE,
                                           team=home_team, description="Spalony"))
                else:
                    away_offsides += 1
                    events.append(MatchEvent(minute=minute, event_type=MatchEventType.OFFSIDE,
                                           team=away_team, description="Spalony"))
                commentary = "Sędzia liniowy podnosi chorągiewkę - spalony!"
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
            away_red_cards=0,
            home_offsides=home_offsides,
            away_offsides=away_offsides
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
