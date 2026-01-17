"""
REST API dla symulatora meczów Premier League
Swagger UI dostępny pod /docs
"""
from flask import Flask
from flask_restx import Api, Resource, fields, Namespace
from flask_cors import CORS
from datetime import datetime
import json
import os

from simulator import MatchSimulator

app = Flask(__name__)
CORS(app)

# Konfiguracja Swagger
api = Api(
    app,
    version='1.0',
    title='⚽ Premier League Match Simulator API',
    description='API do symulacji meczów Premier League na podstawie danych historycznych z 10 sezonów.',
    doc='/docs'
)

# Namespace'y
ns_main = api.namespace('api', description='Główne operacje')

# Inicjalizacja symulatora
DATA_PATH = os.environ.get('DATA_PATH', os.path.dirname(os.path.abspath(__file__)))
simulator = MatchSimulator(data_path=DATA_PATH)

# ============== MODELE ==============

# Model statystyk drużyny
team_stats_model = api.model('TeamStats', {
    'goals_scored': fields.Float(description='Średnia goli strzelonych na mecz'),
    'goals_conceded': fields.Float(description='Średnia goli straconych na mecz'),
    'shots': fields.Float(description='Średnia strzałów na mecz'),
    'shots_on_target': fields.Float(description='Średnia strzałów celnych na mecz'),
    'corners': fields.Float(description='Średnia rzutów rożnych na mecz'),
    'fouls': fields.Float(description='Średnia fauli na mecz'),
    'yellow_cards': fields.Float(description='Średnia żółtych kartek na mecz'),
    'red_cards': fields.Float(description='Średnia czerwonych kartek na mecz'),
    'matches_played': fields.Integer(description='Liczba meczów w bazie')
})

# Model minuty meczu
minute_model = api.model('Minute', {
    'minute': fields.Integer(description='Numer minuty'),
    'score': fields.String(description='Aktualny wynik'),
    'possession': fields.String(description='Kto ma piłkę (home/away)'),
    'home_corners': fields.Integer(description='Rożne gospodarzy'),
    'away_corners': fields.Integer(description='Rożne gości'),
    'home_fouls': fields.Integer(description='Faule gospodarzy'),
    'away_fouls': fields.Integer(description='Faule gości'),
    'comment': fields.String(description='Komentarz po polsku')
})

# Model statystyk meczu
match_stats_model = api.model('MatchStats', {
    'home_goals': fields.Integer(description='Gole gospodarzy'),
    'away_goals': fields.Integer(description='Gole gości'),
    'home_corners': fields.Integer(description='Rożne gospodarzy'),
    'away_corners': fields.Integer(description='Rożne gości'),
    'home_fouls': fields.Integer(description='Faule gospodarzy'),
    'away_fouls': fields.Integer(description='Faule gości'),
    'home_yellow_cards': fields.Integer(description='Żółte kartki gospodarzy'),
    'away_yellow_cards': fields.Integer(description='Żółte kartki gości'),
    'home_red_cards': fields.Integer(description='Czerwone kartki gospodarzy'),
    'away_red_cards': fields.Integer(description='Czerwone kartki gości'),
    'home_shots': fields.Integer(description='Strzały gospodarzy'),
    'away_shots': fields.Integer(description='Strzały gości'),
    'home_shots_on_target': fields.Integer(description='Celne strzały gospodarzy'),
    'away_shots_on_target': fields.Integer(description='Celne strzały gości')
})

# Model pełnego meczu
match_model = api.model('Match', {
    'home_team': fields.String(description='Drużyna gospodarzy'),
    'away_team': fields.String(description='Drużyna gości'),
    'league': fields.String(description='Liga (E0 = Premier League)'),
    'season': fields.String(description='Sezon'),
    'score_final': fields.String(description='Wynik końcowy'),
    'stats': fields.Nested(match_stats_model, description='Statystyki meczu'),
    'duration': fields.Integer(description='Czas trwania meczu (minuty)'),
    'minutes': fields.List(fields.Nested(minute_model), description='Przebieg minuta po minucie')
})

