// ==============================================================================
// MULTI-PROVIDER AI SERVICE (GEMINI, GROQ, OPENROUTER, OLLAMA & FALLBACK)
// PET-Saúde Digital - Orquestrador Flexível com Acesso Gratuito e Alta Resiliência
// ==============================================================================

import { type HealthUnit, localDiagnosisDatabase } from "../data/ubsAgudos";

export type AiProvider = "gemini" | "groq" | "openrouter" | "ollama" | "fallback";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  ollamaUrl?: string;
  customPromptPrefix?: string;
}

export interface AiDiagnosticResult {
  reportText: string;
  providerUsed: AiProvider;
  modelUsed: string;
  fallbackTriggered: boolean;
  timestamp: string;
  estimatedStressScore: number;
}

// Configurações padrão de modelos por provedor
export const PROVIDER_MODELS: Record<AiProvider, { id: string; name: string; isFree: boolean }[]> = {
  gemini: [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Gratuito / Rápido)", isFree: true },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Nova Geração)", isFree: true },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Raciocínio Avançado)", isFree: true }
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Free Tier Ultra-Rápido)", isFree: true },
    { id: "llama3-8b-8192", name: "Llama 3 8B (Super Leve)", isFree: true },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B MoE", isFree: true }
  ],
  openrouter: [
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (OpenRouter Free)", isFree: true },
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash Exp (Free)", isFree: true },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", isFree: true }
  ],
  ollama: [
    { id: "llama3", name: "Llama 3 (Local Ollama)", isFree: true },
    { id: "mistral", name: "Mistral 7B (Local Ollama)", isFree: true },
    { id: "gemma2", name: "Gemma 2 (Local Ollama)", isFree: true }
  ],
  fallback: [
    { id: "heuristic-pet-saude", name: "Motor Heurístico Local PET-Saúde (Offline / Zero Custo)", isFree: true }
  ]
};

const STORAGE_KEY_AI_CONFIG = "pet_saude_ai_config_v1";

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Padrão: Verifica se há chave de ambiente para Gemini ou ativa Fallback inteligente
  const defaultGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  
  return {
    provider: defaultGeminiKey ? "gemini" : "fallback",
    apiKey: defaultGeminiKey,
    model: defaultGeminiKey ? "gemini-1.5-flash" : "heuristic-pet-saude",
    ollamaUrl: "http://localhost:11434"
  };
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error("Erro ao salvar configuração de IA:", err);
  }
}

/**
 * Constrói o prompt padronizado para diagnóstico de fluxo e estresse digital
 */
export function buildDiagnosticPrompt(unit: HealthUnit): string {
  const { surveyData } = unit;
  
  return `
Você é um Especialista em Saúde Pública, Informática em Saúde e Docente do Programa PET-Saúde Digital.
Realize um diagnóstico aprofundado, técnico e executivo sobre a maturidade digital e o fluxo de trabalho da unidade de saúde abaixo.

DADOS DA UNIDADE DE SAÚDE:
- Nome da Unidade: ${unit.name} (${unit.shortName})
- Tipo de Unidade: ${unit.type} (CNES: ${unit.cnes || "N/D"})
- Município / Estado: ${unit.city} - ${unit.state}
- Bairro e Endereço: ${unit.address}, ${unit.neighborhood}
- População Coberta: ~${unit.coveragePopulation.toLocaleString("pt-BR")} habitantes
- Equipes Ativas: ${unit.activeTeams} equipe(s)
- Serviços Ofertados: ${unit.services.join(", ")}

RESPOSTAS CONSOLIDADAS DO QUESTIONÁRIO PET-SAÚDE:
- Respondente Principal: ${surveyData.respondentName} (Cargo: ${surveyData.role})
- Ferramentas Utilizadas: ${surveyData.toolsUsed.join(", ")}
- Protocolo de Alimentação: ${surveyData.hasClearProtocol}
- Barreira Geográfica de Acesso: ${surveyData.geographicBarriers}
- Faixa Etária Predominante: ${surveyData.predominantAgeGroup}
- Perfil Socioeconômico: ${surveyData.predominantClass}
- Frequência de Atualização e-SUS: ${surveyData.eSusUpdateFrequency}
- Há Necessidade de Duplicidade de Registros: ${surveyData.needsDuplicateRecord ? "SIM" : "NÃO"} (Frequência: ${surveyData.duplicateFrequency})
- Onde a Informação é Replicada: ${surveyData.duplicatedLocations.join(", ")}
- Padrão Clínico Rígido: ${surveyData.hasRigidClinicalStandard}
- Materiais de Apoio Disponíveis: ${surveyData.supportMaterialsAvailable}
- Política de Login: ${surveyData.loginPolicy}
- Uso de Smartphones Pessoais (WhatsApp, etc.): ${surveyData.usesPersonalPhone ? "SIM" : "NÃO"}
- Avaliação da Melhoria do Cuidado pelo Prontuário Eletrônico: Nota ${surveyData.careQualityRating}/5
- Tempo Médio Gasto Preenchendo Sistema Pós-Consulta: ${surveyData.minutesFillingPostConsultation} minutos
- Frequência de Lentidão/Travamentos: ${surveyData.lagFrequency}

DIRETRIZES DE RESPOSTA:
O seu relatório deve ser redigido em tom estritamente profissional, com formatação rica em Markdown (títulos com ##, negrito e marcadores).
Estruture sua resposta EXATAMENTE nas 4 seções a seguir:

## 1. DIAGNÓSTICO DO NÍVEL DE ESTRESSE DIGITAL
(Avalie o impacto do retrabalho, lentidão de rede, atritos no login e riscos de segurança da informação decorrentes do uso de aplicativos pessoais).

## 2. ANÁLISE DE TEMPO, GARGALOS E IMPACTO NA AGENDA
(Analise os ${surveyData.minutesFillingPostConsultation} minutos gastos pós-consulta, a fila de espera física, a retenção de fichas e a repercussão na produtividade e no Previne Brasil).

## 3. PONTOS FORTES E OPORTUNIDADES IDENTIFICADAS
(Destaque aspectos positivos observados na rotina da unidade e potencialidades para digitalização segura).

## 4. PLANO DE AÇÃO PET-SAÚDE DIGITAL (3 AÇÕES PRÁTICAS DE BAIXO CUSTO)
(Apresente 3 recomendações viáveis, práticas e de rápida implementação pelo grupo de trabalho PET-Saúde para otimizar o fluxo e reduzir a sobrecarga da equipe).
`.trim();
}

