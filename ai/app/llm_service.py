"""
LLM Service - obsługa API (OpenAI, Gemini) oraz trybu lokalnego
"""
import json
import random
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
import structlog

from app.config import get_settings
from app.schemas import FUNCTION_SCHEMAS
from app.guardrails import with_timeout

logger = structlog.get_logger()


class BaseLLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, functions: Optional[List[dict]] = None,
                 system_prompt: Optional[str] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        
    def _get_client(self):
        if self.client is None:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.settings.openai_api_key)
        return self.client
    
    def is_available(self) -> bool:
        return bool(self.settings.openai_api_key)
    
    @with_timeout(60)
    def generate(self, prompt: str, functions: Optional[List[dict]] = None,
                 system_prompt: Optional[str] = None) -> Dict[str, Any]:
        client = self._get_client()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        kwargs = {"model": self.settings.openai_model, "messages": messages,
                  "max_tokens": self.settings.max_output_tokens, "temperature": 0.7}
        
        if functions:
            kwargs["tools"] = [{"type": "function", "function": f} for f in functions]
            kwargs["tool_choice"] = "auto"
        
        response = client.chat.completions.create(**kwargs)
        message = response.choices[0].message
        result = {"content": message.content or ""}
        
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            result["function_call"] = {"name": tool_call.function.name,
                                       "arguments": tool_call.function.arguments}
        return result


class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        
    def _get_model(self):
        if self.model is None:
            import google.generativeai as genai
            genai.configure(api_key=self.settings.gemini_api_key)
            self.model = genai.GenerativeModel(self.settings.gemini_model)
        return self.model
    
    def is_available(self) -> bool:
        return bool(self.settings.gemini_api_key)
    
    @with_timeout(60)
    def generate(self, prompt: str, functions: Optional[List[dict]] = None,
                 system_prompt: Optional[str] = None) -> Dict[str, Any]:
        model = self._get_model()
        full_prompt = f"System: {system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
        response = model.generate_content(full_prompt)
        return {"content": response.text if response.text else ""}


class LocalLLMProvider(BaseLLMProvider):
    """Lokalny stub LLM - symuluje function-calling"""
    
    def __init__(self):
        self.settings = get_settings()
        self.known_teams = ["Arsenal", "Aston Villa", "Bournemouth", "Brighton", "Chelsea",
                           "Crystal Palace", "Everton", "Fulham", "Liverpool", "Manchester City",
                           "Manchester United", "Newcastle", "Tottenham", "West Ham", "Wolves"]
        
    def is_available(self) -> bool:
        return self.settings.local_llm_enabled
    
    def generate(self, prompt: str, functions: Optional[List[dict]] = None,
                 system_prompt: Optional[str] = None) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        
        if functions:
            if any(kw in prompt_lower for kw in ["symul", "mecz", "match", "generate"]):
                teams = self._extract_teams(prompt)
                return {"function_call": {"name": "generate_match_simulation",
                        "arguments": json.dumps({"home_team": teams[0] if teams else "Liverpool",
                                                "away_team": teams[1] if len(teams) > 1 else "Arsenal",
                                                "use_historical_data": True})}}
            
            if any(kw in prompt_lower for kw in ["statyst", "stats", "forma"]):
                teams = self._extract_teams(prompt)
                return {"function_call": {"name": "get_team_stats",
                        "arguments": json.dumps({"team_name": teams[0] if teams else "Liverpool"})}}
            
            if any(kw in prompt_lower for kw in ["szukaj", "search", "historia"]):
                return {"function_call": {"name": "search_matches",
                        "arguments": json.dumps({"query": prompt[:100], "top_k": 5})}}
        
        return {"content": "Podaj nazwy drużyn do symulacji meczu."}
    
    def _extract_teams(self, text: str) -> List[str]:
        found = []
        text_lower = text.lower()
        for team in self.known_teams:
            if team.lower() in text_lower and team not in found:
                found.append(team)
        return found[:2]


class LLMService:
    def __init__(self):
        self.settings = get_settings()
        self.providers = {"openai": OpenAIProvider(), "gemini": GeminiProvider(),
                         "local": LocalLLMProvider()}
        self.system_prompt = """Jesteś ekspertem od piłki nożnej i analiz bukmacherskich.
Generujesz realistyczne symulacje meczów na podstawie danych historycznych."""
    
    def get_provider(self, mode: str = "auto") -> BaseLLMProvider:
        if mode == "auto":
            preferred = self.settings.llm_provider
            if self.providers[preferred].is_available():
                return self.providers[preferred]
            for name in ["openai", "gemini", "local"]:
                if self.providers[name].is_available():
                    return self.providers[name]
        if mode in self.providers and self.providers[mode].is_available():
            return self.providers[mode]
        return self.providers["local"]
    
    def generate(self, prompt: str, mode: str = "auto", use_functions: bool = True,
                 custom_functions: Optional[List[dict]] = None) -> Dict[str, Any]:
        provider = self.get_provider(mode)
        functions = custom_functions or FUNCTION_SCHEMAS if use_functions else None
        return provider.generate(prompt, functions, self.system_prompt)


_llm_service: Optional[LLMService] = None

def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