# Model requestu symulacji meczu
simulate_match_request = api.model('SimulateMatchRequest', {
    'home_team': fields.String(required=True, description='Nazwa drużyny gospodarzy', example='Arsenal'),
    'away_team': fields.String(required=True, description='Nazwa drużyny gości', example='Chelsea'),
    'season': fields.String(description='Sezon', example='2025-2026', default='2025-2026'),
    'use_llm': fields.Boolean(description='Użyj LLM (Mistral) do komentarzy', default=False)
})

# Model requestu matchday
simulate_matchday_request = api.model('SimulateMatchdayRequest', {
    'num_matches': fields.Integer(description='Liczba meczów do wygenerowania', example=10, default=10),
    'season': fields.String(description='Sezon', example='2025-2026', default='2025-2026'),
    'use_llm': fields.Boolean(description='Użyj LLM (Mistral) do komentarzy', default=False)
})

# Model pojedynczej pary meczowej
match_pair_model = api.model('MatchPair', {
    'home': fields.String(required=True, description='Drużyna gospodarzy', example='Arsenal'),
    'away': fields.String(required=True, description='Drużyna gości', example='Chelsea')
})

# Model requestu custom matchday
simulate_custom_request = api.model('SimulateCustomRequest', {
    'matches': fields.List(fields.Nested(match_pair_model), required=True, description='Lista par meczowych'),
    'season': fields.String(description='Sezon', example='2025-2026', default='2025-2026'),
    'use_llm': fields.Boolean(description='Użyj LLM (Mistral) do komentarzy', default=False)
})

# Model requestu eksportu
export_request = api.model('ExportRequest', {
    'num_matches': fields.Integer(description='Liczba meczów', example=10, default=10),
    'season': fields.String(description='Sezon', example='2025-2026', default='2025-2026'),
    'use_llm': fields.Boolean(description='Użyj LLM', default=False),
    'filename': fields.String(description='Nazwa pliku wyjściowego', example='matchday_2026-01-11.json')
})

# Model odpowiedzi matchday
matchday_response = api.model('MatchdayResponse', {
    'date': fields.String(description='Data wygenerowania'),
    'season': fields.String(description='Sezon'),
    'num_matches': fields.Integer(description='Liczba meczów'),
    'matches': fields.List(fields.Nested(match_model), description='Lista meczów')
})


# ============== ENDPOINTY ==============

@ns_main.route('/health')
class Health(Resource):
    @api.doc('health_check')
    def get(self):
        """Sprawdź status API"""
        return {
            "status": "ok",
            "teams_loaded": len(simulator.teams),
            "matches_in_db": len(simulator.df),
            "timestamp": datetime.now().isoformat()
        }


@ns_main.route('/teams')
class Teams(Resource):
    @api.doc('get_teams')
    def get(self):
        """Pobierz listę wszystkich drużyn"""
        return {
            "teams": simulator.get_teams(),
            "count": len(simulator.get_teams())
        }


@ns_main.route('/team/<string:team_name>/stats')
@api.param('team_name', 'Nazwa drużyny')
class TeamStats(Resource):
    @api.doc('get_team_stats')
    @api.response(200, 'Success', team_stats_model)
    @api.response(404, 'Drużyna nie znaleziona')
    def get(self, team_name):
        """Pobierz statystyki drużyny"""
        stats = simulator.get_team_stats(team_name)
        
        if stats is None:
            api.abort(404, f"Nieznana drużyna: {team_name}", available_teams=simulator.get_teams())
        
        return {
            "team": team_name,
            "stats": stats
        }


@ns_main.route('/simulate/match')
class SimulateMatch(Resource):
    @api.doc('simulate_single_match')
    @api.expect(simulate_match_request)
    @api.response(200, 'Success', match_model)
    @api.response(400, 'Błędne dane wejściowe')
    def post(self):
        """Symuluj pojedynczy mecz"""
        data = api.payload or {}
        
        home_team = data.get('home_team')
        away_team = data.get('away_team')
        season = data.get('season', '2025-2026')
        use_llm = data.get('use_llm', False)
        
        # Walidacja
        if not home_team or not away_team:
            api.abort(400, "Wymagane pola: home_team, away_team")
        
        if home_team not in simulator.teams:
            api.abort(400, f"Nieznana drużyna: {home_team}", available_teams=simulator.get_teams())
        
        if away_team not in simulator.teams:
            api.abort(400, f"Nieznana drużyna: {away_team}", available_teams=simulator.get_teams())
        
        if home_team == away_team:
            api.abort(400, "Drużyny muszą być różne")
        
        # Symulacja
        match = simulator.simulate_match(home_team, away_team, season, use_llm)
        return match


