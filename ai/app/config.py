"""
Konfiguracja aplikacji - ustawienia z pliku .env
"""
from pydantic_settings import BaseSettings
from typing import Literal
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Główne ustawienia aplikacji"""
    
    # LLM Configuration
    llm_provider: Literal["openai", "gemini", "local"] = "local"
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    
    # Local LLM
    local_llm_enabled: bool = True
    
    # RAG Configuration
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    faiss_index_path: str = "./data/match_index"
    top_k_retrieval: int = 5
    
    # Security
    timeout_seconds: int = 30
    max_input_length: int = 2000
    max_output_tokens: int = 4096
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug_mode: bool = False
    
    # Data paths
    match_data_path: str = "./DANE"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Zwraca singleton ustawień"""
    return Settings()


# Lista dozwolonych narzędzi (allowlist)
ALLOWED_TOOLS = [
    "generate_match_simulation",
    "get_team_stats",
    "search_matches",
    "calculate_odds",
    "get_historical_data"
]

# Limity bezpieczeństwa
SECURITY_LIMITS = {
    "max_matches_per_request": 10,
    "max_minutes_simulation": 120,
    "max_context_chunks": 20,
    "max_file_path_length": 256
}
