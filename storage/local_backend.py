# -*- coding: utf-8 -*-
"""
Backend local: arquivos no disco + índice de metadados em SQLite (stdlib).

Uso recomendado: desenvolvimento, testes e instalação on-premise (ex: servidor
da secretaria de saúde rodando o Qwen localmente).

ATENÇÃO: no Streamlit Community Cloud o disco é efêmero — tudo é apagado
quando o app reinicia. Em produção na nuvem, use o FirebaseBackend.

Estrutura no disco:
    <root>/index.sqlite3
    <root>/unidades_saude/<ubs>/<id>_<nome>
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .base import StorageBackend, StoredFile


class LocalBackend(StorageBackend):
    name = "local"

    def __init__(self, root: str | Path = "data/uploads"):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self._db_path = self.root / "index.sqlite3"
        with self._connect() as conn:
            # Metadados guardados como JSON: novos campos em StoredFile não
            # exigem migração de schema. unidade_id/uploaded_at viram colunas
            # para permitir filtro e ordenação.
            conn.execute(
                """CREATE TABLE IF NOT EXISTS files (
                       id TEXT PRIMARY KEY,
                       unidade_id TEXT NOT NULL,
                       uploaded_at TEXT NOT NULL,
                       meta TEXT NOT NULL
                   )"""
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_unidade ON files(unidade_id)")

    @contextmanager
    def _connect(self):
        """
        Uma conexão por operação (seguro com as threads do Streamlit).
        Obs: `with sqlite3.connect()` sozinho só faz commit, NÃO fecha a
        conexão — no Windows isso mantém o arquivo travado.
        """
        conn = sqlite3.connect(self._db_path)
        try:
            with conn:  # commit ou rollback
                yield conn
        finally:
            conn.close()

    def _abs_path(self, storage_path: str) -> Path:
        path = (self.root / storage_path).resolve()
        # Defesa contra path traversal ("../../etc/passwd").
        if not path.is_relative_to(self.root):
            raise ValueError(f"Caminho fora do diretório de armazenamento: {storage_path}")
        return path

    def save(self, data: bytes, meta: StoredFile) -> StoredFile:
        meta.backend = self.name
        path = self._abs_path(meta.storage_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO files (id, unidade_id, uploaded_at, meta) VALUES (?, ?, ?, ?)",
                    (meta.id, meta.unidade_id, meta.uploaded_at, json.dumps(meta.to_dict())),
                )
        except Exception:
            path.unlink(missing_ok=True)  # não deixa arquivo órfão no disco
            raise
        return meta

    def list(self, unidade_id: str | None = None) -> list[StoredFile]:
        sql = "SELECT meta FROM files"
        params: tuple = ()
        if unidade_id:
            sql += " WHERE unidade_id = ?"
            params = (unidade_id,)
        sql += " ORDER BY uploaded_at DESC"
        with self._connect() as conn:
            return [StoredFile.from_dict(json.loads(r[0])) for r in conn.execute(sql, params)]

    def get(self, file_id: str) -> StoredFile | None:
        with self._connect() as conn:
            row = conn.execute("SELECT meta FROM files WHERE id = ?", (file_id,)).fetchone()
        return StoredFile.from_dict(json.loads(row[0])) if row else None

    def read(self, file_id: str) -> bytes:
        meta = self.get(file_id)
        if meta is None:
            raise FileNotFoundError(file_id)
        return self._abs_path(meta.storage_path).read_bytes()

    def delete(self, file_id: str) -> None:
        meta = self.get(file_id)
        if meta is None:
            return
        self._abs_path(meta.storage_path).unlink(missing_ok=True)
        with self._connect() as conn:
            conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