/**
 * Gera o diagnóstico utilizando o motor de fallback determinístico
 */
export function generateLocalHeuristicReport(unit: HealthUnit): string {
  const { surveyData } = unit;
  const known = localDiagnosisDatabase[unit.id];

  const estimatedScore = unit.stressScore;
  const severityTag = unit.stressLevel === "CRÍTICO" ? "🔴 CRÍTICO" : unit.stressLevel === "ALTO" ? "🟠 ALTO" : unit.stressLevel === "MODERADO" ? "🟡 MODERADO" : "🟢 BAIXO";

  const duplicidadeText = surveyData.needsDuplicateRecord
    ? `A rotina da equipe é marcada pela duplicidade recorrente de registros (${surveyData.duplicateFrequency.toLowerCase()}), onde as informações precisam ser redigitadas em: ${surveyData.duplicatedLocations.join("; ")}.`
    : `A unidade opera com baixo índice de redundância de registros manuais, concentrando dados primordialmente no prontuário eletrônico.`;

  const phoneText = surveyData.usesPersonalPhone
    ? `Identificou-se o uso frequente de celulares pessoais e aplicativos como WhatsApp para troca de fotos de evidências e alinhamento de visitas dos ACS, expondo dados sensíveis à ausência de governança institucional formal.`
    : `A equipe utiliza canais formais da Secretaria Municipal de Saúde, minimizando o risco de vazamento de dados clínicos.`;

  const customPropostas = known?.propostas || [
    "Treinamento de atalhos e modelos de anamnese padronizados no e-SUS APS para reduzir o tempo de preenchimento pós-consulta.",
    "Eliminação gradativa das fichas de papel paralelas, mantendo bloco físico apenas para contingência em quedas totais de link de internet.",
    "Implementação de oficina PET-Saúde com boas práticas de segurança da informação e transição para o app e-SUS Território."
  ];

  return `
## 1. DIAGNÓSTICO DO NÍVEL DE ESTRESSE DIGITAL
**Status Avaliado:** ${severityTag} (Pontuação de Estresse: **${estimatedScore}/100**)

Na **${unit.name}**, o quadro de estresse digital é classificado como **${unit.stressLevel}**. ${duplicidadeText}

${phoneText} A política de acesso aos computadores (${surveyData.loginPolicy.toLowerCase()}) somada à frequência de lentidão relatada (**${surveyData.lagFrequency.toLowerCase()}**) eleva o desgaste emocional dos profissionais (${surveyData.role}) e amplifica a sensação de burocracia excessiva.

---

## 2. ANÁLISE DE TEMPO, GARGALOS E IMPACTO NA AGENDA
- **Tempo Médio de Preenchimento Pós-Consulta:** **${surveyData.minutesFillingPostConsultation} minutos** por atendimento.
- **Frequência de Alimentação do Sistema:** ${surveyData.eSusUpdateFrequency}.
- **Impacto Direto:** Em uma jornada com 16 consultas diárias por profissional, o gasto puramente burocrático chega a aproximadamente **${((surveyData.minutesFillingPostConsultation * 16) / 60).toFixed(1)} horas diárias**.
- **Gargalo Identificado:** A lentidão na conexão e a duplicidade geram retenção na fila de espera externa, prejudicando o acolhimento humanizado e atrasando a consolidação das metas municipais no Previne Brasil.

---

## 3. PONTOS FORTES E OPORTUNIDADES IDENTIFICADAS
- **Engajamento da Equipe:** Os profissionais demonstram alta dedicação ao território e reconhecem benefícios práticos como: *${surveyData.perceivedBenefits.join(", ")}*.
- **Estrutura Existente:** A unidade conta com ${unit.activeTeams} equipe(s) ativa(s) atendendo cerca de ${unit.coveragePopulation.toLocaleString("pt-BR")} munícipes com cobertura de ${unit.services.length} linhas de cuidado.
- **Oportunidade de Intervenção:** Alto potencial de ganho de eficiência com a padronização de protocolos clínicos e capacitação técnica direcionada pelo projeto PET-Saúde.

---

## 4. PLANO DE AÇÃO PET-SAÚDE DIGITAL (3 AÇÕES PRÁTICAS DE BAIXO CUSTO)
1. **${customPropostas[0] || "Otimização de Modelos Clínicos no e-SUS"}**: Reduzir cliques repetitivos através de templates de atendimento pré-configurados para queixas frequentes (hipertensão, diabetes, pré-natal).
2. **${customPropostas[1] || "Protocolo de Registro Único Sem Papel"}**: Estabelecer diretriz interna autorizando a dispensa definitiva de fichas manuais para consultas eletivas, agilizando o fluxo de trabalho.
3. **${customPropostas[2] || "Capacitação Expressa em Saúde Digital"}**: Conduzir minicurso presencial/híbrido pelo grupo PET-Saúde com foco no aplicativo móvel e-SUS Território e boas práticas de LGPD na atenção primária.
`.trim();
}

