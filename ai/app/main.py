"""
FastAPI główna aplikacja z endpointem /ask i obsługą symulacji meczów
"""
import json
import time
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager
import structlog

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.schemas import (AskRequest, GenerateMatchRequest, GenerateBatchRequest,
                         APIResponse, ErrorResponse)
from app.guardrails import (detect_prompt_injection, validate_request, 
                            check_rate_limit, sanitize_output)
from app.llm_service import get_llm_service
from app.rag_service import get_rag_service
from app.tools import dispatcher, registry

logger = structlog.get_logger()


# =============================================================================
# Metrics & Logging
# =============================================================================

class Metrics:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.timeout_errors = 0
        self.injection_blocked = 0
        self.tool_calls = {}
        self.latencies = []
        
    def record_request(self, success: bool, latency: float, tool: Optional[str] = None):
        self.total_requests += 1
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        self.latencies.append(latency)
        if len(self.latencies) > 1000:
            self.latencies = self.latencies[-1000:]
        if tool:
            self.tool_calls[tool] = self.tool_calls.get(tool, 0) + 1
    
    def get_stats(self):
        avg_latency = sum(self.latencies) / len(self.latencies) if self.latencies else 0
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": round(self.successful_requests / max(self.total_requests, 1) * 100, 2),
            "timeout_errors": self.timeout_errors,
            "injection_blocked": self.injection_blocked,
            "avg_latency_ms": round(avg_latency * 1000, 2),
            "tool_calls": self.tool_calls
        }

metrics = Metrics()


# =============================================================================
# Lifespan & App
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_application")
    rag = get_rag_service()
    rag.initialize()
    yield
    logger.info("shutting_down")


app = FastAPI(
    title="Football Match Simulation API",
    description="API do generowania symulacji meczów piłkarskich z LLM",
    version="1.0.0",
    lifespan=lifespan
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
    return {"status": "ok", "message": "Football Match Simulation API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/metrics")
async def get_metrics():
    return metrics.get_stats()


@app.post("/ask", response_model=APIResponse)
async def ask(request: AskRequest, req: Request):
    """
    Główny endpoint - przetwarza pytanie przez LLM z function-calling i RAG.
    
    Parameters:
    - question: Pytanie użytkownika
    - k: Liczba dokumentów do retrieval (1-20)
    - mode: Tryb LLM ("api", "local")
    - use_functions: Czy używać function-calling
    """
    start_time = time.time()
    client_id = req.client.host if req.client else "unknown"
    
    # Rate limiting
    allowed, remaining = check_rate_limit(client_id)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Wykryj prompt injection
    is_injection, pattern = detect_prompt_injection(request.question)
    if is_injection:
        metrics.injection_blocked += 1
        logger.warning("injection_blocked", client=client_id, pattern=pattern)
        raise HTTPException(status_code=400, detail="Wykryto próbę prompt injection")
    
    # Walidacja
    is_valid, sanitized, error = validate_request(request.question)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    try:
        # RAG retrieval
        rag = get_rag_service()
        hits = rag.retrieve(sanitized, request.k)
        context, rag_meta = rag.pack_context(hits)
        
        # Przygotuj prompt z kontekstem
        prompt_with_context = f"""Pytanie użytkownika: {sanitized}

Kontekst z bazy danych meczów Premier League:
{context}

Odpowiedz na pytanie używając dostępnych narzędzi jeśli to potrzebne."""
        
        # LLM
        llm = get_llm_service()
        mode = "local" if request.mode == "local" else "auto"
        response = llm.generate(prompt_with_context, mode=mode, use_functions=request.use_functions)
        
        result = {"answer": response.get("content", ""), "meta": rag_meta}
        
        # Jeśli jest function call - wykonaj
        if "function_call" in response:
            fc = response["function_call"]
            tool_name = fc["name"]
            try:
                arguments = json.loads(fc["arguments"])
            except json.JSONDecodeError:
                arguments = {}
            
            tool_result = dispatcher.dispatch(tool_name, arguments)
            result["tool"] = tool_name
            result["tool_output"] = tool_result
            metrics.record_request(True, time.time() - start_time, tool_name)
        else:
            metrics.record_request(True, time.time() - start_time)
        
        logger.info("ask_complete", latency=time.time() - start_time)
        return APIResponse(status="ok", data=result, meta=rag_meta)
        
    except Exception as e:
        metrics.record_request(False, time.time() - start_time)
        import traceback
        trace = traceback.format_exc()
        logger.error("ask_error", error=str(e), traceback=trace)
        # return debugging info
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error_type": "internal_error", 
                     "message": f"{str(e)}\n{trace}"}
        )


@app.post("/generate/match")
async def generate_single_match(request: GenerateMatchRequest):
    """Generuje symulację pojedynczego meczu"""
    start_time = time.time()
    
    try:
        from app.tools import generate_match_simulation
        result = generate_match_simulation(
            home_team=request.home_team,
            away_team=request.away_team,
            date=request.date,
            use_historical_data=request.use_historical_data
        )
        
        metrics.record_request(True, time.time() - start_time, "generate_match_simulation")
        return APIResponse(status="ok", data=result)
        
    except Exception as e:
        metrics.record_request(False, time.time() - start_time)
        logger.error("generate_match_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/batch")
async def generate_batch_matches(request: GenerateBatchRequest):
    """Generuje symulacje wielu meczów naraz (max 10)"""
    start_time = time.time()
    
    try:
        from app.tools import generate_match_simulation
        results = []
        
        for match in request.matches:
            result = generate_match_simulation(
                home_team=match.home_team,
                away_team=match.away_team,
                date=match.date,
                use_historical_data=match.use_historical_data
            )
            results.append(result)
        
        metrics.record_request(True, time.time() - start_time, "generate_batch")
        return APIResponse(status="ok", data={"matches": results, "count": len(results)})
        
    except Exception as e:
        metrics.record_request(False, time.time() - start_time)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/teams")
async def list_teams():
    """Lista dostępnych drużyn w bazie"""
    rag = get_rag_service()
    if not rag.documents:
        return {"teams": []}
    
    teams = set()
    for doc in rag.documents:
        if doc.get("home_team"):
            teams.add(doc["home_team"])
        if doc.get("away_team"):
            teams.add(doc["away_team"])
    
    return {"teams": sorted(list(teams)), "count": len(teams)}


@app.get("/teams/{team_name}/stats")
async def team_stats(team_name: str):
    """Statystyki drużyny"""
    from app.tools import get_team_stats
    return get_team_stats(team_name)


@app.get("/tools")
async def list_tools():
    """Lista dostępnych narzędzi"""
    return {"tools": registry.list_tools()}


# =============================================================================
# Error Handlers
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
