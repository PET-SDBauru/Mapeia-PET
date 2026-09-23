# -*- coding: utf-8 -*-
"""
Contrato comum de armazenamento do Mapeia PET.

Todo backend (local, Firebase, e futuramente S3, Supabase, MinIO...) implementa
`StorageBackend`. O resto do app só conhece esta interface, então trocar o
destino dos arquivos é questão de trocar o objeto criado em `create_storage()`.

Separação adotada:
    - bytes do arquivo  -> "blob store" (disco local ou bucket na nuvem)
    - metadados         -> índice consultável (SQLite local ou Firestore)
"""

from __future__ import annotations

import re
import uuid
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

# Categorias já usadas na interface do app (app.py e DocumentManager.tsx).
CATEGORIES = (
    "FOTO_EQUIPAMENTO",
    "PRONTUARIO_EVIDENCIA",
    "RELATORIO_TECNICO",
    "PRINT_ESUS",
    "OUTRO",
)


@dataclass
class StoredFile:
    """Metadados de um arquivo armazenado. É o que é salvo no índice."""

    id: str
    unidade_id: str          # id canônico da UBS (ex: "esf_jardim_nilce__agudos_")
    unidade_nome: str        # nome legível da UBS
    file_name: str           # nome original enviado pelo usuário
    content_type: str        # MIME detectado/validado
    size: int                # bytes
    category: str
    description: str = ""
    uploaded_by: str = ""
    storage_path: str = ""   # caminho interno no backend (não expor ao usuário)
    backend: str = ""        # "local", "firebase", ...
    uploaded_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def is_image(self) -> bool:
        return self.content_type.startswith("image/")

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "StoredFile":
        # Ignora campos desconhecidos para tolerar documentos antigos/novos no índice.
        known = {k: data[k] for k in cls.__dataclass_fields__ if k in data}
        return cls(**known)


def new_file_id() -> str:
    return uuid.uuid4().hex


def safe_name(file_name: str) -> str:
    """Remove caracteres problemáticos para caminhos (acentos viram '_')."""
    return re.sub(r"[^\w.\-]", "_", file_name, flags=re.ASCII)[:120] or "arquivo"


def build_storage_path(unidade_id: str, file_id: str, file_name: str) -> str:
    """
    Caminho único do arquivo no backend: unidades_saude/<ubs>/<id>_<nome>.
    O id evita que dois uploads com o mesmo nome se sobrescrevam.
    """
    return f"unidades_saude/{safe_name(unidade_id)}/{file_id}_{safe_name(file_name)}"


class StorageBackend(ABC):
    """Interface que todo backend de armazenamento deve implementar."""

    #: identificador curto gravado em StoredFile.backend
    name: str = "abstract"

    @abstractmethod
    def save(self, data: bytes, meta: StoredFile) -> StoredFile:
        """Grava os bytes e os metadados. Retorna o StoredFile persistido."""

    @abstractmethod
    def list(self, unidade_id: str | None = None) -> list[StoredFile]:
        """Lista arquivos (todos ou de uma UBS), mais recentes primeiro."""

    @abstractmethod
    def get(self, file_id: str) -> StoredFile | None:
        """Retorna os metadados de um arquivo ou None."""

    @abstractmethod
    def read(self, file_id: str) -> bytes:
        """
        Retorna o conteúdo do arquivo. Útil para exibir imagens no Streamlit
        e para enviar imagens a um modelo multimodal (ex: Qwen-VL) no futuro.
        """

    @abstractmethod
    def delete(self, file_id: str) -> None:
        """Remove bytes e metadados. Não falha se o arquivo não existir."""

    def url(self, file_id: str) -> str | None:
        """
        Link temporário para download, quando o backend suporta.
        Padrão: None (o app usa read() + st.download_button).
        """
        return None
