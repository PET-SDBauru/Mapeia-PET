# -*- coding: utf-8 -*-
"""
Mapeia PET - Saúde Digital
Aplicativo para análise inteligente do fluxo e estresse digital nas UBSs.
Versão com Firebase Storage (200MB), respostas abertas e prompt Qwen estruturado.
"""

import streamlit as st
import pandas as pd
import folium
from streamlit_folium import st_folium
import requests
import os
import json
import re

# Firebase Admin SDK (opcional — ativado apenas se as credenciais estiverem configuradas)
try:
    import firebase_admin
    from firebase_admin import credentials, storage as fb_storage
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False

# ==========================================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================================
st.set_page_config(
    page_title="Mapeia PET",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Constantes
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "uploaded_files" not in st.session_state:
    st.session_state.uploaded_files = []
if "qualitative_notes" not in st.session_state:
    st.session_state.qualitative_notes = ""
if "gestao_notes" not in st.session_state:
    st.session_state.gestao_notes = ""
if "ai_report" not in st.session_state:
    st.session_state.ai_report = ""

# ==========================================================
# 2. ESTILIZAÇÃO CSS
# ==========================================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
    .stApp { font-family: 'Montserrat', sans-serif; }
    .main-title { font-size: 2.2rem; font-weight: 700; color: #002B49; margin-bottom: 0.3rem; }
    .subtitle { font-size: 1rem; color: #00B259; margin-bottom: 1.5rem; font-weight: 600; }
    .sidebar-title { font-weight: bold; color: #002B49; }
    .report-box {
        background: #f8faff;
        border: 1.5px solid #0052cc22;
        border-radius: 10px;
        padding: 1.2rem 1.5rem;
        margin-top: 1rem;
        font-size: 0.92rem;
        line-height: 1.65;
        color: #1a2540;
    }
    .upload-success {
        background: #e6f7ef;
        border: 1.5px solid #00B25955;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-weight: 600;
        color: #007a3d;
        margin-top: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================================
# 3. INICIALIZAÇÃO DO FIREBASE ADMIN (STORAGE)
# ==========================================================
def _init_firebase_storage():
    """
    Inicializa o Firebase Admin SDK usando credenciais armazenadas em
    st.secrets['FIREBASE_SERVICE_ACCOUNT'] (JSON inline) ou no arquivo
    .streamlit/secrets.toml.
    Retorna o bucket do Storage ou None em modo offline.
    """
    if not FIREBASE_ADMIN_AVAILABLE:
        return None

    if not firebase_admin._apps:
        try:
            # Tenta carregar credencial de st.secrets (Streamlit Cloud / AI Studio)
            if "FIREBASE_SERVICE_ACCOUNT" in st.secrets:
                sa_info = dict(st.secrets["FIREBASE_SERVICE_ACCOUNT"])
                cred = credentials.Certificate(sa_info)
            # Tenta variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                cred = credentials.ApplicationDefault()
            else:
                return None  # Nenhuma credencial disponível → modo offline

            storage_bucket = st.secrets.get("FIREBASE_STORAGE_BUCKET", os.getenv("FIREBASE_STORAGE_BUCKET", ""))
            firebase_admin.initialize_app(cred, {"storageBucket": storage_bucket})
        except Exception as e:
            st.sidebar.caption(f"⚠️ Firebase offline: {e}")
            return None

    try:
        bucket = fb_storage.bucket()
        return bucket
    except Exception:
        return None

firebase_bucket = _init_firebase_storage()

# ==========================================================
# 4. DADOS DE CIDADES E UBSs (COORDENADAS APROXIMADAS)
# ==========================================================
dados_regioes = {
    "Bariri": {
        "centro": [-22.0744, -48.7403],
        "ubs": {
            "UBS Dr. Alceu de Carvalho - Centro": {"lat": -22.0735, "lon": -48.7460},
            "UBS Soma - Jardim Nova Bariri": {"lat": -22.0812, "lon": -48.7335},
            "UBS Dr. Domingos de Léo - Vila Maria": {"lat": -22.0625, "lon": -48.7490},
            "ESF I - Nova Bariri": {"lat": -22.0805, "lon": -48.7340},
            "ESF II - Paulo de Tarso Mazzo": {"lat": -22.0640, "lon": -48.7485},
            "ESF III - Dr. Renato Figueiredo": {"lat": -22.0700, "lon": -48.7500},
            "ESF IV - Dr. Francisco Leoni Neto": {"lat": -22.0650, "lon": -48.7300},
            "ESF V - Livramento": {"lat": -22.0800, "lon": -48.7550},
        }
    },
    "Agudos": {
        "centro": [-22.4694, -48.9863],
        "ubs": {
            "UBS Central - Centro de Saúde Dr. Domingos Bôscolo (Agudos)": {"lat": -22.4687, "lon": -48.9858},
            "ESF Prof. Severino Calazans (Agudos)": {"lat": -22.4782, "lon": -48.9815},
            "ESF Jardim Nilce (Agudos)": {"lat": -22.4745, "lon": -48.9790},
            "ESF Parque das Vinhas (Agudos)": {"lat": -22.4610, "lon": -48.9920},
            "ESF Vila Vigato - Pref. Waldomiro Fantini (Agudos)": {"lat": -22.4635, "lon": -48.9772},
            "ESF Santa Cecília (Agudos)": {"lat": -22.4720, "lon": -48.9940},
            "ESF Pampulha / Jardim Europa (Agudos)": {"lat": -22.4758, "lon": -48.9895},
            "ESF Prof. Thyrso Dalla Déa (Agudos)": {"lat": -22.4590, "lon": -48.9810},
            "ESF Jardim Danúbio (Agudos)": {"lat": -22.4665, "lon": -48.9965},
            "ESF Distrito de Domélia (Agudos)": {"lat": -22.6881, "lon": -49.1245},
            "ESF Distrito de Rubião / Santo Antônio (Agudos)": {"lat": -22.5200, "lon": -48.9100},
            "UPA 24h / Pronto Atendimento Municipal (Agudos)": {"lat": -22.4705, "lon": -48.9830},
        }
    },
    "Boraceia": {
        "centro": [-22.1950, -48.7788],
        "ubs": {
            "Centro de Saúde Dr. José Maria - Centro (Boraceia)": {"lat": -22.1940, "lon": -48.7790},
            "ESF Boraceia I - Nova Boraceia": {"lat": -22.1970, "lon": -48.7750},
            "ESF Boraceia II - Pouso Alegre": {"lat": -22.1915, "lon": -48.7830},
            "Posto de Saúde Rural - Boraceia": {"lat": -22.2050, "lon": -48.7680},
        }
    }
}

# ==========================================================
# 5. ESTRUTURA DO QUESTIONÁRIO PET-SAÚDE DIGITAL (Q3–Q20)
# ==========================================================
questionario = {
    "Q3. Qual o seu cargo atual na UBS?": [
        "Agente Comunitário de Saúde (ACS)", "Agente administrativo", "Auxiliar administrativo",
        "Auxiliar de enfermagem", "Cirurgião-Dentista / Auxiliar Bucal", "Enfermeiro",
        "Gerente / Coordenador da Unidade", "Médico (Clínico / Família)", "Recepcionista",
        "Técnico de enfermagem", "Outro"
    ],
    "Q4. Ferramentas e registros utilizados?": [
        "Prontuário Eletrônico (e-SUS APS)", "Sistema próprio da Prefeitura (SIS)",
        "Prontuário Físico (Ficha em Papel)", "Caderno de Anotações / Triagem Manual",
        "WhatsApp Pessoal / Aplicativo de Mensagem", "Planilhas Internas (Excel / Google)"
    ],
    "Q5. Existe protocolo formal de alimentação do sistema?": [
        "Sim, protocolo rígido e formalizado", "Compartilhado / flexível entre a equipe",
        "Não existe formalmente (cada um faz de um jeito)", "Outro"
    ],
    "Q6. Localização geográfica cria barreiras de acesso?": [
        "Sim, dificulta bastante (distância / relevo / transporte)",
        "Parcialmente (dificulta apenas para alguns bairros)",
        "Não, localização central e de fácil acesso"
    ],
    "Q7. Faixa etária predominante dos usuários?": [
        "Crianças / Pediatria", "Jovens / Adultos (20 a 59 anos)",
        "Idosos (>60 anos / Doenças Crônicas)", "Distribuição mista e homogênea"
    ],
    "Q8. Perfil socioeconômico predominante?": [
        "Classe A / B (Média-Alta)", "Classe C (Média)",
        "Classe D / E (Baixa renda / Vulnerabilidade)",
        "Extrema Vulnerabilidade Social", "Perfil misto"
    ],
    "Q9. Frequência de atualização do e-SUS APS?": [
        "Imediatamente durante/após a consulta",
        "Em blocos (ao final do turno/dia)",
        "Semanalmente ou acumulado em lote"
    ],
    "Q10. Há necessidade de duplicar a informação?": [
        "Sim, frequentemente (rotina diária)",
        "Às vezes (apenas para certos procedimentos)",
        "Não, registro único direto no sistema"
    ],
    "Q11. Frequência de registrar a mesma informação mais de uma vez?": [
        "Sempre (em todos os atendimentos)", "Frequentemente (várias vezes ao dia)",
        "Às vezes", "Raramente", "Nunca"
    ],
    "Q12. Onde a informação é replicada?": [
        "e-SUS APS + Ficha Física em Papel", "e-SUS APS + Caderno de Triagem / Ata",
        "e-SUS APS + Planilhas Internas de Controle", "Dois sistemas digitais diferentes",
        "Não se aplica (registro único)"
    ],
    "Q13. Preenchimento clínico segue padrão rígido?": [
        "Sim, rigidamente padronizado", "Básico com grande variação entre profissionais",
        "Não há nenhuma padronização formal"
    ],
    "Q14. Equipe possui materiais de apoio em dúvidas operacionais?": [
        "Sim, manuais claros e atualizados", "Manuais confusos ou desatualizados",
        "Não há materiais de apoio disponíveis"
    ],
    "Q15. Política de login para acesso aos computadores?": [
        "Login individual com senha pessoal",
        "Login compartilhado por sala / consultório",
        "Login geral único para toda a unidade"
    ],
    "Q16. Há uso de dispositivos pessoais para fins de trabalho?": [
        "Sim (por falha/falta de equipamento corporativo)",
        "Sim (por conveniência e agilidade com ACS/WhatsApp)",
        "Não (utilizamos apenas recursos corporativos)"
    ],
    "Q17. Nota de 1 a 5: prontuário eletrônico melhora a qualidade do cuidado?": [
        "Nota 1 (Muito Ruim / Prejudica)", "Nota 2 (Ruim)",
        "Nota 3 (Regular / Neutro)", "Nota 4 (Bom / Ajuda)",
        "Nota 5 (Excelente / Indispensável)"
    ],
    "Q18. Principais benefícios práticos percebidos?": [
        "Rapidez para localizar históricos de consultas",
        "Maior segurança e legibilidade nas receitas",
        "Agilidade clínica no atendimento",
        "Melhor coordenação do cuidado com ACS",
        "Nenhum benefício percebido"
    ],
    "Q19. Tempo médio de preenchimento pós-consulta?": [
        "Menos de 2 minutos", "2 a 5 minutos", "6 a 10 minutos", "Mais de 10 minutos"
    ],
    "Q20. Lentidão / travamento atrasa a agenda com qual frequência?": [
        "Diariamente (todos os dias)", "Várias vezes na semana", "Raramente", "Nunca"
    ]
}

# ==========================================================
# 6. FUNÇÕES AUXILIARES
# ==========================================================

def upload_to_firebase_storage(file_bytes: bytes, file_name: str, unidade_id: str,
                                 content_type: str) -> str | None:
    """
    Realiza upload para o Firebase Storage Admin SDK.
    Retorna a URL pública assinada ou None se não for possível.
    """
    if firebase_bucket is None:
        return None
    try:
        safe_name = re.sub(r"[^\w.\-]", "_", file_name)
        blob_path = f"unidades_saude/{unidade_id}/{safe_name}"
        blob = firebase_bucket.blob(blob_path)
        blob.upload_from_string(file_bytes, content_type=content_type)
        blob.make_public()
        return blob.public_url
    except Exception as e:
        st.warning(f"⚠️ Upload Firebase falhou, arquivo salvo apenas localmente: {e}")
        return None


def build_qwen_prompt(ubs_name: str, dados_quant: dict, notas_campo: str,
                       diretrizes_gestao: str, mode: str = "qualitativo") -> str:
    """
    Constrói o template rigoroso de Engenharia de Prompt para o Qwen / OpenRouter.
    Inclui dados quantitativos E respostas abertas qualitativas.
    """
    if mode == "quantitativo":
        dados_str = ""
        for pergunta, opcoes in dados_quant.items():
            tem_resposta = any(v > 0 for v in opcoes.values())
            if tem_resposta:
                dados_str += f"\n**{pergunta}**\n"
                for opcao, qtd in opcoes.items():
                    if qtd > 0:
                        dados_str += f"  - {opcao}: {qtd} resposta(s)\n"
        if not dados_str.strip():
            dados_str = "(Nenhum dado quantitativo preenchido)"

        dados_section = f"""
MODALIDADE: Análise Quantitativa (Questionário PET-Saúde Digital — Q3 a Q20)
COMPILAÇÃO DE RESPOSTAS:
{dados_str}
"""
    else:
        dados_section = """
MODALIDADE: Análise Qualitativa Executiva
(Os dados estruturados da UBS estão descritos nas seções de observações abaixo.)
"""

    notas_section = f"""
OBSERVAÇÕES QUALITATIVAS E RELATO DE CAMPO DO PESQUISADOR:
"{notas_campo if notas_campo.strip() else 'Não informado.'}"

DIRETRIZES E PRIORIDADES DA GESTÃO LOCAL:
"{diretrizes_gestao if diretrizes_gestao.strip() else 'Não informado.'}"
"""

    prompt = f"""Você é um consultor especialista do PET-Saúde Digital e especialista em Governança de TI no SUS. \
Analise os dados do formulário fornecidos e gere um relatório técnico completo e aprofundado \
contendo OBRIGATORIAMENTE a seguinte estrutura:

---
### 1. DIAGNÓSTICO DE ESTRESSE DIGITAL E GARGALOS OPERACIONAIS
- Análise crítica do nível de estresse digital da equipe.
- Cruzamento das ferramentas utilizadas (ex: prontuário de papel vs e-SUS) com a perda de tempo pós-consulta.
- Riscos de segurança da informação (ex: uso de login compartilhado ou dispositivos pessoais).

### 2. ANÁLISE DE IMPACTO NO ATENDIMENTO
- Avaliação detalhada de como a lentidão do sistema e a duplicidade de registros afetam a agenda de consultas e o tempo de escuta ao paciente.

### 3. PLANO DE AÇÃO ESTRUTURADO (PET-SAÚDE DIGITAL)
Apresente ações concretas divididas em:
- Ações Imediatas (0 a 30 dias): intervenções de baixo custo e rápido impacto.
- Ações de Médio Prazo (30 a 90 dias): otimização de fluxos e treinamentos.
- Ações de Longo Prazo: adequações estruturais e contratuais.

### 4. QUADRO DE VIABILIDADE E IMPACTO
- Indicação clara da Viabilidade (Alta/Média/Baixa) e Custo de Implementação (Baixo/Médio/Alto) para as soluções propostas.
---

UNIDADE DE SAÚDE ANALISADA: {ubs_name}
{dados_section}
{notas_section}

Seja extremamente detalhado, técnico e forneça orientações aplicáveis à realidade da Unidade Básica de Saúde.
"""
    return prompt.strip()


def call_qwen_api(prompt: str, api_key: str, model: str = "qwen/qwen-2.5-72b-instruct") -> str:
    """
    Chama a API do Qwen via OpenRouter.
    Endpoint: https://openrouter.ai/api/v1/chat/completions
    """
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pet-saude-digital.unesp.br",
        "X-Title": "PET-Saúde Digital UNESP"
    }
    body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Você é um consultor sênior em Governança de TI no SUS e Saúde Digital. "
                    "Responda sempre em português do Brasil com rigor técnico e linguagem acessível à gestão municipal."
                )
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 3000
    }
    resp = requests.post(url, headers=headers, json=body, timeout=90)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ==========================================================
# 7. BARRA LATERAL — LOGIN E CONFIGURAÇÕES
# ==========================================================
st.sidebar.markdown("<h2 class='sidebar-title'>Área Restrita</h2>", unsafe_allow_html=True)

if not st.session_state.logged_in:
    usuario = st.sidebar.text_input("Usuário")
    senha = st.sidebar.text_input("Senha", type="password")
    if st.sidebar.button("Entrar"):
        if usuario == "admin" and senha == "pet123":
            st.session_state.logged_in = True
            st.rerun()
        else:
            st.sidebar.error("Usuário ou senha incorretos.")
else:
    st.sidebar.success("✅ Logado com sucesso!")
    if st.sidebar.button("Sair"):
        st.session_state.logged_in = False
        st.rerun()

st.sidebar.markdown("---")
api_key = st.sidebar.text_input(
    "Chave de API (Qwen / OpenRouter)",
    type="password",
    help="Insira sua API Key do OpenRouter para habilitar o Qwen. Deixe em branco para modo demonstração."
)
api_model = st.sidebar.selectbox(
    "Modelo de IA",
    ["qwen/qwen-2.5-72b-instruct", "qwen/qwen-2.5-coder-32b-instruct", "openai/gpt-4o-mini"],
    index=0
)

firebase_status = "🟢 Firebase Storage ativo" if firebase_bucket else "🟡 Firebase offline (modo local)"
st.sidebar.caption(firebase_status)

# ==========================================================
# 8. TELA PRINCIPAL
# ==========================================================
st.markdown("<h1 class='main-title'>SUS-Digital Maps</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle'>Painel Interativo de Análise PET-Saúde Digital · UNESP 2026</p>", unsafe_allow_html=True)

col_cidade, col_ubs = st.columns([1, 2])
with col_cidade:
    cidade_selecionada = st.selectbox("Selecione a Cidade:", ["Selecione...", "Agudos", "Bariri", "Boraceia"])

if cidade_selecionada == "Selecione...":
    st.info("Selecione uma cidade para começar a análise.")
    st.stop()

ubs_disponiveis = list(dados_regioes[cidade_selecionada]["ubs"].keys())
with col_ubs:
    ubs_selecionada = st.selectbox("Selecione a UBS:", ubs_disponiveis)

# ID canônico da UBS (para Firebase Storage path)
unidade_id = re.sub(r"[^\w]", "_", ubs_selecionada.lower())[:60]

st.markdown("---")

# Abas disponíveis conforme login
if st.session_state.logged_in:
    aba_mapa, aba_forms, aba_docs = st.tabs([
        "📊 Mapa Oficial",
        "📝 Análise IA (Qwen)",
        "📁 Banco de Documentos"
    ])
else:
    (aba_mapa,) = st.tabs(["📊 Mapa Oficial"])

# ==========================================================
# ABA 1 — MAPA INTERATIVO
# ==========================================================
with aba_mapa:
    st.subheader(f"Mapa de Unidades de Saúde — {cidade_selecionada}")
    centro_mapa = dados_regioes[cidade_selecionada]["centro"]
    mapa = folium.Map(location=centro_mapa, zoom_start=13, tiles="OpenStreetMap")

    for nome, coord in dados_regioes[cidade_selecionada]["ubs"].items():
        cor = "darkred" if nome == ubs_selecionada else "blue"
        folium.Marker(
            location=[coord["lat"], coord["lon"]],
            tooltip=nome,
            popup=folium.Popup(f"<b>{nome}</b><br>{cidade_selecionada} - SP", max_width=220),
            icon=folium.Icon(color=cor, icon="plus-sign")
        ).add_to(mapa)

    st_folium(mapa, width="100%", height=430, key=f"mapa_{cidade_selecionada}_{ubs_selecionada}")

    if not st.session_state.logged_in:
        st.info("🔒 Faça login na barra lateral para acessar o formulário de análise e o banco de documentos.")

# ==========================================================
# ABA 2 — FORMULÁRIO + ANÁLISE IA (QWEN)
# ==========================================================
if st.session_state.logged_in:
    with aba_forms:
        st.subheader(f"Análise de Diagnóstico Digital — {ubs_selecionada}")

        # Seletor de modalidade de análise
        modalidade = st.radio(
            "**Selecione o Modelo de Análise (obrigatório):**",
            ["📊 Opção A: Análise Qualitativa Executiva", "📝 Opção B: Análise Quantitativa (Questionário PET-Saúde)"],
            horizontal=True
        )
        modo = "qualitativo" if "Opção A" in modalidade else "quantitativo"

        st.markdown("---")

        respostas_quantitativas = {}

        # --- OPÇÃO A: Qualitativa ---
        if modo == "qualitativo":
            st.markdown("#### 📊 Dados Consolidados da Unidade")
            st.markdown(
                f"Unidade selecionada: **{ubs_selecionada}** · Cidade: **{cidade_selecionada} - SP**\n\n"
                "O Qwen irá gerar o diagnóstico com base nas observações de campo e diretrizes inseridas abaixo."
            )

        # --- OPÇÃO B: Quantitativa (Accordions com número_inputs) ---
        else:
            st.markdown("#### 📝 Questionário PET-Saúde Digital (Q3–Q20) — Insira as Contagens")
            st.caption("Informe quantas respostas foram recebidas para cada alternativa nesta unidade.")

            for pergunta, opcoes in questionario.items():
                with st.expander(pergunta, expanded=False):
                    respostas_quantitativas[pergunta] = {}
                    cols = st.columns(min(3, len(opcoes)))
                    for idx, opcao in enumerate(opcoes):
                        with cols[idx % 3]:
                            val = st.number_input(
                                label=opcao,
                                min_value=0,
                                value=0,
                                step=1,
                                key=f"qnt_{unidade_id}_{pergunta}_{opcao}"
                            )
                            respostas_quantitativas[pergunta][opcao] = val

        # --- CAMPOS ABERTOS QUALITATIVOS (EDITÁVEIS — SEMPRE VISÍVEIS) ---
        st.markdown("---")
        st.markdown("#### ✏️ Observações Qualitativas & Notas de Campo (Editável)")
        st.caption("Estes campos são incluídos diretamente no prompt enviado ao Qwen. Preencha com observações do pesquisador e contexto local.")

        st.session_state.qualitative_notes = st.text_area(
            label="Relato de Campo do Pesquisador / Percepções da Equipe",
            value=st.session_state.qualitative_notes,
            height=120,
            placeholder=(
                "Exemplo: A equipe relata sobrecarga no período da tarde. Profissionais registram sinais vitais "
                "em papel para evitar paradas na fila, pois o e-SUS APS trava diariamente após as 14h..."
            ),
            key=f"campo_notas_{unidade_id}"
        )

        st.session_state.gestao_notes = st.text_area(
            label="Diretrizes e Prioridades da Gestão Local",
            value=st.session_state.gestao_notes,
            height=90,
            placeholder=(
                "Exemplo: A gestão municipal priorizou a eliminação de fichas físicas no 2º semestre de 2026 "
                "e solicitou treinamento específico do e-SUS Território para todos os ACS..."
            ),
            key=f"campo_gestao_{unidade_id}"
        )

        # --- BOTÃO DE GERAÇÃO ---
        st.markdown("---")
        col_btn, col_info = st.columns([1, 2])
        with col_btn:
            gerar = st.button(
                f"🤖 Gerar Relatório Técnico Qwen ({modalidade[:9]}...)",
                type="primary",
                use_container_width=True
            )
        with col_info:
            if not api_key:
                st.warning("⚠️ Insira a chave de API do OpenRouter na barra lateral para ativar o Qwen.")

        # --- GERAÇÃO DO DIAGNÓSTICO ---
        if gerar:
            if not api_key:
                st.error("❌ Chave de API ausente. Insira sua chave do OpenRouter na barra lateral.")
            else:
                prompt = build_qwen_prompt(
                    ubs_name=ubs_selecionada,
                    dados_quant=respostas_quantitativas,
                    notas_campo=st.session_state.qualitative_notes,
                    diretrizes_gestao=st.session_state.gestao_notes,
                    mode=modo
                )

                with st.spinner(f"🔄 Qwen ({api_model}) analisando {ubs_selecionada}..."):
                    try:
                        resultado = call_qwen_api(prompt, api_key, api_model)
                        st.session_state.ai_report = resultado
                        st.success("✅ Relatório gerado com sucesso!")
                    except requests.exceptions.HTTPError as e:
                        st.error(f"❌ Erro HTTP na API do OpenRouter: {e.response.status_code} — {e.response.text[:300]}")
                    except requests.exceptions.Timeout:
                        st.error("❌ Timeout: O Qwen demorou mais de 90 segundos para responder.")
                    except Exception as e:
                        st.error(f"❌ Erro inesperado: {e}")

        # --- EXIBIÇÃO DO RELATÓRIO ---
        if st.session_state.ai_report:
            st.markdown("---")
            st.markdown(f"### 📋 Relatório Técnico Qwen — {ubs_selecionada}")
            st.markdown(
                f"<div class='report-box'>{st.session_state.ai_report.replace(chr(10), '<br>')}</div>",
                unsafe_allow_html=True
            )

            # Botão de download do relatório
            st.download_button(
                label="⬇️ Baixar Relatório (.txt)",
                data=st.session_state.ai_report.encode("utf-8"),
                file_name=f"Relatorio_Qwen_{unidade_id}.txt",
                mime="text/plain"
            )

# ==========================================================
# ABA 3 — BANCO DE DOCUMENTOS (FIREBASE STORAGE 200MB)
# ==========================================================
if st.session_state.logged_in:
    with aba_docs:
        st.subheader(f"📁 Repositório de Documentos — {ubs_selecionada}")
        st.caption(f"Caminho no Firebase Storage: `unidades_saude/{unidade_id}/`")

        st.markdown("---")
        st.markdown("#### ⬆️ Upload de Evidência (máx. 200 MB)")

        arquivo = st.file_uploader(
            label="Selecione imagem ou PDF para anexar:",
            type=["png", "jpg", "jpeg", "pdf"],
            accept_multiple_files=False,
            help="Formatos aceitos: .png, .jpg, .jpeg, .pdf · Tamanho máximo: 200 MB"
        )

        col_cat, col_desc = st.columns([1, 2])
        with col_cat:
            categoria = st.selectbox(
                "Categoria do arquivo:",
                ["FOTO_EQUIPAMENTO", "PRONTUARIO_EVIDENCIA", "RELATORIO_TECNICO", "PRINT_ESUS", "OUTRO"]
            )
        with col_desc:
            descricao_arquivo = st.text_input(
                "Descrição breve da evidência:",
                placeholder="Ex: Foto das fichas CDS em papel acumuladas na triagem"
            )

        if arquivo is not None:
            # Validação de tamanho (200 MB)
            if arquivo.size > MAX_FILE_SIZE_BYTES:
                tamanho_mb = arquivo.size / (1024 * 1024)
                st.error(
                    f"❌ Arquivo rejeitado: **{arquivo.name}** ({tamanho_mb:.1f} MB) "
                    f"ultrapassa o limite máximo de **200 MB**."
                )
            else:
                tamanho_kb = arquivo.size / 1024
                tamanho_display = f"{tamanho_kb / 1024:.1f} MB" if tamanho_kb > 1024 else f"{tamanho_kb:.0f} KB"
                st.info(f"📎 **{arquivo.name}** · {tamanho_display} · {arquivo.type}")

                if st.button("📤 Confirmar Upload para Firebase Storage", type="primary"):
                    with st.spinner("Enviando arquivo..."):
                        file_bytes = arquivo.read()
                        public_url = upload_to_firebase_storage(
                            file_bytes=file_bytes,
                            file_name=arquivo.name,
                            unidade_id=unidade_id,
                            content_type=arquivo.type
                        )

                        registro = {
                            "ubs": ubs_selecionada,
                            "nome": arquivo.name,
                            "tamanho": tamanho_display,
                            "categoria": categoria,
                            "descricao": descricao_arquivo,
                            "url_firebase": public_url or "(salvo localmente)",
                        }

                        # Evitar duplicatas por nome na sessão
                        nomes_existentes = [f["nome"] for f in st.session_state.uploaded_files]
                        if arquivo.name not in nomes_existentes:
                            st.session_state.uploaded_files.append(registro)

                        destino = "Firebase Storage (nuvem) ✅" if public_url else "Sessão local (Firebase offline)"
                        st.markdown(
                            f"<div class='upload-success'>✅ Upload concluído! · Destino: {destino}</div>",
                            unsafe_allow_html=True
                        )
                        if public_url:
                            st.code(public_url, language="text")

        # --- LISTA DE DOCUMENTOS DESTA UBS ---
        docs_ubs = [f for f in st.session_state.uploaded_files if f.get("ubs") == ubs_selecionada]
        if docs_ubs:
            st.markdown("---")
            st.markdown(f"#### 🗂️ Documentos Registrados ({len(docs_ubs)})")
            for doc in docs_ubs:
                with st.expander(f"📄 {doc['nome']} · {doc.get('tamanho', '')} · {doc.get('categoria', '')}"):
                    st.write(f"**Descrição:** {doc.get('descricao', 'Sem descrição')}")
                    if doc.get("url_firebase") and doc["url_firebase"].startswith("http"):
                        st.markdown(f"[🔗 Abrir no Firebase Storage]({doc['url_firebase']})")
        else:
            st.info("Nenhum documento enviado para esta unidade nesta sessão.")