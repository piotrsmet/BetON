"""
Symulator meczów Premier League
Wykorzystuje dane historyczne + Mistral przez Ollama
"""
import pandas as pd
import json
import random
import requests
import os
from glob import glob
from typing import List, Dict, Optional

# Mapowanie plików na sezony
SEASON_MAP = {
    'E0.xlsx': '2025-2026',
    'E0 (1).xlsx': '2024-2025',
    'E0 (2).xlsx': '2023-2024',
    'E0 (3).xlsx': '2022-2023',
    'E0 (4).xlsx': '2021-2022',
    'E0 (5).xlsx': '2020-2021',
    'E0 (6).xlsx': '2019-2020',
    'E0 (7).xlsx': '2018-2019',
    'E0 (8).xlsx': '2017-2018',
    'E0 (9).xlsx': '2016-2017',
    'E0 (10).xlsx': '2015-2016',
}

# Szablony komentarzy po polsku
COMMENTS = {
    "goal": [
        "GOOOOL! {team} strzela na {score}!",
        "Bramka dla {team}! Wynik {score}",
        "Piłka w siatce! {team} zmienia stan na {score}",
        "Fantastyczne uderzenie! {team} prowadzi {score}",
        "{team} trafia do bramki! {score}"
    ],
    "possession": [
        "{team} kontroluje piłkę w środku pola.",
        "Spokojne rozgrywanie przez {team}.",
        "{team} szuka okazji do ataku.",
        "Wymiana podań w wykonaniu {team}.",
        "{team} utrzymuje się przy piłce.",
        "Cierpliwa gra {team} w ofensywie.",
        "{team} próbuje przejąć inicjatywę."
    ],
    "corner": [
        "Rzut rożny dla {team}.",
        "Korner dla {team}, piłka wędruje w pole karne.",
        "{team} będzie wykonywać róg."
    ],
    "foul": [
        "Faul zawodnika {team}.",
        "Przewinienie po stronie {team}.",
        "Sędzia odgwizduje faul {team}."
    ],
    "shot": [
        "Strzał {team}! Bramkarz interweniuje.",
        "{team} próbuje zaskoczyć golkipera.",
        "Uderzenie {team}, ale niecelne.",
        "{team} oddaje strzał, piłka leci obok."
    ],
    "shot_on_target": [
        "Celny strzał {team}! Świetna parada bramkarza.",
        "{team} uderza, ale golkiper na posterunku.",
        "Groźna sytuacja {team}, bramkarz ratuje."
    ],
    "yellow_card": [
        "Żółta kartka dla zawodnika {team}!",
        "Sędzia pokazuje żółtą kartkę dla {team}.",
        "Ostrzeżenie dla piłkarza {team}."
    ],
    "red_card": [
        "CZERWONA KARTKA! {team} gra w dziesiątkę!",
        "Sędzia wyrzuca zawodnika {team} z boiska!"
    ],
    "halftime": [
        "Koniec pierwszej połowy. Wynik: {score}",
        "Sędzia gwiżdże przerwę. {score} do przerwy."
    ],
    "start": [
        "Pierwszy gwizdek! Mecz czas zacząć.",
        "Sędzia rozpoczyna spotkanie.",
        "Zaczynamy! Piłka w grze."
    ],
    "start2": [
        "Druga połowa rozpoczęta!",
        "Wracamy do gry po przerwie.",
        "Rusza druga część meczu."
    ],
    "end": [
        "Koniec meczu! Wynik końcowy: {score}",
        "Sędzia kończy spotkanie. {home} {score} {away}",
        "To już koniec! {score}"
    ]
}