@ns_main.route('/simulate/matchday')
class SimulateMatchday(Resource):
    @api.doc('simulate_matchday')
    @api.expect(simulate_matchday_request)
    @api.response(200, 'Success', matchday_response)
    def post(self):
        """Generuj losowe mecze na cały dzień"""
        data = api.payload or {}
        
        num_matches = data.get('num_matches', 10)
        season = data.get('season', '2025-2026')
        use_llm = data.get('use_llm', False)
        
        # Walidacja
        if num_matches < 1:
            api.abort(400, "num_matches musi być >= 1")
        if num_matches > len(simulator.teams) // 2:
            api.abort(400, f"Maksymalna liczba meczów: {len(simulator.teams) // 2}")
        
        # Generuj mecze
        matches = simulator.generate_matchday(num_matches, season, use_llm)
        
        return {
            "date": datetime.now().isoformat(),
            "season": season,
            "num_matches": len(matches),
            "matches": matches
        }


@ns_main.route('/simulate/custom')
class SimulateCustom(Resource):
    @api.doc('simulate_custom_matchday')
    @api.expect(simulate_custom_request)
    @api.response(200, 'Success', matchday_response)
    def post(self):
        """Symuluj określone mecze (custom fixture list)"""
        data = api.payload or {}
        
        match_pairs = data.get('matches', [])
        season = data.get('season', '2025-2026')
        use_llm = data.get('use_llm', False)
        
        if not match_pairs:
            api.abort(400, "Wymagana lista meczów w polu 'matches'")
        
        results = []
        errors = []
        
        for i, pair in enumerate(match_pairs):
            home = pair.get('home')
            away = pair.get('away')
            
            if not home or not away:
                errors.append(f"Mecz {i+1}: brak home lub away")
                continue
            
            if home not in simulator.teams:
                errors.append(f"Mecz {i+1}: nieznana drużyna {home}")
                continue
            
            if away not in simulator.teams:
                errors.append(f"Mecz {i+1}: nieznana drużyna {away}")
                continue
            
            match = simulator.simulate_match(home, away, season, use_llm)
            results.append(match)
        
        response = {
            "date": datetime.now().isoformat(),
            "season": season,
            "num_matches": len(results),
            "matches": results
        }
        
        if errors:
            response["errors"] = errors
        
        return response


@ns_main.route('/export/matchday')
class ExportMatchday(Resource):
    @api.doc('export_matchday')
    @api.expect(export_request)
    def post(self):
        """Generuj i eksportuj mecze do pliku JSON"""
        data = api.payload or {}
        
        num_matches = data.get('num_matches', 10)
        season = data.get('season', '2025-2026')
        use_llm = data.get('use_llm', False)
        filename = data.get('filename', f"matchday_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json")
        
        # Generuj mecze
        matches = simulator.generate_matchday(num_matches, season, use_llm)
        
        # Zapisz do pliku
        output_path = os.path.join(DATA_PATH, 'output', filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        output_data = {
            "generated_at": datetime.now().isoformat(),
            "season": season,
            "num_matches": len(matches),
            "matches": matches
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        return {
            "file": output_path,
            "generated_at": output_data["generated_at"],
            "num_matches": len(matches),
            "matches": matches
        }


if __name__ == '__main__':
    print("\n" + "="*50)
    print("⚽ Premier League Match Simulator API")
    print("="*50)
    print(f"Drużyn: {len(simulator.teams)}")
    print(f"Meczów w bazie: {len(simulator.df)}")
    print("\n📚 Swagger UI: http://localhost:5000/docs")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
