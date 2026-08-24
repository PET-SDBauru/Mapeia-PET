# -*- coding: utf-8 -*-
"""
Mapeia PET - Saúde Digital
Aplicativo para análise inteligente do fluxo e estresse digital nas UBSs.
"""

import streamlit as st
import pandas as pd
import folium
from streamlit_folium import st_folium
import google.generativeai as genai

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
if "uploaded_files" not in st.session_state:
    st.session_state.uploaded_files = []

# ==========================================================
# 2. ESTILIZAÇÃO CSS 
# ==========================================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
    .stApp { font-family: 'Montserrat', sans-serif; }
    span.material-symbols-rounded, span.material-icons, .stIcon { font-family: 'Material Symbols Rounded' !important; }
    .main-title { font-size: 2.5rem; font-weight: 700; color: #002B49; margin-bottom: 0.5rem; }
    .subtitle { font-size: 1.1rem; color: #00B259; margin-bottom: 2rem; font-weight: 600; }
    .sidebar-title { font-weight: bold; color: #002B49; }
</style>
""", unsafe_allow_html=True)

# ==========================================================
# 3. DADOS DE CIDADES E UBSs (COORDENADAS APROXIMADAS)
# ==========================================================
dados_regioes = {
    "Bariri": {
        "centro": [-22.0744, -48.7403],
        "ubs": {
            "UBS Central (José Francisco Belluzzo)": {"lat": -22.0735, "lon": -48.7460},
            "ESF I - Nova Bariri": {"lat": -22.0812, "lon": -48.7335},
            "ESF II - Paulo de Tarso Mazzo": {"lat": -22.0625, "lon": -48.7490},
            "ESF III - Dr. Renato Figueiredo": {"lat": -22.0700, "lon": -48.7500},
            "ESF IV - Dr. Francisco Leoni Neto": {"lat": -22.0650, "lon": -48.7300},
            "ESF V - Livramento": {"lat": -22.0800, "lon": -48.7550}
        }
    },
    "Agudos": {
        "centro": [-22.4694, -48.9863],
        "ubs": {
            "UBS Central Agudos": {"lat": -22.4680, "lon": -48.9850},
            "ESF Pampulha": {"lat": -22.4750, "lon": -48.9900},
            "ESF Professor Thyrso": {"lat": -22.4600, "lon": -48.9800}
        }
    },
    "Boraceia": {
        "centro": [-22.1950, -48.7788],
        "ubs": {
            "Centro de Saúde Boraceia": {"lat": -22.1940, "lon": -48.7790},
            "ESF Boraceia": {"lat": -22.1970, "lon": -48.7750}
        }
    }
}

# ==========================================================
# 4. ESTRUTURA DO QUESTIONÁRIO (Extraído do PDF)
# ==========================================================
questionario = {
    "3. Qual o seu cargo atual na UBS?": ["Agente administrativo", "Auxiliar administrativo", "Auxiliar de enfermagem", "Dentista", "Enfermeiro", "Gerente/Coordenador", "Médico", "Recepcionista", "Técnico de enfermagem", "Outro"],
    "4. Ferramentas e registros utilizados?": ["Prontuário Eletrônico/e-SUS APS", "Sistema próprio (SIS)", "Prontuário Físico (Papel)", "Caderno de Anotações", "Outro"],
    "5. Existe protocolo de preenchimento?": ["Sim, rígido", "Compartilhado/flexível", "Não existe formalmente", "Outro"],
    "6. Localização cria barreiras?": ["Sim, dificulta", "Parcialmente", "Não, é central/fácil acesso"],
    "7. Faixa etária predominante?": ["Crianças/Pediatria", "Jovens/Adultos", "Idosos", "Distribuição mista"],
    "8. Perfil socioeconômico?": ["Média/Média-Alta", "Média-Baixa", "Baixa/Vulnerabilidade", "Extrema Vulnerabilidade", "Misto"],
    "9. Frequência de atualização e-SUS?": ["Imediatamente", "Em blocos (fim de turno)", "Dias posteriores"],
    "10. Há necessidade de duplo registro?": ["Sim, frequentemente", "Às vezes", "Não, registro único"],
    "11. Frequência de registrar mesma info?": ["Sempre", "Frequentemente", "Às vezes", "Raramente", "Nunca"],
    "12. Onde a informação é replicada?": ["e-SUS + Ata/Livro", "e-SUS + Ficha física", "e-SUS + Planilhas internas", "Dois sistemas digitais", "Não se aplica"],
    "13. Padrão clínico rígido?": ["Sim, padronizado", "Básico com variação", "Não há padronização"],
    "14. Materiais de apoio em dúvidas?": ["Sim, claros", "Manuais confusos", "Não há materiais"],
    "15. Política de login?": ["Individual", "Compartilhado", "Geral único"],
    "16. Uso de dispositivos pessoais?": ["Sim (falha corporativo)", "Sim (conveniência)", "Não (só corporativo)"],
    "17. Melhora a qualidade do cuidado (1 a 5)?": ["Nota 1", "Nota 2", "Nota 3", "Nota 4", "Nota 5"],
    "18. Benefícios percebidos?": ["Rapidez histórico", "Maior segurança", "Agilidade clínica", "Melhor coordenação", "Nenhum benefício"],
    "19. Minutos preenchendo pós-consulta?": ["Menos de 2 min", "2 a 5 min", "6 a 10 min", "Mais de 10 min"],
    "20. Lentidão atrasa agenda?": ["Diariamente", "Várias vezes na semana", "Raramente", "Nunca"]
}

# ==========================================================
# 5. BARRA LATERAL - LOGIN E CONFIGURAÇÕES
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
    st.sidebar.success("Logado com sucesso!")
    if st.sidebar.button("Sair"):
        st.session_state.logged_in = False
        st.rerun()

st.sidebar.markdown("---")
api_key = st.sidebar.text_input("Chave de API do Gemini (Opcional)", type="password", help="Insira sua API Key para habilitar análises de IA.")

# ==========================================================
# 6. TELA INICIAL - SELEÇÃO
# ==========================================================
st.markdown("<h1 class='main-title'>SUS-Digital Maps</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle'>Painel Interativo de Análise PET-Saúde Digital</p>", unsafe_allow_html=True)

col_cidade, col_ubs = st.columns(2)
with col_cidade:
    cidade_selecionada = st.selectbox("Selecione a Região / Cidade:", ["Selecione...", "Agudos", "Bariri", "Boraceia"])

if cidade_selecionada != "Selecione...":
    ubs_disponiveis = list(dados_regioes[cidade_selecionada]["ubs"].keys())
    
    with col_ubs:
        ubs_selecionada = st.selectbox("Selecione uma UBS para analisar:", ubs_disponiveis)

    st.markdown("---")

    # Controle de Abas
    if st.session_state.logged_in:
        abas = st.tabs(["📊 Mapa Oficial", "📝 Preenchimento & Análise IA", "📁 Banco de Documentos"])
        aba_mapa, aba_forms, aba_docs = abas[0], abas[1], abas[2]
    else:
        abas = st.tabs(["📊 Mapa Oficial"])
        aba_mapa = abas[0]

    # --- ABA 1: MAPA ---
    with aba_mapa:
        st.subheader(f"Mapa de Unidades - {cidade_selecionada}")
        centro_mapa = dados_regioes[cidade_selecionada]["centro"]
        mapa = folium.Map(location=centro_mapa, zoom_start=13, tiles="OpenStreetMap")
        
        for nome, coord in dados_regioes[cidade_selecionada]["ubs"].items():
            cor_marcador = "darkred" if nome == ubs_selecionada else "blue"
            folium.Marker(
                location=[coord["lat"], coord["lon"]],
                tooltip=nome,
                icon=folium.Icon(color=cor_marcador, icon="info-sign")
            ).add_to(mapa)
        
        st_folium(mapa, width="100%", height=400, key=f"mapa_{cidade_selecionada}")
        if not st.session_state.logged_in:
            st.info("Faça login na barra lateral para inserir dados quantitativos e gerar relatórios de IA desta UBS.")

    # --- ABA 2: FORMULÁRIO E IA ---
    if st.session_state.logged_in:
        with aba_forms:
            st.subheader(f"Entrada de Dados e Análise: {ubs_selecionada}")
            st.write("Insira a quantidade de respostas obtidas para cada alternativa nesta unidade. A IA fará o cruzamento desses dados.")
            
            # Coletor de respostas
            respostas_quantitativas = {}
            
            with st.form("form_ia_completo"):
                for pergunta, opcoes in questionario.items():
                    with st.expander(pergunta, expanded=False):
                        respostas_quantitativas[pergunta] = {}
                        cols = st.columns(3)
                        for idx, opcao in enumerate(opcoes):
                            with cols[idx % 3]:
                                # A chave garante que os inputs não se misturem entre as UBSs
                                valor = st.number_input(f"{opcao}", min_value=0, value=0, key=f"{ubs_selecionada}_{pergunta}_{opcao}")
                                respostas_quantitativas[pergunta][opcao] = valor
                
                gerar_analise = st.form_submit_button("Gerar Diagnóstico IA")

            # Integração com o Gemini
            if gerar_analise:
                if not api_key:
                    st.warning("⚠️ Insira a chave de API do Gemini na barra lateral para gerar a análise.")
                else:
                    with st.spinner(f"A IA está analisando os fluxos da unidade {ubs_selecionada}..."):
                        try:
                            genai.configure(api_key=api_key)
                            model = genai.GenerativeModel("gemini-1.5-flash")
                            
                            # Formata os dados preenchidos para a IA entender
                            dados_formatados = ""
                            for p, ops in respostas_quantitativas.items():
                                tem_resposta = any(v > 0 for v in ops.values())
                                if tem_resposta:
                                    dados_formatados += f"\n**{p}**\n"
                                    for o, v in ops.items():
                                        if v > 0:
                                            dados_formatados += f"- {o}: {v} resposta(s)\n"
                            
                            if dados_formatados == "":
                                st.error("Você precisa preencher as quantidades em pelo menos uma pergunta para gerar a análise.")
                            else:
                                prompt = f"""
                                Você é um Especialista em Gestão do SUS e Informática em Saúde do PET-Saúde.
                                Faça um diagnóstico detalhado da infraestrutura e dos fluxos digitais da Unidade: {ubs_selecionada}.
                                
                                A equipe local preencheu um questionário e as respostas quantitativas consolidadas foram:
                                {dados_formatados}
                                
                                Com base EXCLUSIVAMENTE nesses números, gere um relatório interativo contendo:
                                1. Diagnóstico Geral do Perfil da UBS (Profissionais, público e infraestrutura).
                                2. Gargalos Tecnológicos (Analise cruzando o tempo gasto, lentidão, duplo registro e uso de celulares pessoais).
                                3. Nível de Estresse Digital estimado da equipe.
                                4. Três (3) sugestões práticas e de baixo custo para melhorar a digitalização do fluxo nesta unidade específica.
                                """
                                
                                resposta_gemini = model.generate_content(prompt)
                                st.success("Análise Concluída com Sucesso!")
                                st.markdown("---")
                                st.markdown(f"### Relatório PET-Saúde Digital: {ubs_selecionada}")
                                st.markdown(resposta_gemini.text)
                                
                        except Exception as e:
                            st.error(f"Erro de conexão com o Google Gemini: {e}")

    # --- ABA 3: BANCO DE DOCUMENTOS ---
    if st.session_state.logged_in:
        with aba_docs:
            st.subheader(f"Repositório de Arquivos - {ubs_selecionada}")
            arquivo = st.file_uploader("Anexar evidência (PDF, Excel, Imagem)", type=["pdf", "png", "jpg", "jpeg", "docx", "xlsx"])
            
            if arquivo is not None:
                nome_salvo = f"[{ubs_selecionada}] {arquivo.name}"
                if nome_salvo not in st.session_state.uploaded_files:
                    st.session_state.uploaded_files.append(nome_salvo)
                    st.success("Arquivo salvo!")
                
            if st.session_state.uploaded_files:
                st.markdown("### Documentos na base:")
                for doc in st.session_state.uploaded_files:
                    if doc.startswith(f"[{ubs_selecionada}]"):
                        st.markdown(f"- 📄 {doc}")