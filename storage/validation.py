# -*- coding: utf-8 -*-
"""
Validação de uploads antes de gravar qualquer coisa.

Não confiamos na extensão nem no MIME enviado pelo navegador: o tipo real é
detectado pelos primeiros bytes do arquivo ("magic numbers"). Assim um .exe
renomeado para .jpg é rejeitado.

Para aceitar um novo formato, basta adicionar uma entrada em ALLOWED_TYPES.
"""

from __future__ import annotations

import os

MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB (mesmo limite padrão do Streamlit)

# extensão -> (MIME, assinatura dos primeiros bytes)
ALLOWED_TYPES: dict[str, tuple[str, bytes]] = {
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".pdf": ("application/pdf", b"%PDF-"),
}


class UploadError(ValueError):
    """Upload inválido. A mensagem é segura para mostrar ao usuário."""


def validate_upload(data: bytes, file_name: str) -> str:
    """
    Valida tamanho, extensão e conteúdo. Retorna o MIME type confiável.
    Lança UploadError com mensagem amigável em caso de problema.
    """
    if not data:
        raise UploadError("O arquivo está vazio.")

    if len(data) > MAX_FILE_SIZE_BYTES:
        mb = len(data) / (1024 * 1024)
        raise UploadError(f"Arquivo com {mb:.1f} MB ultrapassa o limite de 200 MB.")

    ext = os.path.splitext(file_name)[1].lower()
    if ext not in ALLOWED_TYPES:
        aceitos = ", ".join(sorted(ALLOWED_TYPES))
        raise UploadError(f"Formato '{ext or '?'}' não permitido. Aceitos: {aceitos}.")

    mime, signature = ALLOWED_TYPES[ext]
    if not data.startswith(signature):
        raise UploadError(
            f"O conteúdo de '{file_name}' não corresponde a um arquivo {ext}. "
            "Ele pode estar corrompido ou com a extensão trocada."
        )
    return mime