class MatchSimulator:
    def __init__(self, data_path: str = "/app"):
        self.data_path = data_path
        self.df = self._load_all_data()
        self.teams = self._get_all_teams()
        self.team_stats = self._calculate_team_stats()
        print(f"Załadowano {len(self.df)} meczów, {len(self.teams)} drużyn")
    
    def _load_all_data(self) -> pd.DataFrame:
        """Wczytaj wszystkie pliki Excel z danymi meczów"""
        files = glob(f'{self.data_path}/E0*.xlsx')
        all_data = []
        
        for file in files:
            try:
                df = pd.read_excel(file)
                filename = os.path.basename(file)
                df['Season'] = SEASON_MAP.get(filename, 'Unknown')
                all_data.append(df)
            except Exception as e:
                print(f"Błąd wczytywania {file}: {e}")
        
        return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()
    
    def _get_all_teams(self) -> List[str]:
        """Pobierz listę wszystkich drużyn"""
        home_teams = set(self.df['HomeTeam'].dropna().unique())
        away_teams = set(self.df['AwayTeam'].dropna().unique())
        return sorted(list(home_teams | away_teams))
    
    def _calculate_team_stats(self) -> Dict[str, Dict]:
        """Oblicz średnie statystyki dla każdej drużyny"""
        stats = {}
        
        for team in self.teams:
            home_matches = self.df[self.df['HomeTeam'] == team]
            away_matches = self.df[self.df['AwayTeam'] == team]
            
            total_matches = len(home_matches) + len(away_matches)
            if total_matches == 0:
                stats[team] = self._default_stats()
                continue
            
            # Gole strzelone
            goals_scored = (
                home_matches['FTHG'].sum() + away_matches['FTAG'].sum()
            ) / total_matches
            
            # Gole stracone
            goals_conceded = (
                home_matches['FTAG'].sum() + away_matches['FTHG'].sum()
            ) / total_matches
            
            # Strzały
            shots = (
                home_matches['HS'].sum() + away_matches['AS'].sum()
            ) / total_matches if 'HS' in self.df.columns else 12
            
            # Strzały celne
            shots_on_target = (
                home_matches['HST'].sum() + away_matches['AST'].sum()
            ) / total_matches if 'HST' in self.df.columns else 4
            
            # Rożne
            corners = (
                home_matches['HC'].sum() + away_matches['AC'].sum()
            ) / total_matches if 'HC' in self.df.columns else 5
            
            # Faule
            fouls = (
                home_matches['HF'].sum() + away_matches['AF'].sum()
            ) / total_matches if 'HF' in self.df.columns else 11
            
            # Żółte kartki
            yellows = (
                home_matches['HY'].sum() + away_matches['AY'].sum()
            ) / total_matches if 'HY' in self.df.columns else 1.5
            
            # Czerwone kartki
            reds = (
                home_matches['HR'].sum() + away_matches['AR'].sum()
            ) / total_matches if 'HR' in self.df.columns else 0.05
            
            stats[team] = {
                'goals_scored': round(goals_scored, 2),
                'goals_conceded': round(goals_conceded, 2),
                'shots': round(shots, 1),
                'shots_on_target': round(shots_on_target, 1),
                'corners': round(corners, 1),
                'fouls': round(fouls, 1),
                'yellow_cards': round(yellows, 2),
                'red_cards': round(reds, 3),
                'matches_played': total_matches
            }
        
        return stats
    
    def _default_stats(self) -> Dict:
        """Domyślne statystyki dla nieznanej drużyny"""
        return {
            'goals_scored': 1.3,
            'goals_conceded': 1.3,
            'shots': 12,
            'shots_on_target': 4,
            'corners': 5,
            'fouls': 11,
            'yellow_cards': 1.5,
            'red_cards': 0.05,
            'matches_played': 0
        }
    
    def get_teams(self) -> List[str]:
        """Zwróć listę drużyn"""
        return self.teams
    
    def get_team_stats(self, team: str) -> Optional[Dict]:
        """Zwróć statystyki drużyny"""
        return self.team_stats.get(team)
    
    def simulate_match(
        self, 
        home_team: str, 
        away_team: str, 
        season: str = "2025-2026",
        use_llm: bool = False
    ) -> Dict:
        """Symuluj pojedynczy mecz"""
        
        if use_llm:
            try:
                return self._simulate_with_llm(home_team, away_team, season)
            except Exception as e:
                print(f"LLM error, falling back to statistical: {e}")
        
        return self._simulate_statistical(home_team, away_team, season)
    
    def _simulate_with_llm(self, home_team: str, away_team: str, season: str) -> Dict:
        """Symulacja z użyciem Mistral przez Ollama"""
        hs = self.team_stats.get(home_team, self._default_stats())
        aws = self.team_stats.get(away_team, self._default_stats())
        
        prompt = f"""Wygeneruj realistyczny przebieg meczu Premier League w formacie JSON.

DANE WEJŚCIOWE:
- Gospodarze: {home_team} (średnio {hs['goals_scored']:.1f} goli, {hs['corners']:.0f} rożnych/mecz)
- Goście: {away_team} (średnio {aws['goals_scored']:.1f} goli, {aws['corners']:.0f} rożnych/mecz)
- Sezon: {season}

WYMAGANY FORMAT JSON (zwróć TYLKO JSON, bez dodatkowego tekstu):
{{
  "home_team": "{home_team}",
  "away_team": "{away_team}",
  "league": "E0",
  "season": "{season}",
  "score_final": "X:Y",
  "stats": {{
    "home_goals": X,
    "away_goals": Y,
    "home_corners": N,
    "away_corners": N,
    "home_fouls": N,
    "away_fouls": N,
    "home_yellow_cards": N,
    "away_yellow_cards": N,
    "home_shots": N,
    "away_shots": N,
    "home_shots_on_target": N,
    "away_shots_on_target": N
  }},
  "duration": 90-96,
  "minutes": [
    {{"minute": 1, "score": "0:0", "possession": "home", "home_corners": 0, "away_corners": 0, "home_fouls": 0, "away_fouls": 0, "comment": "Komentarz po polsku"}}
  ]
}}

Wygeneruj wszystkie 90+ minut z realistycznymi komentarzami po polsku."""

        # URL Ollama (z Docker lub lokalnie)
        ollama_host = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
        
        response = requests.post(
            f'{ollama_host}/api/generate',
            json={
                'model': 'mistral',
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.8,
                    'num_predict': 8000
                }
            },
            timeout=180
        )
        
        result = response.json()
        text = result.get('response', '')
        
        # Wyciągnij JSON z odpowiedzi
        start = text.find('{')
        end = text.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError("Nie znaleziono JSON w odpowiedzi")
        
        return json.loads(text[start:end])
    
    def _simulate_statistical(self, home_team: str, away_team: str, season: str) -> Dict:
        """Symulacja statystyczna (bez LLM)"""
        hs = self.team_stats.get(home_team, self._default_stats())
        aws = self.team_stats.get(away_team, self._default_stats())
        
        # Przewaga gospodarzy
        home_advantage = 1.15
        
        # Symulacja wyniku na podstawie siły ataku/obrony
        home_attack = hs['goals_scored'] * home_advantage
        away_attack = aws['goals_scored']
        home_defense = hs['goals_conceded']
        away_defense = aws['goals_conceded']
        
        # Oczekiwane gole
        expected_home = (home_attack + away_defense) / 2
        expected_away = (away_attack + home_defense) / 2 / home_advantage
        
        # Losowanie z rozkładu Poissona (przybliżenie przez Gaussa)
        home_goals = max(0, int(random.gauss(expected_home, 1.1)))
        away_goals = max(0, int(random.gauss(expected_away, 1.0)))
        
        # Inne statystyki
        home_shots = max(1, int(random.gauss(hs['shots'] * home_advantage, 3)))
        away_shots = max(1, int(random.gauss(aws['shots'], 3)))
        home_sot = min(home_shots, max(0, int(random.gauss(hs['shots_on_target'], 1.5))))
        away_sot = min(away_shots, max(0, int(random.gauss(aws['shots_on_target'], 1.5))))
        home_corners = max(0, int(random.gauss(hs['corners'] * home_advantage, 2)))
        away_corners = max(0, int(random.gauss(aws['corners'], 2)))
        home_fouls = max(0, int(random.gauss(hs['fouls'], 3)))
        away_fouls = max(0, int(random.gauss(aws['fouls'], 3)))
        home_yellows = max(0, int(random.gauss(hs['yellow_cards'], 0.8)))
        away_yellows = max(0, int(random.gauss(aws['yellow_cards'], 0.8)))
        home_reds = 1 if random.random() < hs['red_cards'] else 0
        away_reds = 1 if random.random() < aws['red_cards'] else 0
        
        duration = random.randint(90, 96)
        
        # Generuj przebieg minuta po minucie
        minutes = self._generate_minutes(
            home_team, away_team,
            home_goals, away_goals,
            home_shots, away_shots,
            home_sot, away_sot,
            home_corners, away_corners,
            home_fouls, away_fouls,
            home_yellows, away_yellows,
            home_reds, away_reds,
            duration
        )
        
        return {
            "home_team": home_team,
            "away_team": away_team,
            "league": "E0",
            "season": season,
            "score_final": f"{home_goals}:{away_goals}",
            "stats": {
                "home_goals": home_goals,
                "away_goals": away_goals,
                "home_corners": home_corners,
                "away_corners": away_corners,
                "home_fouls": home_fouls,
                "away_fouls": away_fouls,
                "home_yellow_cards": home_yellows,
                "away_yellow_cards": away_yellows,
                "home_red_cards": home_reds,
                "away_red_cards": away_reds,
                "home_shots": home_shots,
                "away_shots": away_shots,
                "home_shots_on_target": home_sot,
                "away_shots_on_target": away_sot
            },
            "duration": duration,
            "minutes": minutes
        }
    
    def _generate_minutes(
        self, home_team: str, away_team: str,
        hg: int, ag: int,
        hs: int, aws: int,
        hsot: int, asot: int,
        hc: int, ac: int,
        hf: int, af: int,
        hy: int, ay: int,
        hr: int, ar: int,
        duration: int
    ) -> List[Dict]:
        """Generuj przebieg meczu minuta po minucie"""
        
        # Rozłóż wydarzenia na minuty
        total_goals = hg + ag
        goal_minutes = sorted(random.sample(range(1, 91), min(total_goals, 90))) if total_goals > 0 else []
        home_goal_minutes = set(random.sample(goal_minutes, hg)) if hg > 0 and goal_minutes else set()
        
        # Strzały (poza golami)
        shot_minutes = sorted(random.sample(
            [m for m in range(1, 91) if m not in goal_minutes], 
            min(hs + aws - total_goals, 85)
        )) if (hs + aws - total_goals) > 0 else []
        home_shot_minutes = set(random.sample(shot_minutes, min(hs - hg, len(shot_minutes)))) if (hs - hg) > 0 else set()
        
        # Rożne
        corner_minutes = random.sample(range(1, 91), min(hc + ac, 50))
        home_corner_minutes = set(random.sample(corner_minutes, min(hc, len(corner_minutes)))) if hc > 0 else set()
        
        # Faule
        foul_minutes = random.sample(range(1, 91), min(hf + af, 60))
        home_foul_minutes = set(random.sample(foul_minutes, min(hf, len(foul_minutes)))) if hf > 0 else set()
        
        # Kartki
        yellow_minutes = random.sample(range(1, 91), min(hy + ay, 10))
        home_yellow_minutes = set(random.sample(yellow_minutes, min(hy, len(yellow_minutes)))) if hy > 0 else set()
        
        red_minutes = random.sample(range(30, 91), min(hr + ar, 2)) if (hr + ar) > 0 else []
        home_red_minutes = set(random.sample(red_minutes, min(hr, len(red_minutes)))) if hr > 0 else set()
        
        minutes = []
        curr_hg, curr_ag = 0, 0
        curr_hc, curr_ac = 0, 0
        curr_hf, curr_af = 0, 0
        
        for m in range(1, duration + 1):
            # Określ wydarzenie
            event = "possession"
            team = home_team if random.random() > 0.45 else away_team  # lekka przewaga gospodarzy
            
            if m == 1:
                event = "start"
            elif m == 45:
                event = "halftime"
            elif m == 46:
                event = "start2"
            elif m == duration:
                event = "end"
            elif m in goal_minutes:
                event = "goal"
                if m in home_goal_minutes:
                    curr_hg += 1
                    team = home_team
                else:
                    curr_ag += 1
                    team = away_team
            elif m in red_minutes:
                event = "red_card"
                team = home_team if m in home_red_minutes else away_team
            elif m in yellow_minutes:
                event = "yellow_card"
                team = home_team if m in home_yellow_minutes else away_team
            elif m in shot_minutes:
                if m in home_shot_minutes:
                    event = "shot_on_target" if random.random() < 0.4 else "shot"
                    team = home_team
                else:
                    event = "shot_on_target" if random.random() < 0.4 else "shot"
                    team = away_team
            elif m in corner_minutes:
                event = "corner"
                if m in home_corner_minutes:
                    curr_hc += 1
                    team = home_team
                else:
                    curr_ac += 1
                    team = away_team
            elif m in foul_minutes:
                event = "foul"
                if m in home_foul_minutes:
                    curr_hf += 1
                    team = home_team
                else:
                    curr_af += 1
                    team = away_team
            
            score = f"{curr_hg}:{curr_ag}"
            
            # Wybierz komentarz
            comment_template = random.choice(COMMENTS.get(event, COMMENTS["possession"]))
            comment = comment_template.format(
                team=team, 
                score=score,
                home=home_team,
                away=away_team
            )
            
            minutes.append({
                "minute": m,
                "score": score,
                "possession": "home" if team == home_team else "away",
                "home_corners": curr_hc,
                "away_corners": curr_ac,
                "home_fouls": curr_hf,
                "away_fouls": curr_af,
                "comment": comment
            })
        
        return minutes
    
    def generate_matchday(
        self, 
        num_matches: int = 10, 
        season: str = "2025-2026",
        use_llm: bool = False
    ) -> List[Dict]:
        """Generuj losowe mecze na dany dzień"""
        available_teams = self.teams.copy()
        random.shuffle(available_teams)
        
        matches = []
        for _ in range(min(num_matches, len(available_teams) // 2)):
            home_team = available_teams.pop()
            away_team = available_teams.pop()
            match = self.simulate_match(home_team, away_team, season, use_llm)
            matches.append(match)
        
        return matches


# Test
if __name__ == "__main__":
    sim = MatchSimulator()
    print(f"\nDrużyny: {sim.get_teams()[:5]}...")
    print(f"\nStatystyki Arsenal: {sim.get_team_stats('Arsenal')}")
    
    # Test symulacji
    match = sim.simulate_match("Arsenal", "Chelsea", use_llm=False)
    print(f"\nSymulacja: {match['home_team']} {match['score_final']} {match['away_team']}")
    print(f"Pierwsze 3 minuty:")
    for m in match['minutes'][:3]:
        print(f"  {m['minute']}': {m['comment']}")
