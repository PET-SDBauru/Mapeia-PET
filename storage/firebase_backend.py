# -*- coding: utf-8 -*-
"""
Backend Firebase: bytes no Cloud Storage + metadados no Firestore (issue #2).

    Storage   : gs://<bucket>/unidades_saude/<ubs>/<id>_<nome>
    Firestore : coleção "arquivos_ubs", documento <id> = StoredFile.to_dict()

Privacidade (LGPD): os arquivos NÃO são tornados públicos. Evidências de
unidades de saúde podem conter dados pessoais; o acesso é feito por
URL assinada com validade curta (url()) ou lendo os bytes pelo servidor (read()).
"""

from __future__ import annotations

from datetime import timedelta

from .base import StorageBackend, StoredFile

COLLECTION = "arquivos_ubs"
SIGNED_URL_TTL = timedelta(minutes=30)


class FirebaseBackend(StorageBackend):
    name = "firebase"

    def __init__(self, service_account: dict, bucket_name: str, app_name: str = "mapeia-pet"):
        """
        service_account: JSON da conta de serviço (Firebase Console >
            Configurações do projeto > Contas de serviço > Gerar nova chave).
        bucket_name: ex. "meu-projeto.appspot.com" ou "meu-projeto.firebasestorage.app".
        """
        # Import tardio: o app funciona sem firebase-admin instalado (modo local).
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        try:
            app = firebase_admin.get_app(app_name)
        except ValueError:  # ainda não inicializado (Streamlit re-executa o script)
            app = firebase_admin.initialize_app(
                credentials.Certificate(service_account),
                {"storageBucket": bucket_name},
                name=app_name,
            )
        self._bucket = storage.bucket(app=app)
        self._col = firestore.client(app=app).collection(COLLECTION)

    def save(self, data: bytes, meta: StoredFile) -> StoredFile:
        meta.backend = self.name
        blob = self._bucket.blob(meta.storage_path)
        blob.upload_from_string(data, content_type=meta.content_type)
        try:
            self._col.document(meta.id).set(meta.to_dict())
        except Exception:
            blob.delete()  # desfaz o upload para não deixar arquivo sem índice
            raise
        return meta

    def list(self, unidade_id: str | None = None) -> list[StoredFile]:
        q = self._col
        if unidade_id:
            q = q.where("unidade_id", "==", unidade_id)
        docs = [StoredFile.from_dict(d.to_dict()) for d in q.stream()]
        # Ordena em memória para não exigir índice composto no Firestore.
        return sorted(docs, key=lambda f: f.uploaded_at, reverse=True)

    def get(self, file_id: str) -> StoredFile | None:
        snap = self._col.document(file_id).get()
        return StoredFile.from_dict(snap.to_dict()) if snap.exists else None

    def read(self, file_id: str) -> bytes:
        meta = self.get(file_id)
        if meta is None:
            raise FileNotFoundError(file_id)
        return self._bucket.blob(meta.storage_path).download_as_bytes()

    def delete(self, file_id: str) -> None:
        meta = self.get(file_id)
        if meta is None:
            return
        blob = self._bucket.blob(meta.storage_path)
        if blob.exists():
            blob.delete()
        self._col.document(file_id).delete()

    def url(self, file_id: str) -> str | None:
        meta = self.get(file_id)
        if meta is None:
            return None
        return self._bucket.blob(meta.storage_path).generate_signed_url(
            expiration=SIGNED_URL_TTL, version="v4"
        )
