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

# Armazenamento de imagens/documentos (Firebase ou local) — ver docs/ARMAZENAMENTO.md
from storage import CATEGORIES, MAX_FILE_SIZE_BYTES, UploadError, create_storage, upload

# ==========================================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================================
st.set_page_config(
    page_title="Mapeia PET",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

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
# 3. ARMAZENAMENTO (FIREBASE STORAGE + FIRESTORE, OU LOCAL)
# ==========================================================
def _secret(key: str, default=None):
    """Lê de st.secrets sem quebrar quando não existe secrets.toml."""
    try:
        return st.secrets[key]
    except Exception:
        return default


@st.cache_resource
def get_store():
    """
    Cria o backend de armazenamento uma única vez por processo.
    Credenciais (em ordem):
      1. st.secrets["FIREBASE_SERVICE_ACCOUNT"] (tabela TOML com o JSON da conta de serviço)
      2. arquivo JSON apontado por GOOGLE_APPLICATION_CREDENTIALS
    Sem credenciais → armazenamento local em data/uploads/.
    """
    service_account = _secret("FIREBASE_SERVICE_ACCOUNT")
    if service_account is not None:
        service_account = dict(service_account)
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        with open(os.environ["GOOGLE_APPLICATION_CREDENTIALS"], encoding="utf-8") as f:
            service_account = json.load(f)

    bucket = _secret("FIREBASE_STORAGE_BUCKET") or os.getenv("FIREBASE_STORAGE_BUCKET")
    return create_storage(service_account, bucket)


store = get_store()

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

def format_size(n_bytes: int) -> str:
    kb = n_bytes / 1024
    return f"{kb / 1024:.1f} MB" if kb > 1024 else f"{kb:.0f} KB"


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

firebase_status = (
    "🟢 Firebase Storage ativo" if store.name == "firebase"
    else "🟡 Firebase offline (armazenamento local)"
)
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

        # Sem value=: a key por UBS guarda o texto de cada unidade separadamente.
        notas_campo = st.text_area(
            label="Relato de Campo do Pesquisador / Percepções da Equipe",
            height=120,
            placeholder=(
                "Exemplo: A equipe relata sobrecarga no período da tarde. Profissionais registram sinais vitais "
                "em papel para evitar paradas na fila, pois o e-SUS APS trava diariamente após as 14h..."
            ),
            key=f"campo_notas_{unidade_id}"
        )

        diretrizes_gestao = st.text_area(
            label="Diretrizes e Prioridades da Gestão Local",
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
                    notas_campo=notas_campo,
                    diretrizes_gestao=diretrizes_gestao,
                    mode=modo
                )

                with st.spinner(f"🔄 Qwen ({api_model}) analisando {ubs_selecionada}..."):
                    try:
                        resultado = call_qwen_api(prompt, api_key, api_model)
                        st.session_state[f"ai_report_{unidade_id}"] = resultado
                        st.success("✅ Relatório gerado com sucesso!")
                    except requests.exceptions.HTTPError as e:
                        st.error(f"❌ Erro HTTP na API do OpenRouter: {e.response.status_code} — {e.response.text[:300]}")
                    except requests.exceptions.Timeout:
                        st.error("❌ Timeout: O Qwen demorou mais de 90 segundos para responder.")
                    except Exception as e:
                        st.error(f"❌ Erro inesperado: {e}")

        # --- EXIBIÇÃO DO RELATÓRIO ---
        relatorio = st.session_state.get(f"ai_report_{unidade_id}")
        if relatorio:
            st.markdown("---")
            st.markdown(f"### 📋 Relatório Técnico Qwen — {ubs_selecionada}")
            # Markdown puro (sem unsafe_allow_html): a resposta do modelo não é HTML confiável.
            with st.container(border=True):
                st.markdown(relatorio)

            # Botão de download do relatório
            st.download_button(
                label="⬇️ Baixar Relatório (.txt)",
                data=relatorio.encode("utf-8"),
                file_name=f"Relatorio_Qwen_{unidade_id}.txt",
                mime="text/plain"
            )

# ==========================================================
# ABA 3 — BANCO DE DOCUMENTOS (pacote storage/: Firebase ou local)
# ==========================================================
if st.session_state.logged_in:
    with aba_docs:
        st.subheader(f"📁 Repositório de Documentos — {ubs_selecionada}")
        destino = "Firebase Storage (nuvem)" if store.name == "firebase" else "armazenamento local (data/uploads)"
        st.caption(f"Destino dos arquivos: {destino}")

        st.markdown("---")
        st.markdown(f"#### ⬆️ Upload de Evidência (máx. {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB)")

        # form + clear_on_submit: após enviar, o uploader é limpo e o mesmo
        # arquivo não é reenviado a cada re-execução do script.
        with st.form("form_upload", clear_on_submit=True):
            arquivos = st.file_uploader(
                label="Selecione imagens ou PDFs para anexar:",
                type=["png", "jpg", "jpeg", "pdf"],
                accept_multiple_files=True,
                help="Formatos aceitos: .png, .jpg, .jpeg, .pdf · Tamanho máximo: 200 MB por arquivo"
            )
            col_cat, col_desc = st.columns([1, 2])
            with col_cat:
                categoria = st.selectbox("Categoria do arquivo:", CATEGORIES)
            with col_desc:
                descricao_arquivo = st.text_input(
                    "Descrição breve da evidência:",
                    placeholder="Ex: Foto das fichas CDS em papel acumuladas na triagem"
                )
            enviar = st.form_submit_button("📤 Enviar", type="primary")

        if enviar and arquivos:
            with st.spinner("Enviando arquivo(s)..."):
                for arquivo in arquivos:
                    try:
                        salvo = upload(
                            store,
                            arquivo.getvalue(),
                            arquivo.name,
                            unidade_id=unidade_id,
                            unidade_nome=ubs_selecionada,
                            category=categoria,
                            description=descricao_arquivo,
                            uploaded_by="admin",  # trocar pelo usuário real quando houver Firebase Auth
                        )
                        st.markdown(
                            f"<div class='upload-success'>✅ {salvo.file_name} "
                            f"({format_size(salvo.size)}) salvo com sucesso.</div>",
                            unsafe_allow_html=True
                        )
                    except UploadError as e:
                        st.error(f"❌ {arquivo.name}: {e}")
                    except Exception as e:
                        st.error(f"❌ Falha ao salvar {arquivo.name}: {e}")

        # --- LISTA DE DOCUMENTOS DESTA UBS (persistente) ---
        try:
            docs_ubs = store.list(unidade_id)
        except Exception as e:
            docs_ubs = []
            st.error(f"❌ Não foi possível listar os documentos: {e}")

        st.markdown("---")
        if not docs_ubs:
            st.info("Nenhum documento enviado para esta unidade.")
        else:
            st.markdown(f"#### 🗂️ Documentos Registrados ({len(docs_ubs)})")
            for doc in docs_ubs:
                data_envio = doc.uploaded_at[:16].replace("T", " ")
                with st.expander(f"📄 {doc.file_name} · {format_size(doc.size)} · {doc.category} · {data_envio}"):
                    st.write(f"**Descrição:** {doc.description or 'Sem descrição'}")

                    # Conteúdo só é baixado do backend quando o usuário pede,
                    # para não transferir todos os arquivos a cada re-execução.
                    if st.toggle("Visualizar / baixar", key=f"ver_{doc.id}"):
                        try:
                            conteudo = store.read(doc.id)
                            if doc.is_image:
                                st.image(conteudo, caption=doc.file_name)
                            st.download_button(
                                "⬇️ Baixar arquivo", data=conteudo,
                                file_name=doc.file_name, mime=doc.content_type,
                                key=f"dl_{doc.id}"
                            )
                        except Exception as e:
                            st.error(f"❌ Erro ao ler o arquivo: {e}")

                    confirmar = st.checkbox("Confirmo que desejo excluir este arquivo", key=f"conf_{doc.id}")
                    if st.button("🗑️ Excluir", key=f"del_{doc.id}", disabled=not confirmar):
                        store.delete(doc.id)
                        st.rerun()
