"""
Silnik symulacji meczu - generuje minuta po minucie + kursy przedmeczowe.
"""
import re
import random
from datetime import datetime
from typing import Dict, Any, Optional

from app.schemas import (
    MatchSimulation, MatchMinuteData, MatchEvent, MatchEventType, PreMatchOdds
)


# =============================================================================
# Walidacja
# =============================================================================

_TEAM_NAME_RE = re.compile(r"^[\w\s\-\.]{1,50}$", re.UNICODE)


def validate_team_name(name: str) -> tuple[bool, str]:
    """Zwraca (ok, znormalizowana_nazwa_lub_komunikat)."""
    name = (name or "").strip()
    if not name or not _TEAM_NAME_RE.match(name):
        return False, "Nieprawidłowa nazwa drużyny"
    return True, name


# =============================================================================
# Symulacja meczu
# =============================================================================

def generate_match_simulation(
    home_team: str,
    away_team: str,
    date: Optional[str] = None,
    use_historical_data: bool = True
) -> Dict[str, Any]:
    """Generuje pełną symulację meczu (kursy + minuta po minucie)."""
    valid_h, home_team = validate_team_name(home_team)
    valid_a, away_team = validate_team_name(away_team)
    if not valid_h or not valid_a:
        return {"error": "Nieprawidłowa nazwa drużyny"}

    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")

    # Bazowe prawdopodobieństwa 1X2
    home_strength = random.uniform(0.4, 0.6)
    home_win_prob = home_strength * 0.5 + 0.2
    draw_prob = 0.25
    away_win_prob = 1 - home_win_prob - draw_prob

    htft = _compute_htft_odds(home_win_prob, draw_prob, away_win_prob)

    odds = PreMatchOdds(
        home_win=round(0.95 / home_win_prob, 2),
        draw=round(0.95 / draw_prob, 2),
        away_win=round(0.95 / away_win_prob, 2),
        over_2_5=round(random.uniform(1.7, 2.3), 2),
        under_2_5=round(random.uniform(1.6, 2.1), 2),
        btts_yes=round(random.uniform(1.7, 2.0), 2),
        btts_no=round(random.uniform(1.8, 2.1), 2),
        goals_line=2.5,
        corners_line=9.5,
        corners_over=round(random.uniform(1.75, 2.1), 2),
        corners_under=round(random.uniform(1.7, 2.05), 2),
        cards_line=4.5,
        cards_over=round(random.uniform(1.75, 2.1), 2),
        cards_under=round(random.uniform(1.7, 2.05), 2),
        sot_line=8.5,
        sot_over=round(random.uniform(1.75, 2.1), 2),
        sot_under=round(random.uniform(1.75, 2.1), 2),
        offsides_line=3.5,
        offsides_over=round(random.uniform(1.75, 2.1), 2),
        offsides_under=round(random.uniform(1.75, 2.1), 2),
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

    minutes_data = _generate_minute_by_minute(home_team, away_team, home_strength)
    final_minute = minutes_data[-1]

    simulation = MatchSimulation(
        match_id=f"SIM_{home_team[:3].upper()}_{away_team[:3].upper()}_{date.replace('-', '')}",
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
    """Heurystyka kursów HT/FT. Wyniki "spójne" (1/1, X/X, 2/2) dostają bonus."""
    ht_home = p_home * 0.55
    ht_away = p_away * 0.55
    ht_draw = max(0.05, 1 - ht_home - ht_away)

    ft = {"1": p_home, "X": p_draw, "2": p_away}
    ht = {"1": ht_home, "X": ht_draw, "2": ht_away}

    MARGIN = 0.92
    out = {}
    for h_key in ["1", "X", "2"]:
        for f_key in ["1", "X", "2"]:
            p = ht[h_key] * ft[f_key]
            if h_key == f_key:
                p *= 1.6
            p = max(0.005, min(0.50, p))
            out[f"{h_key}/{f_key}"] = round(max(1.1, min(500.0, MARGIN / p)), 2)
    return out


def _generate_minute_by_minute(home_team: str, away_team: str,
                               home_strength: float) -> list:
    """Generuje listę MatchMinuteData (91 minut)."""
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
            rand = random.random()
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
            elif rand < 0.22:
                if random.random() < home_strength:
                    home_corners += 1
                else:
                    away_corners += 1
                commentary = "Rzut rożny."
            elif rand < 0.30:
                if random.random() < 0.5:
                    home_fouls += 1
                else:
                    away_fouls += 1
                commentary = "Faul w środku pola."
                if random.random() < 0.2:
                    if home_fouls > away_fouls:
                        home_yellows += 1
                        events.append(MatchEvent(minute=minute, event_type=MatchEventType.YELLOW_CARD,
                                                 team=home_team, description="Żółta kartka"))
                    else:
                        away_yellows += 1
                        events.append(MatchEvent(minute=minute, event_type=MatchEventType.YELLOW_CARD,
                                                 team=away_team, description="Żółta kartka"))
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

        possession_home = max(35, min(65, possession_home + random.uniform(-3, 3)))

        minutes.append(MatchMinuteData(
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
        ))

    return minutes
