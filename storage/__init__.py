# -*- coding: utf-8 -*-
"""
Pacote de armazenamento de imagens e documentos do Mapeia PET.

Uso típico (ver app.py):

    from storage import create_storage, upload

    store = create_storage(service_account=..., bucket_name=...)
    meta = upload(store, data, "foto.jpg", unidade_id="ubs_x", unidade_nome="UBS X",
                  category="FOTO_EQUIPAMENTO")
    store.list("ubs_x")

Detalhes e guia para novos backends: docs/ARMAZENAMENTO.md
"""

from __future__ import annotations

import logging

from .base import CATEGORIES, StorageBackend, StoredFile, build_storage_path, new_file_id
from .local_backend import LocalBackend
from .validation import MAX_FILE_SIZE_BYTES, UploadError, validate_upload

__all__ = [
    "CATEGORIES",
    "MAX_FILE_SIZE_BYTES",
    "LocalBackend",
    "StorageBackend",
    "StoredFile",
    "UploadError",
    "create_storage",
    "upload",
]

log = logging.getLogger(__name__)


def create_storage(
    service_account: dict | None = None,
    bucket_name: str | None = None,
    local_root: str = "data/uploads",
) -> StorageBackend:
    """
    Escolhe o backend:
      - Firebase, se houver conta de serviço e bucket configurados;
      - Local (disco + SQLite), caso contrário ou se o Firebase falhar.
    """
    if service_account and bucket_name:
        try:
            from .firebase_backend import FirebaseBackend

            return FirebaseBackend(service_account, bucket_name)
        except Exception as e:  # dependência ausente, credencial inválida...
            log.warning("Firebase indisponível, usando armazenamento local: %s", e)
    return LocalBackend(local_root)


def upload(
    store: StorageBackend,
    data: bytes,
    file_name: str,
    *,
    unidade_id: str,
    unidade_nome: str,
    category: str = "OUTRO",
    description: str = "",
    uploaded_by: str = "",
) -> StoredFile:
    """
    Valida e grava um arquivo. Ponto único de entrada para uploads, para que
    todo backend receba dados já validados e com caminho único.
    Lança UploadError se o arquivo for inválido.
    """
    content_type = validate_upload(data, file_name)
    if category not in CATEGORIES:
        raise UploadError(f"Categoria inválida: {category}")

    file_id = new_file_id()
    meta = StoredFile(
        id=file_id,
        unidade_id=unidade_id,
        unidade_nome=unidade_nome,
        file_name=file_name,
        content_type=content_type,
        size=len(data),
        category=category,
        description=description,
        uploaded_by=uploaded_by,
        storage_path=build_storage_path(unidade_id, file_id, file_name),
    )
    return store.save(data, meta)
