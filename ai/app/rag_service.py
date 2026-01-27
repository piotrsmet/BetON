"""
Mini-RAG Service - embeddingi + FAISS + retrieval z danych historycznych meczów
"""
import os
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np
import structlog
import pandas as pd

from app.config import get_settings, SECURITY_LIMITS
from app.guardrails import with_timeout

logger = structlog.get_logger()


class RAGService:
    """
    Mini-RAG: embeddingi + wektorowa baza danych (FAISS) + retriever
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.embedder = None
        self.index = None
        self.documents: List[Dict[str, Any]] = []
        self.is_initialized = False
        
    def initialize(self):
        """Inicjalizacja embeddingów i indeksu FAISS"""
        if self.is_initialized:
            return
            
        try:
            # Ładowanie modelu embeddingów
            from sentence_transformers import SentenceTransformer
            
            logger.info("loading_embedding_model", model=self.settings.embedding_model)
            self.embedder = SentenceTransformer(self.settings.embedding_model)
            
            # Ładowanie lub tworzenie indeksu
            index_path = Path(self.settings.faiss_index_path)
            
            if index_path.exists() and (index_path / "index.faiss").exists():
                self._load_index(index_path)
            else:
                self._build_index_from_data()
            
            self.is_initialized = True
            logger.info("rag_initialized", 
                       num_documents=len(self.documents),
                       index_size=self.index.ntotal if self.index else 0)
                       
        except Exception as e:
            logger.error("rag_init_failed", error=str(e))
            # Fallback do trybu bez RAG
            self.is_initialized = True
            self.documents = []
    
    def _load_match_data(self) -> List[Dict[str, Any]]:
        """Ładuje dane meczowe z plików Excel"""
        documents = []
        data_path = Path(self.settings.match_data_path)
        
        if not data_path.exists():
            logger.warning("match_data_path_not_found", path=str(data_path))
            return documents
        
        for excel_file in data_path.glob("*.xlsx"):
            try:
                df = pd.read_excel(excel_file)
                
                for _, row in df.iterrows():
                    # Tworzenie dokumentu z meczu
                    doc = self._row_to_document(row, excel_file.stem)
                    if doc:
                        documents.append(doc)
                        
            except Exception as e:
                logger.warning("excel_load_error", file=str(excel_file), error=str(e))
        
        logger.info("loaded_match_data", num_matches=len(documents))
        return documents
    
    def _row_to_document(self, row: pd.Series, source: str) -> Optional[Dict[str, Any]]:
        """Konwertuje wiersz z Excel do dokumentu"""
        try:
            home_team = str(row.get("HomeTeam", ""))
            away_team = str(row.get("AwayTeam", ""))
            
            if not home_team or not away_team:
                return None
            
            # Wynik
            fthg = int(row.get("FTHG", 0)) if pd.notna(row.get("FTHG")) else 0
            ftag = int(row.get("FTAG", 0)) if pd.notna(row.get("FTAG")) else 0
            hthg = int(row.get("HTHG", 0)) if pd.notna(row.get("HTHG")) else 0
            htag = int(row.get("HTAG", 0)) if pd.notna(row.get("HTAG")) else 0
            
            # Statystyki
            stats = {
                "home_shots": int(row.get("HS", 0)) if pd.notna(row.get("HS")) else 0,
                "away_shots": int(row.get("AS", 0)) if pd.notna(row.get("AS")) else 0,
                "home_shots_on_target": int(row.get("HST", 0)) if pd.notna(row.get("HST")) else 0,
                "away_shots_on_target": int(row.get("AST", 0)) if pd.notna(row.get("AST")) else 0,
                "home_corners": int(row.get("HC", 0)) if pd.notna(row.get("HC")) else 0,
                "away_corners": int(row.get("AC", 0)) if pd.notna(row.get("AC")) else 0,
                "home_fouls": int(row.get("HF", 0)) if pd.notna(row.get("HF")) else 0,
                "away_fouls": int(row.get("AF", 0)) if pd.notna(row.get("AF")) else 0,
                "home_yellow": int(row.get("HY", 0)) if pd.notna(row.get("HY")) else 0,
                "away_yellow": int(row.get("AY", 0)) if pd.notna(row.get("AY")) else 0,
                "home_red": int(row.get("HR", 0)) if pd.notna(row.get("HR")) else 0,
                "away_red": int(row.get("AR", 0)) if pd.notna(row.get("AR")) else 0,
            }
            
            # Kursy
            odds = {
                "home_win": float(row.get("B365H", 2.0)) if pd.notna(row.get("B365H")) else 2.0,
                "draw": float(row.get("B365D", 3.0)) if pd.notna(row.get("B365D")) else 3.0,
                "away_win": float(row.get("B365A", 3.0)) if pd.notna(row.get("B365A")) else 3.0,
                "over_2_5": float(row.get("B365>2.5", 1.8)) if pd.notna(row.get("B365>2.5")) else 1.8,
                "under_2_5": float(row.get("B365<2.5", 2.0)) if pd.notna(row.get("B365<2.5")) else 2.0,
            }
            
            # Tekst do embeddingu
            content = (
                f"Mecz: {home_team} vs {away_team}. "
                f"Wynik: {fthg}-{ftag}. Do przerwy: {hthg}-{htag}. "
                f"Strzały: {stats['home_shots']}-{stats['away_shots']}. "
                f"Celne: {stats['home_shots_on_target']}-{stats['away_shots_on_target']}. "
                f"Rzuty rożne: {stats['home_corners']}-{stats['away_corners']}. "
                f"Faule: {stats['home_fouls']}-{stats['away_fouls']}. "
                f"Żółte kartki: {stats['home_yellow']}-{stats['away_yellow']}. "
                f"Czerwone kartki: {stats['home_red']}-{stats['away_red']}. "
                f"Kursy: {odds['home_win']}/{odds['draw']}/{odds['away_win']}."
            )
            
            return {
                "id": f"{source}_{home_team}_{away_team}_{row.get('Date', '')}",
                "content": content,
                "home_team": home_team,
                "away_team": away_team,
                "date": str(row.get("Date", "")),
                "final_score": f"{fthg}-{ftag}",
                "half_time_score": f"{hthg}-{htag}",
                "stats": stats,
                "odds": odds,
                "source": source
            }
            
        except Exception as e:
            logger.debug("row_conversion_error", error=str(e))
            return None
    
    def _build_index_from_data(self):
        """Buduje indeks FAISS z danych meczowych"""
        import faiss
        
        self.documents = self._load_match_data()
        
        if not self.documents:
            logger.warning("no_documents_to_index")
            self.index = None
            return
        
        # Generowanie embeddingów
        texts = [doc["content"] for doc in self.documents]
        
        logger.info("generating_embeddings", num_texts=len(texts))
        embeddings = self.embedder.encode(texts, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')
        
        # Tworzenie indeksu FAISS
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine similarity po normalizacji)
        
        # Normalizacja dla cosine similarity
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        
        # Zapisywanie indeksu
        self._save_index()
    
    def _save_index(self):
        """Zapisuje indeks na dysk"""
        import faiss
        
        index_path = Path(self.settings.faiss_index_path)
        index_path.mkdir(parents=True, exist_ok=True)
        
        # Zapisz indeks FAISS
        faiss.write_index(self.index, str(index_path / "index.faiss"))
        
        # Zapisz dokumenty
        with open(index_path / "documents.json", "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)
        
        logger.info("index_saved", path=str(index_path))
    
    def _load_index(self, index_path: Path):
        """Ładuje indeks z dysku"""
        import faiss
        
        self.index = faiss.read_index(str(index_path / "index.faiss"))
        
        with open(index_path / "documents.json", "r", encoding="utf-8") as f:
            self.documents = json.load(f)
        
        logger.info("index_loaded", 
                   num_documents=len(self.documents),
                   index_size=self.index.ntotal)
    
    @with_timeout(30)
    def retrieve(
        self, 
        query: str, 
        top_k: int = 5,
        filter_team: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieval - wyszukiwanie najbardziej podobnych dokumentów.
        
        Args:
            query: Zapytanie tekstowe
            top_k: Liczba wyników do zwrócenia
            filter_team: Opcjonalnie filtruj po nazwie drużyny
            
        Returns:
            Lista dokumentów z wynikami i metadanymi
        """
        if not self.is_initialized:
            self.initialize()
        
        if not self.index or not self.documents:
            return []
        
        # Ograniczenie top_k
        top_k = min(top_k, SECURITY_LIMITS["max_context_chunks"])
        
        try:
            import faiss
            
            # Generowanie embeddingu zapytania
            query_embedding = self.embedder.encode([query])
            query_embedding = np.array(query_embedding).astype('float32')
            faiss.normalize_L2(query_embedding)
            
            # Wyszukiwanie
            # Pobierz więcej wyników jeśli filtrujemy
            search_k = top_k * 3 if filter_team else top_k
            distances, indices = self.index.search(query_embedding, search_k)
            
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.documents):
                    continue
                    
                doc = self.documents[idx].copy()
                doc["score"] = float(dist)
                doc["chunk_id"] = int(idx)
                
                # Filtrowanie po drużynie
                if filter_team:
                    if filter_team.lower() not in doc.get("home_team", "").lower() and \
                       filter_team.lower() not in doc.get("away_team", "").lower():
                        continue
                
                results.append(doc)
                
                if len(results) >= top_k:
                    break
            
            logger.info("retrieval_complete", 
                       query=query[:50], 
                       num_results=len(results))
            
            return results
            
        except Exception as e:
            logger.error("retrieval_error", error=str(e))
            return []
    
    def retrieve_with_mmr(
        self,
        query: str,
        top_k: int = 5,
        diversity: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieval z MMR (Maximal Marginal Relevance) dla większej różnorodności.
        
        Args:
            query: Zapytanie
            top_k: Liczba wyników
            diversity: Współczynnik różnorodności (0-1)
        """
        if not self.is_initialized:
            self.initialize()
            
        if not self.index or not self.documents:
            return []
        
        try:
            import faiss
            
            # Pobierz więcej kandydatów
            candidates_k = min(top_k * 4, len(self.documents))
            
            query_embedding = self.embedder.encode([query])
            query_embedding = np.array(query_embedding).astype('float32')
            faiss.normalize_L2(query_embedding)
            
            distances, indices = self.index.search(query_embedding, candidates_k)
            
            # MMR selection
            selected_indices = []
            selected_embeddings = []
            
            candidate_pool = list(zip(distances[0], indices[0]))
            
            while len(selected_indices) < top_k and candidate_pool:
                best_score = -float('inf')
                best_idx = -1
                best_pool_idx = -1
                
                for pool_idx, (dist, idx) in enumerate(candidate_pool):
                    if idx < 0 or idx >= len(self.documents):
                        continue
                    
                    # Relevance score
                    relevance = dist
                    
                    # Diversity score (maksymalna odległość od już wybranych)
                    if selected_embeddings:
                        doc_embedding = self.embedder.encode([self.documents[idx]["content"]])
                        doc_embedding = np.array(doc_embedding).astype('float32')
                        faiss.normalize_L2(doc_embedding)
                        
                        similarities = [
                            float(np.dot(doc_embedding[0], sel_emb))
                            for sel_emb in selected_embeddings
                        ]
                        max_similarity = max(similarities)
                        diversity_score = 1 - max_similarity
                    else:
                        diversity_score = 1.0
                    
                    # MMR score
                    mmr_score = diversity * relevance + (1 - diversity) * diversity_score
                    
                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_idx = idx
                        best_pool_idx = pool_idx
                
                if best_idx >= 0:
                    selected_indices.append(best_idx)
                    doc_emb = self.embedder.encode([self.documents[best_idx]["content"]])
                    doc_emb = np.array(doc_emb).astype('float32')
                    faiss.normalize_L2(doc_emb)
                    selected_embeddings.append(doc_emb[0])
                    candidate_pool.pop(best_pool_idx)
                else:
                    break
            
            results = []
            for idx in selected_indices:
                doc = self.documents[idx].copy()
                doc["chunk_id"] = int(idx)
                results.append(doc)
            
            return results
            
        except Exception as e:
            logger.error("mmr_retrieval_error", error=str(e))
            return self.retrieve(query, top_k)
    
    def pack_context(
        self, 
        hits: List[Dict[str, Any]], 
        max_length: int = 4000
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Pakuje wyniki retrieval do kontekstu dla LLM.
        
        Args:
            hits: Wyniki z retrieve()
            max_length: Maksymalna długość kontekstu
            
        Returns:
            (context_string, metadata)
        """
        context_parts = []
        total_length = 0
        used_ids = []
        
        for hit in hits:
            chunk = f"[Źródło: {hit.get('source', 'unknown')}, ID: {hit.get('chunk_id', 'N/A')}]\n"
            chunk += hit.get("content", "")
            
            if total_length + len(chunk) > max_length:
                break
            
            context_parts.append(chunk)
            total_length += len(chunk)
            used_ids.append(hit.get("chunk_id"))
        
        context = "\n\n".join(context_parts)
        
        metadata = {
            "retrieved_ids": used_ids,
            "num_chunks": len(context_parts),
            "context_length": total_length
        }
        
        return context, metadata
    
    def get_team_historical_stats(self, team_name: str) -> Dict[str, Any]:
        """Pobiera zagregowane statystyki drużyny"""
        if not self.is_initialized:
            self.initialize()
        
        home_matches = [d for d in self.documents if team_name.lower() in d.get("home_team", "").lower()]
        away_matches = [d for d in self.documents if team_name.lower() in d.get("away_team", "").lower()]
        
        total_matches = len(home_matches) + len(away_matches)
        
        if total_matches == 0:
            return {"error": f"Nie znaleziono meczów dla drużyny {team_name}"}
        
        # Agregacja statystyk
        total_goals_scored = 0
        total_goals_conceded = 0
        wins = 0
        draws = 0
        losses = 0
        
        for match in home_matches:
            score = match.get("final_score", "0-0").split("-")
            home_goals = int(score[0])
            away_goals = int(score[1])
            total_goals_scored += home_goals
            total_goals_conceded += away_goals
            if home_goals > away_goals:
                wins += 1
            elif home_goals == away_goals:
                draws += 1
            else:
                losses += 1
        
        for match in away_matches:
            score = match.get("final_score", "0-0").split("-")
            home_goals = int(score[0])
            away_goals = int(score[1])
            total_goals_scored += away_goals
            total_goals_conceded += home_goals
            if away_goals > home_goals:
                wins += 1
            elif home_goals == away_goals:
                draws += 1
            else:
                losses += 1
        
        return {
            "team": team_name,
            "total_matches": total_matches,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_scored": total_goals_scored,
            "goals_conceded": total_goals_conceded,
            "avg_goals_scored": round(total_goals_scored / total_matches, 2),
            "avg_goals_conceded": round(total_goals_conceded / total_matches, 2),
            "win_rate": round(wins / total_matches * 100, 1)
        }


# Singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Zwraca singleton RAG service"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