/**
 * Função principal para gerar relatório com suporte multi-provedor e fallback em cascata
 */
export async function generateDiagnosticReport(
  unit: HealthUnit,
  customConfig?: Partial<AiConfig>
): Promise<AiDiagnosticResult> {
  const config = { ...loadAiConfig(), ...customConfig };
  const prompt = buildDiagnosticPrompt(unit);

  // Se o provedor for explicitamente Fallback Local
  if (config.provider === "fallback" || !config.apiKey && config.provider !== "ollama") {
    return {
      reportText: generateLocalHeuristicReport(unit),
      providerUsed: "fallback",
      modelUsed: "heuristic-pet-saude",
      fallbackTriggered: config.provider !== "fallback",
      timestamp: new Date().toISOString(),
      estimatedStressScore: unit.stressScore
    };
  }

  // Tentar chamada ao backend Express (/api/ai/generate ou /api/gemini)
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        ollamaUrl: config.ollamaUrl,
        prompt: prompt
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro ${response.status} na API de IA`);
    }

    const data = await response.json();
    return {
      reportText: data.text || generateLocalHeuristicReport(unit),
      providerUsed: config.provider,
      modelUsed: data.model || config.model,
      fallbackTriggered: false,
      timestamp: new Date().toISOString(),
      estimatedStressScore: unit.stressScore
    };
  } catch (error: any) {
    console.warn(`[AI Service] Falha na chamada do provedor '${config.provider}':`, error.message);
    console.info("[AI Service] Acionando Fallback Heurístico Local transparente.");

    // Fallback gracioso sem interromper a interface
    return {
      reportText: generateLocalHeuristicReport(unit),
      providerUsed: "fallback",
      modelUsed: "heuristic-pet-saude (Fallback Ativado)",
      fallbackTriggered: true,
      timestamp: new Date().toISOString(),
      estimatedStressScore: unit.stressScore
    };
  }
}

/**
 * Testa a validade da chave de API e conexão com o provedor selecionado
 */
export async function testAiConnection(config: AiConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === "fallback") {
    return { success: true, message: "Motor Heurístico Local está 100% operacional (sem dependência de chaves)." };
  }

  if (!config.apiKey && config.provider !== "ollama") {
    return { success: false, message: "Por favor, insira a chave de API para o provedor selecionado." };
  }

  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        ollamaUrl: config.ollamaUrl,
        prompt: "Responda apenas 'Conexão OK com PET-Saúde Digital' em uma única linha."
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Falha na validação da chave.");
    }

    return {
      success: true,
      message: `Conexão bem-sucedida com ${config.provider.toUpperCase()} (${config.model})!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao testar ${config.provider.toUpperCase()}: ${err.message || "Falha de rede"}`
    };
  }
}
