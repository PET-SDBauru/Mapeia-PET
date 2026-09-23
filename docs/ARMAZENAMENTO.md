# Armazenamento de imagens e documentos

Este documento descreve o pacote `storage/`, que o Mapeia PET usa para guardar as evidências (fotos, prints do e-SUS e PDFs) enviadas na aba **📁 Banco de Documentos**. Ele resolve a [issue #2](https://github.com/PET-SDBauru/Mapeia-PET/issues/2).

## Visão geral

```
app.py ──► storage.upload() ──► validate_upload()   (tamanho, extensão, assinatura dos bytes)
                 │
                 ▼
          StorageBackend  (interface em storage/base.py)
           ├── LocalBackend     bytes em data/uploads/   · metadados em SQLite
           └── FirebaseBackend  bytes no Cloud Storage   · metadados no Firestore
```

- **Bytes** e **metadados** ficam separados: o arquivo vai para um "blob store" e as informações dele (UBS, categoria, descrição, data...) vão para um índice que pode ser consultado.
- `create_storage()` escolhe o backend: usa o **Firebase** se houver credenciais e o **Local** caso contrário (ou se o Firebase falhar ao iniciar).
- O `app.py` só conhece a interface `StorageBackend`, então trocar de backend não exige mudar a tela.

| Arquivo | Responsabilidade |
|---|---|
| `storage/base.py` | `StoredFile` (metadados), `StorageBackend` (interface), geração de caminhos únicos |
| `storage/validation.py` | Validação de upload e tipos permitidos |
| `storage/local_backend.py` | Backend em disco e SQLite |
| `storage/firebase_backend.py` | Backend com Firebase Storage e Firestore |
| `storage/__init__.py` | `create_storage()` e `upload()`, o ponto de entrada |
| `tests/test_storage.py` | Testes (backend local e validação) |

### Onde os arquivos ficam

```
unidades_saude/<id_da_ubs>/<uuid>_<nome_original_sanitizado>
```

O UUID impede que dois uploads com o mesmo nome se sobrescrevam, o que acontecia na versão anterior.

### Metadados (`StoredFile`)

| Campo | Exemplo |
|---|---|
| `id` | `3f2c...` (UUID hex) |
| `unidade_id` / `unidade_nome` | `esf_jardim_nilce__agudos_` / `ESF Jardim Nilce (Agudos)` |
| `file_name`, `content_type`, `size` | `fichas.jpg`, `image/jpeg`, `845120` |
| `category` | `FOTO_EQUIPAMENTO`, `PRONTUARIO_EVIDENCIA`, `RELATORIO_TECNICO`, `PRINT_ESUS`, `OUTRO` |
| `description`, `uploaded_by`, `uploaded_at` | texto livre, usuário, data ISO-8601 (UTC) |
| `storage_path`, `backend` | caminho interno, `local` ou `firebase` |

## Configuração

### Modo local (padrão, sem configurar nada)

Os arquivos ficam em `data/uploads/`, que está no `.gitignore`.

> ⚠️ No **Streamlit Community Cloud** o disco é apagado quando o app reinicia. Lá, use o Firebase.

### Firebase (produção)

1. No [Firebase Console](https://console.firebase.google.com/), ative o **Storage** e o **Firestore**.
2. Em *Configurações do projeto → Contas de serviço*, clique em **Gerar nova chave privada** para baixar o JSON.
3. Copie `.streamlit/secrets.toml.example` para `.streamlit/secrets.toml` e preencha com o bucket e os campos do JSON. No Streamlit Cloud, cole o mesmo conteúdo em *Settings → Secrets*.
   - Alternativa: defina `GOOGLE_APPLICATION_CREDENTIALS=/caminho/chave.json` e `FIREBASE_STORAGE_BUCKET=...` como variáveis de ambiente.
4. A barra lateral do app deve mostrar **🟢 Firebase Storage ativo**.

O Firestore usa a coleção `arquivos_ubs`, com o documento `<id>` igual a `StoredFile.to_dict()`.

**Privacidade (LGPD):** os arquivos **não** são públicos. A versão anterior usava `blob.make_public()`, o que deixava fotos de prontuário acessíveis a qualquer pessoa com o link. Agora o app lê os bytes pelo servidor (`read()`), e `url()` gera um link assinado que vale por 30 minutos. Como o Admin SDK ignora as regras de segurança, você pode bloquear todo acesso direto de clientes:

```
// Storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o { match /{allPaths=**} { allow read, write: if false; } }
}
```

## Uso no código

```python
from storage import create_storage, upload, UploadError

store = create_storage(service_account, bucket_name)   # ou create_storage() para modo local

try:
    meta = upload(store, dados_bytes, "foto.jpg",
                  unidade_id="ubs_x", unidade_nome="UBS X",
                  category="FOTO_EQUIPAMENTO", description="...")
except UploadError as e:
    print(e)   # mensagem amigável para o usuário

store.list("ubs_x")     # -> list[StoredFile], mais recentes primeiro
store.read(meta.id)     # -> bytes
store.url(meta.id)      # -> link temporário (Firebase) ou None (local)
store.delete(meta.id)
```

## Como estender

### Aceitar um novo formato

Adicione uma entrada em `ALLOWED_TYPES` (`storage/validation.py`) com a extensão, o MIME e os bytes iniciais do formato. Depois inclua a extensão no `type=[...]` do `st.file_uploader` em `app.py`.

```python
".webp": ("image/webp", b"RIFF"),
```

### Criar um novo backend (S3, Supabase, MinIO, Google Drive...)

1. Crie `storage/meu_backend.py` com uma classe que herda de `StorageBackend` e implementa `save`, `list`, `get`, `read` e `delete`. `url` é opcional.
2. Em `save`, grave `meta.backend = self.name` e use `meta.storage_path` como chave do objeto.
3. Instancie a classe em `create_storage()` (`storage/__init__.py`).
4. Copie os testes de `LocalStorageTest` e troque o backend para validar o seu.

### Enviar imagens para a IA (Qwen-VL)

O Qwen usado hoje (`qwen-2.5-72b-instruct`) só lê texto. Para que a IA também analise as fotos, dá para usar um modelo multimodal (por exemplo `qwen/qwen2.5-vl-72b-instruct` no OpenRouter, ou o Qwen2.5-VL local via Ollama) e anexar as imagens:

```python
import base64
imagens = [f for f in store.list(unidade_id) if f.is_image]
conteudo = [{"type": "text", "text": prompt}] + [
    {"type": "image_url",
     "image_url": {"url": f"data:{f.content_type};base64,{base64.b64encode(store.read(f.id)).decode()}"}}
    for f in imagens[:4]   # limite para não estourar o contexto
]
```

## Testes

```bash
python -m unittest discover tests
```

Os testes cobrem o backend local e a validação. O backend Firebase precisa de um projeto real ou do [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) para ser testado.
