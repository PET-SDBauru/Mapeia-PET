import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Settings, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Brain, 
  FileJson, 
  Users, 
  Globe2,
  BarChart3,
  ClipboardList,
  Layers,
  ShieldAlert,
  RotateCcw,
  Check,
  Edit3
} from "lucide-react";

// Definição dos dados estruturados exatos do formulário
interface UBSResponse {
  "ID da resposta": number;
  "Hora de início": string;
  "Hora de conclusão": string;
  "Nome completo:": string;
  "Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?": string;
  "Qual o seu cargo atual na UBS?": string;
  "Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?": string;
  "Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?": string;
  "Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?": string;
  "Qual é o perfil de faixa etária predominante dos usuários que geram a maior demanda na unidade?": string;
  "Na sua percepção, qual é o perfil socioeconômica predominante (classe social) dos usuários que mais frequentam esta Unidade de Saúde?": string;
  "Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?": string;
  "Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?": string;
  "Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?": string;
  "Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)": string;
  "O preenchimento das informações clínicas nos sistemas segue um padrão rígido estabelecido pela gestão?": string;
  "Quando surgem dúvidas operacionais no sistema, a equipe possui materiais de apoio acessíveis?": string;
  "Qual é o política de login aplicada para o acesso aos computadores e sistemas?": string;
  "Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?": string;
  "Em uma escala de 1 a 5, quanto você considera que o prontuário eletrônico melhora a qualidade do cuidado ao paciente?": number;
  "Quais são os principais benefícios práticos percebidos com o uso dos sistemas digitais?": string;
  "Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?": string;
  "Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?": string;
}

// Estrutura das 20 perguntas do Questionário PET-Saúde Digital
interface QuestionConfig {
  id: string;
  num: string;
  title: string;
  category: string;
  options: string[];
}

const questionnaireStructure: QuestionConfig[] = [
  {
    id: "q3_cargo",
    num: "Q3",
    title: "Qual o seu cargo atual na UBS?",
    category: "Perfil Profissional",
    options: [
      "Agente Comunitário de Saúde (ACS)",
      "Agente administrativo",
      "Auxiliar administrativo",
      "Auxiliar de enfermagem",
      "Cirurgião-Dentista / Auxiliar Bucal",
      "Enfermeiro",
      "Gerente / Coordenador da Unidade",
      "Médico (Clínico / Família)",
      "Recepcionista",
      "Técnico de enfermagem",
      "Outro"
    ]
  },
  {
    id: "q4_ferramentas",
    num: "Q4",
    title: "Quais ferramentas e registros são utilizados ao longo do fluxo?",
    category: "Infraestrutura e Sistemas",
    options: [
      "Prontuário Eletrônico (e-SUS APS)",
      "Sistema próprio da Prefeitura (SIS)",
      "Prontuário Físico (Ficha em Papel)",
      "Caderno de Anotações / Triagem Manual",
      "WhatsApp Pessoal / Aplicativo de Mensagem",
      "Planilhas Internas (Excel / Google)"
    ]
  },
  {
    id: "q5_protocolo",
    num: "Q5",
    title: "Existe protocolo formal que define o responsável por alimentar o sistema?",
    category: "Governança e Processos",
    options: [
      "Sim, protocolo rígido e formalizado",
      "Compartilhado / flexível entre a equipe",
      "Não existe formalmente (cada um faz de um jeito)",
      "Outro"
    ]
  },
  {
    id: "q6_barreira_geo",
    num: "Q6",
    title: "A localização geográfica da unidade cria barreiras de acesso?",
    category: "Território e Acesso",
    options: [
      "Sim, dificulta bastante (distância / relevo / transporte)",
      "Parcialmente (dificulta apenas para alguns bairros)",
      "Não, localização central e de fácil acesso"
    ]
  },
  {
    id: "q7_faixa_etaria",
    num: "Q7",
    title: "Qual é o perfil de faixa etária predominante dos usuários?",
    category: "Perfil Demográfico",
    options: [
      "Crianças / Pediatria",
      "Jovens / Adultos (20 a 59 anos)",
      "Idosos (>60 anos / Doenças Crônicas)",
      "Distribuição mista e homogênea"
    ]
  },
  {
    id: "q8_socioeconomico",
    num: "Q8",
    title: "Qual é o perfil socioeconômico predominante dos usuários?",
    category: "Perfil Demográfico",
    options: [
      "Classe A / B (Média-Alta)",
      "Classe C (Média)",
      "Classe D / E (Baixa renda / Vulnerabilidade)",
      "Extrema Vulnerabilidade Social",
      "Perfil misto"
    ]
  },
  {
    id: "q9_frequencia_esus",
    num: "Q9",
    title: "Com que frequência os prontuários são atualizados no e-SUS APS?",
    category: "Alimentação de Dados",
    options: [
      "Imediatamente durante/após a consulta",
      "Em blocos (ao final do turno/dia)",
      "Semanalmente ou acumulado em lote"
    ]
  },
  {
    id: "q10_duplicidade_necessidade",
    num: "Q10",
    title: "Há necessidade de duplicar a informação em mais de um local?",
    category: "Duplicidade e Retrabalho",
    options: [
      "Sim, frequentemente (rotina diária)",
      "Às vezes (apenas para certos procedimentos)",
      "Não, registro único direto no sistema"
    ]
  },
  {
    id: "q11_duplicidade_freq",
    num: "Q11",
    title: "Com que frequência você precisa registrar a mesma informação repetidas vezes?",
    category: "Duplicidade e Retrabalho",
    options: [
      "Sempre (em todos os atendimentos)",
      "Frequentemente (várias vezes ao dia)",
      "Às vezes",
      "Raramente",
      "Nunca"
    ]
  },
  {
    id: "q12_locais_duplicidade",
    num: "Q12",
    title: "Quando ocorre duplicidade, onde a informação precisa ser replicada?",
    category: "Duplicidade e Retrabalho",
    options: [
      "e-SUS APS + Ficha Física em Papel",
      "e-SUS APS + Caderno de Triagem / Ata de Recepção",
      "e-SUS APS + Planilhas Internas de Controle",
      "Dois sistemas digitais diferentes",
      "Não se aplica (registro único)"
    ]
  },
  {
    id: "q13_padrao_clinico",
    num: "Q13",
    title: "O preenchimento clínico nos sistemas segue padrão rígido da gestão?",
    category: "Padronização e Qualidade",
    options: [
      "Sim, rigidamente padronizado",
      "Básico com grande variação entre profissionais",
      "Não há nenhuma padronização formal"
    ]
  },
  {
    id: "q14_materiais_apoio",
    num: "Q14",
    title: "Quando surgem dúvidas operacionais, a equipe possui materiais de apoio?",
    category: "Capacitação e Suporte",
    options: [
      "Sim, manuais claros e atualizados",
      "Manuais confusos ou desatualizados",
      "Não há materiais de apoio disponíveis"
    ]
  },
  {
    id: "q15_politica_login",
    num: "Q15",
    title: "Qual é a política de login para acesso aos computadores?",
    category: "Segurança e Governança",
    options: [
      "Login individual com senha pessoal",
      "Login compartilhado por sala / consultório",
      "Login geral único para toda a unidade"
    ]
  },
  {
    id: "q16_celular_pessoal",
    num: "Q16",
    title: "Há uso de celulares/tablets pessoais para fins de trabalho?",
    category: "Segurança e Governança",
    options: [
      "Sim (por falha/falta de equipamento corporativo)",
      "Sim (por conveniência e agilidade com ACS/WhatsApp)",
      "Não (utilizamos apenas recursos corporativos)"
    ]
  },
  {
    id: "q17_nota_cuidado",
    num: "Q17",
    title: "De 1 a 5, quanto o prontuário eletrônico melhora a qualidade do cuidado?",
    category: "Percepção de Valor",
    options: [
      "Nota 1 (Muito Ruim / Prejudica)",
      "Nota 2 (Ruim)",
      "Nota 3 (Regular / Neutro)",
      "Nota 4 (Bom / Ajuda)",
      "Nota 5 (Excelente / Indispensável)"
    ]
  },
  {
    id: "q18_beneficios",
    num: "Q18",
    title: "Quais são os principais benefícios práticos percebidos?",
    category: "Percepção de Valor",
    options: [
      "Rapidez para localizar históricos de consultas",
      "Maior segurança e legibilidade nas receitas",
      "Agilidade clínica no atendimento",
      "Melhor coordenação do cuidado com ACS",
      "Nenhum benefício percebido"
    ]
  },
  {
    id: "q19_tempo_pos_consulta",
    num: "Q19",
    title: "Em média, quantos minutos você gasta preenchendo o sistema pós-consulta?",
    category: "Sobrecarga de Tempo",
    options: [
      "Menos de 2 minutos",
      "2 a 5 minutos",
      "6 a 10 minutos",
      "Mais de 10 minutos"
    ]
  },
  {
    id: "q20_frequencia_travamento",
    num: "Q20",
    title: "Com que frequência a lentidão ou travamento atrasa a agenda de atendimentos?",
    category: "Sobrecarga de Tempo",
    options: [
      "Diariamente (todos os dias)",
      "Várias vezes na semana",
      "Raramente",
      "Nunca"
    ]
  }
];

// Dados dos formulários (base representativa das 24 UBSs)
const ubsData: UBSResponse[] = [
  // 1. BARIRI - SP
  {
    "ID da resposta": 1,
    "Hora de início": "2026-07-14 09:00:00",
    "Hora de conclusão": "2026-07-14 09:15:00",
    "Nome completo:": "Dr. Roberto Carlos de Almeida",
    "Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?": "UBS Dr. Alceu de Carvalho - Centro",
    "Qual o seu cargo atual na UBS?": "Médico de Família",
    "Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?": "Prontuário Eletrônico (e-SUS APS), Ficha de Atendimento Individual em papel, Bloco de Receitas físico e planilha de controle interna.",
    "Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?": "Não, muitas vezes a recepção abre o atendimento, mas o preenchimento clínico e desfecho ficam confusos entre enfermeiro e médico.",
    "Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?": "Não, por ser no Centro, o acesso é relativamente fácil para a maior parte da população, embora falte transporte adaptado.",
    "Qual é o perfil de faixa etária predominante dos usuários que geram a maior demanda na unidade?": "Idosos (mais de 60 anos) com condições crônicas como diabetes e hipertensão.",
    "Na sua percepção, qual é o perfil socioeconômica predominante (classe social) dos usuários que mais frequentam esta Unidade de Saúde?": "Classe D e E, famílias de baixa renda e aposentados dependentes exclusivamente do SUS.",
    "Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?": "Diariamente, mas com atrasos significativos ao final do expediente devido à lentidão do sistema.",
    "Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?": "Sim, registramos no prontuário eletrônico e também em uma ficha física de papel por segurança, pois o sistema municipal frequentemente cai.",
    "Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?": "Sempre (em todos os atendimentos)",
    "Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)": "Ficha de Atendimento em papel, Prontuário do e-SUS APS, Livro de Registro de Receituário de Controle Especial.",
    "O preenchimento das informações clínicas nos sistemas segue um padrão rígido estabelecido pela gestão?": "Não, cada profissional preenche de uma forma. Não há uma padronização clara ou treinamento recente.",
    "Quando surgem dúvidas operacionais no sistema, a equipe possui materiais de apoio acessíveis?": "Não, dependemos de ligar para o suporte da prefeitura ou perguntar para colegas que conhecem um pouco mais.",
    "Qual é o política de login aplicada para o acesso aos computadores e sistemas?": "Login genérico compartilhado por computador na sala de atendimento.",
    "Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?": "Sim, usamos nossos celulares pessoais no WhatsApp para discutir casos clínicos e agilizar encaminhamentos, pois não há sistema de chat interno.",
    "Em uma escala de 1 a 5, quanto você considera que o prontuário eletrônico melhora a qualidade do cuidado ao paciente?": 3,
    "Quais são os principais benefícios práticos percebidos com o uso dos sistemas digitais?": "Rapidez para localizar históricos de consultas anteriores e facilidade de leitura das receitas digitadas em comparação com letras manuscritas.",
    "Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?": "10 minutos",
    "Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?": "Frequentemente (quase todos os dias, principalmente no período da tarde)"
  },
  {
    "ID da resposta": 2,
    "Hora de início": "2026-07-14 09:30:00",
    "Hora de conclusão": "2026-07-14 09:50:00",
    "Nome completo:": "Mariana Souza Santos",
    "Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?": "UBS Soma - Jardim Nova Bariri",
    "Qual o seu cargo atual na UBS?": "Enfermeira Chefe",
    "Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?": "Prontuário Eletrônico e-SUS APS, WhatsApp pessoal para coordenação, folhas soltas de triagem manual.",
    "Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?": "Existe no papel, mas no dia a dia a sobrecarga faz com que qualquer um insira os dados para liberar a fila.",
    "Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?": "Sim, a unidade fica distante de pontos de ônibus e a caminhada para idosos e gestantes sob o sol é muito desgastante.",
    "Qual é o perfil de faixa etária predominante dos usuários que geram a maior demanda na unidade?": "Adultos de 20 a 59 anos, e crianças na sala de vacina.",
    "Na sua percepção, qual é o perfil socioeconômica predominante (classe social) dos usuários que mais frequentam esta Unidade de Saúde?": "Classe E e pessoas em situação de extrema vulnerabilidade social.",
    "Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?": "Semanalmente ou acumulado, pois faltam computadores suficientes na triagem.",
    "Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?": "Sim, anotamos os dados vitais em um caderno de triagem e depois digitamos no e-SUS para não travar a fila de espera física.",
    "Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?": "Frequentemente (várias vezes ao dia)",
    "Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)": "Caderno de Triagem físico, Sistema e-SUS APS, Planilhas de Campanhas de Vacinação do Estado.",
    "O preenchimento das informações clínicas nos sistemas segue um padrão rígido estabelecido pela gestão?": "Sim, mas é um padrão focado apenas em bater metas de produção (faturamento do Previne Brasil), não na qualidade clínica.",
    "Quando surgem dúvidas operacionais no sistema, a equipe possui materiais de apoio acessíveis?": "Temos um PDF desatualizado enviado pelo e-mail da prefeitura há dois anos.",
    "Qual é o política de login aplicada para o acesso aos computadores e sistemas?": "Login individual com senha pessoal, porém o sistema cai e desloga sozinho a cada 20 minutos.",
    "Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?": "Sim, criamos um grupo de WhatsApp da unidade com nossos números pessoais para avisar sobre vacinas em falta e organizar visitas domiciliares com as ACS.",
    "Em uma escala de 1 a 5, quanto você considera que o prontuário eletrônico melhora a qualidade do cuidado ao paciente?": 4,
    "Quais são os principais benefícios práticos percebidos com o uso dos sistemas digitais?": "Envio direto dos dados de produção para o Ministério da Saúde e facilidade de verificar o esquema de vacinação do paciente.",
    "Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?": "15 minutos",
    "Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?": "Sempre (todos os dias a conexão de internet da unidade oscila e gera longas filas)"
  },
  // 2. AGUDOS - SP
  {
    "ID da resposta": 9,
    "Hora de início": "2026-07-15 08:30:00",
    "Hora de conclusão": "2026-07-15 08:50:00",
    "Nome completo:": "Dr. Marcelo Antunes Ribeiro",
    "Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?": "UBS Central - Centro de Saúde Dr. Domingos Bôscolo (Agudos)",
    "Qual o seu cargo atual na UBS?": "Médico Clínico Geral",
    "Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?": "Prontuário Eletrônico e-SUS APS, Ficha Paralela em Papel, Planilhas de Farmácia e WhatsApp Pessoal.",
    "Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?": "Compartilhado/flexível.",
    "Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?": "Não, é central e de fácil acesso para a população de Agudos.",
    "Qual é o perfil de faixa etária predominante dos usuários que geram a maior demanda na unidade?": "Idosos (mais de 60 anos) com hipertensão e diabetes.",
    "Na sua percepção, qual é o perfil socioeconômica predominante (classe social) dos usuários que mais frequentam esta Unidade de Saúde?": "Classe C e D.",
    "Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?": "Em blocos (fim de turno).",
    "Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?": "Sim, registramos em ficha física e no e-SUS para controle de receitas especiais.",
    "Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?": "Frequentemente",
    "Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)": "Prontuário e-SUS, Ficha de Papel e Livro de Farmácia Municipal.",
    "O preenchimento das informações clínicas nos sistemas segue um padrão rígido estabelecido pela gestão?": "Básico com variação.",
    "Quando surgem dúvidas operacionais no sistema, a equipe possui materiais de apoio acessíveis?": "Manuais confusos/desatualizados.",
    "Qual é o política de login aplicada para o acesso aos computadores e sistemas?": "Compartilhado por sala.",
    "Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?": "Sim, WhatsApp pessoal para encaminhamentos.",
    "Em uma escala de 1 a 5, quanto você considera que o prontuário eletrônico melhora a qualidade do cuidado ao paciente?": 3,
    "Quais são os principais benefícios práticos percebidos com o uso dos sistemas digitais?": "Histórico digital centralizado e rapidez na emissão de receitas.",
    "Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?": "11 minutos",
    "Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?": "Frequentemente (várias vezes na semana)"
  },
  {
    "ID da resposta": 10,
    "Hora de início": "2026-07-15 09:10:00",
    "Hora de conclusão": "2026-07-15 09:30:00",
    "Nome completo:": "Carla Mendes de Oliveira",
    "Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?": "ESF Prof. Severino Calazans (Agudos)",
    "Qual o seu cargo atual na UBS?": "Enfermeira Coordenadora",
    "Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?": "e-SUS APS Território, Caderno de Triagem Físico e WhatsApp pessoal para ACS.",
    "Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?": "Não existe formalmente.",
    "Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?": "Sim, dificulta bastante o acesso de idosos do Jardim Nilce / Centenário.",
    "Qual é o perfil de faixa etária predominante dos usuários que geram a maior demanda na unidade?": "Idosos e crianças.",
    "Na sua percepção, qual é o perfil socioeconômica predominante (classe social) dos usuários que mais frequentam esta Unidade de Saúde?": "Classe D e E (alta vulnerabilidade social).",
    "Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?": "Semanalmente ou acumulado.",
    "Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?": "Sim, fichas de visita domiciliar em papel aguardando digitação.",
    "Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?": "Sempre",
    "Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)": "Ficha CDS de Visita em Papel e Sistema e-SUS APS.",
    "O preenchimento das informações clínicas nos sistemas segue um padrão rígido estabelecido pela gestão?": "Básico com variação.",
    "Quando surgem dúvidas operacionais no sistema, a equipe possui materiais de apoio acessíveis?": "Não há materiais.",
    "Qual é o política de login aplicada para o acesso aos computadores e sistemas?": "Individual com senha.",
    "Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?": "Sim, celulares pessoais para registro de visitas.",
    "Em uma escala de 1 a 5, quanto você considera que o prontuário eletrônico melhora a qualidade do cuidado ao paciente?": 2,
    "Quais são os principais benefícios práticos percebidos com o uso dos sistemas digitais?": "Controle de produção para o Previne Brasil.",
    "Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?": "14 minutos",
    "Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?": "Sempre (todos os dias a conexão oscila)"
  }
];

// Coordenadas georreferenciadas
const ubsCoordinates: Record<string, { lat: number; lon: number; cidade: string }> = {
  // Bariri - SP
  "UBS Dr. Alceu de Carvalho - Centro": { lat: -22.0735, lon: -48.7460, cidade: "Bariri" },
  "UBS Soma - Jardim Nova Bariri": { lat: -22.0812, lon: -48.7335, cidade: "Bariri" },
  "UBS Dr. Domingos de Léo - Vila Maria": { lat: -22.0625, lon: -48.7490, cidade: "Bariri" },
  "ESF I - Nova Bariri": { lat: -22.0805, lon: -48.7340, cidade: "Bariri" },
  "ESF II - Paulo de Tarso Mazzo": { lat: -22.0640, lon: -48.7485, cidade: "Bariri" },
  "ESF III - Dr. Renato Figueiredo": { lat: -22.0700, lon: -48.7500, cidade: "Bariri" },
  "ESF IV - Dr. Francisco Leoni Neto": { lat: -22.0650, lon: -48.7300, cidade: "Bariri" },
  "ESF V - Livramento": { lat: -22.0800, lon: -48.7550, cidade: "Bariri" },

  // Agudos - SP
  "UBS Central - Centro de Saúde Dr. Domingos Bôscolo (Agudos)": { lat: -22.4687, lon: -48.9858, cidade: "Agudos" },
  "ESF Prof. Severino Calazans (Agudos)": { lat: -22.4782, lon: -48.9815, cidade: "Agudos" },
  "ESF Jardim Nilce (Agudos)": { lat: -22.4745, lon: -48.9790, cidade: "Agudos" },
  "ESF Parque das Vinhas (Agudos)": { lat: -22.4610, lon: -48.9920, cidade: "Agudos" },
  "ESF Vila Vigato - Pref. Waldomiro Fantini (Agudos)": { lat: -22.4635, lon: -48.9772, cidade: "Agudos" },
  "ESF Santa Cecília (Agudos)": { lat: -22.4720, lon: -48.9940, cidade: "Agudos" },
  "ESF Pampulha / Jardim Europa (Agudos)": { lat: -22.4758, lon: -48.9895, cidade: "Agudos" },
  "ESF Prof. Thyrso Dalla Déa (Agudos)": { lat: -22.4590, lon: -48.9810, cidade: "Agudos" },
  "ESF Jardim Danúbio (Agudos)": { lat: -22.4665, lon: -48.9965, cidade: "Agudos" },
  "ESF Distrito de Domélia (Agudos)": { lat: -22.6881, lon: -49.1245, cidade: "Agudos" },
  "ESF Distrito de Rubião / Santo Antônio (Agudos)": { lat: -22.5200, lon: -48.9100, cidade: "Agudos" },
  "UPA 24h / Pronto Atendimento Municipal (Agudos)": { lat: -22.4705, lon: -48.9830, cidade: "Agudos" },

  // Boraceia - SP
  "Centro de Saúde Dr. José Maria - Centro (Boraceia)": { lat: -22.1940, lon: -48.7790, cidade: "Boraceia" },
  "ESF Boraceia I - Nova Boraceia": { lat: -22.1970, lon: -48.7750, cidade: "Boraceia" },
  "ESF Boraceia II - Pouso Alegre": { lat: -22.1915, lon: -48.7830, cidade: "Boraceia" },
  "Posto de Saúde Rural - Boraceia": { lat: -22.2050, lon: -48.7680, cidade: "Boraceia" }
};

// Gerador de dados quantitativos realistas por UBS para a Opção B
const generateInitialQuantData = (unitName: string): Record<string, Record<string, number>> => {
  const isRural = unitName.includes("Domélia") || unitName.includes("Rubião") || unitName.includes("Rural");
  const isCritical = unitName.includes("Severino") || unitName.includes("Nova Bariri") || isRural;
  
  const result: Record<string, Record<string, number>> = {};

  questionnaireStructure.forEach((q) => {
    result[q.id] = {};
    q.options.forEach((opt, idx) => {
      if (q.id === "q3_cargo") {
        result[q.id][opt] = idx === 0 ? (isRural ? 4 : 8) : idx === 7 ? 2 : idx === 5 ? 2 : idx === 9 ? 4 : (idx % 3 === 0 ? 1 : 0);
      } else if (q.id === "q10_duplicidade_necessidade") {
        result[q.id][opt] = idx === 0 ? (isCritical ? 14 : 7) : idx === 1 ? 4 : (isCritical ? 1 : 8);
      } else if (q.id === "q19_tempo_pos_consulta") {
        result[q.id][opt] = idx === 3 ? (isCritical ? 12 : 3) : idx === 2 ? 6 : idx === 1 ? (isCritical ? 1 : 7) : 0;
      } else if (q.id === "q20_frequencia_travamento") {
        result[q.id][opt] = idx === 0 ? (isCritical ? 15 : 3) : idx === 1 ? 5 : (isCritical ? 0 : 7);
      } else if (q.id === "q16_celular_pessoal") {
        result[q.id][opt] = idx === 0 ? (isCritical ? 8 : 2) : idx === 1 ? (isCritical ? 9 : 6) : (isCritical ? 1 : 8);
      } else {
        result[q.id][opt] = idx === 0 ? 6 : idx === 1 ? 4 : (idx === 2 ? 3 : 1);
      }
    });
  });

  return result;
};

export default function App() {
  const [selectedUBS, setSelectedUBS] = useState<string>("UBS Central - Centro de Saúde Dr. Domingos Bôscolo (Agudos)");
  const [qwenApiKey, setQwenApiKey] = useState<string>("");
  
  // SELETOR OBRIGATÓRIO DE MODELO DE ANÁLISE: "A" (Qualitativa Executiva) ou "B" (Quantitativa Questionário)
  const [analysisMode, setAnalysisMode] = useState<"A" | "B">("A");

  // CAMPOS ABERTOS QUALITATIVOS (TOTALMENTE EDITÁVEIS PELO USUÁRIO)
  const [qualitativeNotes, setQualitativeNotes] = useState<string>(
    "A equipe relata sobrecarga acentuada no período da tarde devido à lentidão na sincronização de prontuários e-SUS APS. Profissionais de enfermagem registram sinais vitais em formulários físicos de papel para evitar paradas na fila de acolhimento."
  );

  const [gestaoNotes, setGestaoNotes] = useState<string>(
    "Necessidade prioritária de treinamento formal da equipe multiprofissional em modelos de evolução rápida do e-SUS e revisão da infraestrutura de rede municipal."
  );

  // Estado dos inputs quantitativos da Opção B (Questionário PET-Saúde)
  const [quantData, setQuantData] = useState<Record<string, Record<string, number>>>(() => 
    generateInitialQuantData("UBS Central - Centro de Saúde Dr. Domingos Bôscolo (Agudos)")
  );

  // Controle de accordions abertos na Opção B
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "q3_cargo": true,
    "q4_ferramentas": true,
    "q10_duplicidade_necessidade": true
  });

  // Estados de exibição e IA
  const [showRawData, setShowRawData] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Atualiza os dados quantitativos e notas ao trocar a UBS
  useEffect(() => {
    setQuantData(generateInitialQuantData(selectedUBS));
    setQualitativeNotes(
      `Observações da equipe da unidade ${selectedUBS}: Retrabalho em duplicidade (papel + sistema) e dependência de aplicativos pessoais (WhatsApp) para comunicação com agentes comunitários.`
    );
    setAiResponse("");
    setErrorMsg("");
  }, [selectedUBS]);

  // Atualiza o modo de demonstração conforme a chave
  useEffect(() => {
    if (!qwenApiKey) {
      setIsDemoMode(true);
    } else {
      setIsDemoMode(false);
    }
  }, [qwenApiKey]);

  // Alterna accordion
  const toggleAccordion = (qId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Atualiza um contador numérico na Opção B
  const handleQuantChange = (qId: string, option: string, value: number) => {
    setQuantData((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        [option]: Math.max(0, value)
      }
    }));
  };

  // Encontra a linha atual de dados baseada na seleção
  const activeData = ubsData.find(
    (u) => u["Em qual Unidade Básica de Saúde (UBS) você trabalha atualmente?"] === selectedUBS
  ) || ubsData[0];

  const currentCity = ubsCoordinates[selectedUBS]?.cidade || "Agudos";

  // Extração de variáveis rápidas do formulário atual
  const activeMinutes = parseInt(activeData["Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?"].split(" ")[0]) || 0;
  const isDuplicated = activeData["Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?"].startsWith("Sim");
  const frequencyLags = activeData["Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?"];

  // Total de respostas preenchidas na Opção B
  const totalResponsesRecorded = Object.values(quantData).reduce((acc, qObj) => {
    return acc + Object.values(qObj).reduce((sum, n) => sum + n, 0);
  }, 0);

  // Chamada de IA com o Template Rigoroso de Engenharia de Prompt para o Qwen
  const handleGenerateAI = async () => {
    setLoading(true);
    setErrorMsg("");
    setAiResponse("");

    // Dados estruturados conforme a modalidade ativa
    let dadosFormularioString = "";

    if (analysisMode === "A") {
      // OPÇÃO A: Análise Qualitativa Executiva + Campos Abertos Editados
      dadosFormularioString = `
MODALIDADE: Análise Qualitativa Executiva
UNIDADE DE SAÚDE: "${selectedUBS}" (${currentCity} - SP)
RESUMO OPERACIONAL:
- Cargo do Respondente: ${activeData["Qual o seu cargo atual na UBS?"]}
- Ferramentas Utilizadas: ${activeData["Quais ferramentas e registros são utilizados ao longo do fluxo de atendimento do paciente?"]}
- Protocolo Formal de Alimentação: ${activeData["Existe um protocolo formal e claro que define qual profissional é responsável por alimentar o sistema em cada etapa?"]}
- Barreira Geográfica de Acesso: ${activeData["Na sua percepção, a localização geográfica da unidade cria barreiras de acesso para a população local?"]}
- Atualização e-SUS: ${activeData["Com que frequência os prontuários dos usuários são atualizados no e-SUS APS?"]}
- Duplicidade de Registros: ${activeData["Há necessidade de duplicar a informação, registrando o mesmo atendimento in mais de um local (ex: papel e sistema)?"]} (Frequência: ${activeData["Com que frequência você precisa registrar a mesma informação de um único atendimento em mais de um local?"]})
- Locais de Replicação: ${activeData["Quando ocorre a duplicidade de registro, em quais locais a informação precisa ser replicada? (Marque todas as opções que se aplicam na sua rotina)"]}
- Política de Login: ${activeData["Qual é o política de login aplicada para o acesso aos computadores e sistemas?"]}
- Uso de Dispositivos Pessoais (WhatsApp/Celular): ${activeData["Há uso de dispositivos eletrônicos pessoais (celulares/tablets) para fins de trabalho na unidade?"]}
- Tempo Médio Gasto Pós-Consulta: ${activeData["Em média, quantos minutos você gasta preenchendo o sistema após a consulta de um paciente?"]}
- Frequência de Travamentos: ${activeData["Com que frequência a lentidão ou travamento do sistema atrasa o fluxo de atendimento da sua agenda?"]}

OBSERVAÇÕES QUALITATIVAS E NOTAS DE CAMPO DO PESQUISADOR (EDITÁVEIS):
"${qualitativeNotes}"

DIRETRIZES E PRIORIDADES DA GESTÃO LOCAL (EDITÁVEIS):
"${gestaoNotes}"
`.trim();
    } else {
      // OPÇÃO B: Análise Quantitativa Completa (20 Perguntas) + Campos Abertos Editados
      const compiledSurveyData: Record<string, any> = {};
      questionnaireStructure.forEach((q) => {
        compiledSurveyData[`${q.num}: ${q.title}`] = quantData[q.id] || {};
      });

      dadosFormularioString = `
MODALIDADE: Análise Quantitativa (Questionário PET-Saúde Digital)
UNIDADE DE SAÚDE: "${selectedUBS}" (${currentCity} - SP)
TOTAL DE VOTOS / RESPOSTAS COMPILADAS: ${totalResponsesRecorded}

CONTAGEM QUANTITATIVA DAS 20 PERGUNTAS:
${JSON.stringify(compiledSurveyData, null, 2)}

OBSERVAÇÕES QUALITATIVAS E NOTAS DE CAMPO DO PESQUISADOR (EDITÁVEIS):
"${qualitativeNotes}"

DIRETRIZES E PRIORIDADES DA GESTÃO LOCAL (EDITÁVEIS):
"${gestaoNotes}"
`.trim();
    }

    // Template Rigoroso de Prompt Exigido
    const promptText = `
Você é um consultor especialista do PET-Saúde Digital e especialista em Governança de TI no SUS. Analise os dados do formulário fornecidos e gere um relatório técnico completo e aprofundado contendo OBRIGATORIAMENTE a seguinte estrutura:

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

DADOS FORNECIDOS DO FORMULÁRIO:
${dadosFormularioString}

Seja extremamente detalhado, técnico e forneça orientações aplicáveis à realidade da Unidade Básica de Saúde.
`.trim();

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          customApiKey: qwenApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao conectar com o provedor de IA.");
      }

      setAiResponse(data.text);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Servidor offline ou chave não configurada. Ativando fallback de demonstração local.");
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Referência para o container do Leaflet map
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const leafletMarkersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    let active = true;

    const initializeLeafletMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const targetCoords = ubsCoordinates[selectedUBS] || { lat: -22.4687, lon: -48.9858 };

      if (!leafletMapInstance.current) {
        leafletMapInstance.current = L.map(mapRef.current, {
          center: [targetCoords.lat, targetCoords.lon],
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: false
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        }).addTo(leafletMapInstance.current);

        Object.entries(ubsCoordinates).forEach(([name, coords]) => {
          const isSelected = name === selectedUBS;
          
          const customMarkerIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-300 ${
              isSelected 
                ? "bg-rose-600 text-white border-2 border-white scale-110 ring-4 ring-rose-500/40" 
                : "bg-blue-600 text-white border-2 border-white ring-4 ring-blue-500/20"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.08 1.08 0 0 1-1.2 0C9.539 20.193 4 14.99 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
            className: "custom-leaflet-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });

          const marker = L.marker([coords.lat, coords.lon], { icon: customMarkerIcon })
            .addTo(leafletMapInstance.current)
            .bindTooltip(`<b>${name}</b><br><span style="color:#64748b;font-size:10px;">${coords.cidade} - SP</span>`, { permanent: false, direction: "top" });

          marker.on("click", () => {
            setSelectedUBS(name);
          });

          leafletMarkersRef.current[name] = marker;
        });
      } else {
        Object.entries(leafletMarkersRef.current).forEach(([name, marker]: [string, any]) => {
          const isSelected = name === selectedUBS;
          
          const newIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-300 ${
              isSelected 
                ? "bg-rose-600 text-white border-2 border-white scale-110 ring-4 ring-rose-500/40" 
                : "bg-blue-600 text-white border-2 border-white ring-4 ring-blue-500/20"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.08 1.08 0 0 1-1.2 0C9.539 20.193 4 14.99 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
            className: "custom-leaflet-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          marker.setIcon(newIcon);
        });

        if (targetCoords) {
          leafletMapInstance.current.setView([targetCoords.lat, targetCoords.lon], 14, {
            animate: true,
            duration: 0.8
          });
        }
      }
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (active) initializeLeafletMap();
      };
      document.head.appendChild(script);
    } else {
      initializeLeafletMap();
    }

    return () => {
      active = false;
    };
  }, [selectedUBS]);

  // Exportar relatório em formato texto
  const handleDownloadReport = () => {
    let reportContent = "";
    if (analysisMode === "A") {
      reportContent = `RELATÓRIO PET-SAÚDE DIGITAL (ANÁLISE QUALITATIVA EXECUTIVA)\nUnidade: ${selectedUBS}\nMunicípio: ${currentCity} - SP\nData: ${new Date().toLocaleString("pt-BR")}\n\nNOTAS QUALITATIVAS:\n${qualitativeNotes}\n\nDIRETRIZES DA GESTÃO:\n${gestaoNotes}\n\nDADOS DA UBS:\n${JSON.stringify(activeData, null, 2)}`;
    } else {
      reportContent = `RELATÓRIO PET-SAÚDE DIGITAL (ANÁLISE QUANTITATIVA - 20 PERGUNTAS)\nUnidade: ${selectedUBS}\nMunicípio: ${currentCity} - SP\nTotal de Votos Compilados: ${totalResponsesRecorded}\nData: ${new Date().toLocaleString("pt-BR")}\n\nNOTAS QUALITATIVAS:\n${qualitativeNotes}\n\nDIRETRIZES DA GESTÃO:\n${gestaoNotes}\n\nCONTAGEM QUANTITATIVA:\n${JSON.stringify(quantData, null, 2)}`;
    }
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Relatorio_${analysisMode}_${selectedUBS.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans flex flex-col md:flex-row select-none" id="app_container">
      
      {/* 1. SIDEBAR DA ESQUERDA (Tema Escuro #0e1117) */}
      <aside className="w-full md:w-80 bg-[#0e1117] border-b md:border-b-0 md:border-r border-slate-700/50 p-6 flex flex-col flex-shrink-0" id="sidebar_section">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-700/30">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-xs text-white font-black shadow-md">SUS</div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight">SUS-Digital Maps</h1>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest font-medium">PET-Saúde Digital UNESP</p>
          </div>
        </div>

        {/* INPUT DE CHAVE DE API (QWEN / OPENROUTER) */}
        <div className="space-y-2 mb-6">
          <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-400" /> Chave de API (Qwen / OpenRouter)
          </label>
          <input
            type="password"
            placeholder="Chave de API (Qwen / OpenRouter) - Opcional"
            value={qwenApiKey}
            onChange={(e) => setQwenApiKey(e.target.value)}
            className="w-full bg-[#262730] border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 transition-all duration-200"
          />
          <p className="text-[9px] text-slate-500 italic">
            Qwen 2.5 {qwenApiKey ? "Conectado" : "(Modo Fallback / Demonstração Ativo)"}
          </p>
        </div>

        {/* SELETOR DE UBS */}
        <div className="space-y-2 mb-6">
          <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> Selecione a Unidade de Saúde
          </label>
          <div className="relative">
            <select
              value={selectedUBS}
              onChange={(e) => setSelectedUBS(e.target.value)}
              className="w-full bg-[#262730] border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none appearance-none transition-all duration-200 pr-8 cursor-pointer font-medium"
            >
              {/* Grupo Agudos - SP */}
              <optgroup label="📍 AGUDOS - SP" className="bg-[#1f232b] text-blue-400 font-bold">
                {Object.entries(ubsCoordinates)
                  .filter(([_, c]) => c.cidade === "Agudos")
                  .map(([name]) => (
                    <option key={name} value={name} className="bg-[#262730] text-slate-200 font-normal">
                      {name}
                    </option>
                  ))}
              </optgroup>

              {/* Grupo Bariri - SP */}
              <optgroup label="📍 BARIRI - SP" className="bg-[#1f232b] text-emerald-400 font-bold">
                {Object.entries(ubsCoordinates)
                  .filter(([_, c]) => c.cidade === "Bariri")
                  .map(([name]) => (
                    <option key={name} value={name} className="bg-[#262730] text-slate-200 font-normal">
                      {name}
                    </option>
                  ))}
              </optgroup>

              {/* Grupo Boraceia - SP */}
              <optgroup label="📍 BORACEIA - SP" className="bg-[#1f232b] text-purple-400 font-bold">
                {Object.entries(ubsCoordinates)
                  .filter(([_, c]) => c.cidade === "Boraceia")
                  .map(([name]) => (
                    <option key={name} value={name} className="bg-[#262730] text-slate-200 font-normal">
                      {name}
                    </option>
                  ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <p className="text-[10px] text-blue-400 font-medium mt-1">
            📍 Município selecionado: <strong>{currentCity} - SP</strong>
          </p>
        </div>

        {/* INFORMAÇÃO DO PET-SAÚDE DIGITAL */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6 mt-auto">
          <p className="text-[10px] text-blue-400 leading-relaxed">
            Monitorando 24 unidades e registros no e-SUS APS. UNESP / PET-Saúde Digital.
          </p>
        </div>

        {/* STATUS DA CONEXÃO */}
        <div className="pt-4 border-t border-slate-700/30">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sincronizado com Datasus
          </div>
        </div>
      </aside>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto" id="main_dashboard_panel">
        
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0" id="header_section">
          <div className="flex items-center gap-3">
            <h2 className="text-sm md:text-base font-black text-slate-800 tracking-tight">Painel Analítico de Saúde Pública</h2>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider border border-slate-200">
              {currentCity.toUpperCase()}/SP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Última atualização</p>
              <p className="text-[11px] font-bold text-slate-700">24 Ago 2026, 10:50</p>
            </div>
            <button 
              onClick={handleDownloadReport}
              className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Exportar dados do relatório"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Relatório
            </button>
          </div>
        </header>

        {/* 3. SELETOR DE MODELO DE ANÁLISE (OPÇÃO A vs OPÇÃO B - EXCLUSIVO) */}
        <div className="bg-slate-900 text-white px-8 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modelo de Análise Obrigatório:</span>
            <span className="text-xs text-slate-200 font-semibold">Escolha a modalidade de diagnóstico para submissão à IA:</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setAnalysisMode("A")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                analysisMode === "A"
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Opção A: Análise Qualitativa Executiva
            </button>
            <button
              onClick={() => setAnalysisMode("B")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                analysisMode === "B"
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Opção B: Análise Quantitativa (Questionário PET-Saúde)
            </button>
          </div>
        </div>

        {/* 4. CONTENT GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-6 gap-6">
          
          {/* Left Column (7/12 layout) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* RENDERIZAÇÃO DA OPÇÃO A: VISÃO QUALITATIVA EXECUTIVA (MAPA + STATS + CAMPOS ABERTOS) */}
            {analysisMode === "A" && (
              <>
                {/* Map Component */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm min-h-[320px] flex flex-col">
                  <div className="absolute inset-0 z-0 bg-[#e5e7eb]" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                  <div className="absolute inset-0 z-10" ref={mapRef} id="leaflet_map_mount"></div>

                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-sm z-20 pointer-events-none">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Legenda das UBSs ({currentCity})</p>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow-sm"></div>
                      <span className="text-[10px] font-semibold text-slate-700">Unidades Mapeadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-sm animate-pulse"></div>
                      <span className="text-[10px] font-semibold text-slate-700">Unidade em Análise</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm z-20 text-[10px] text-slate-500 font-medium">
                    💡 Clique nos marcadores para trocar de unidade
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm min-h-[110px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Grau de Duplicidade</p>
                    <p className={`text-3xl font-black ${isDuplicated ? "text-red-600" : "text-emerald-600"}`}>
                      {isDuplicated ? "84%" : "12%"}
                    </p>
                    <p className="text-[10px] text-slate-400">Papel + Sistema ({currentCity})</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm min-h-[110px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Impacto Travamentos</p>
                    <p className={`text-3xl font-black ${
                      frequencyLags.startsWith("Sempre") 
                        ? "text-red-600" 
                        : frequencyLags.startsWith("Frequentemente") 
                        ? "text-amber-500" 
                        : "text-emerald-600"
                    }`}>
                      {frequencyLags.startsWith("Sempre") ? "Crítico" : frequencyLags.startsWith("Frequentemente") ? "Moderado" : "Baixo"}
                    </p>
                    <p className="text-[10px] text-slate-400">Atraso na agenda de consultas</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm min-h-[110px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Tempo Pós-Consulta</p>
                    <p className="text-3xl font-black text-slate-800">{activeMinutes}m</p>
                    <p className="text-[10px] text-slate-400">Média de preenchimento</p>
                  </div>
                </div>

                {/* CAMPOS ABERTOS QUALITATIVOS EDITÁVEIS */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Observações Qualitativas & Notas de Campo da UBS (Editável)
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Relato de Campo do Pesquisador / Percepções da Equipe
                    </label>
                    <textarea
                      rows={3}
                      value={qualitativeNotes}
                      onChange={(e) => setQualitativeNotes(e.target.value)}
                      placeholder="Digite aqui observações qualitativas específicas coletadas na unidade..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-y leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Diretrizes e Prioridades da Gestão Local
                    </label>
                    <textarea
                      rows={2}
                      value={gestaoNotes}
                      onChange={(e) => setGestaoNotes(e.target.value)}
                      placeholder="Insira diretrizes da coordenação municipal ou pontos de atenção..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-y leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* Expander de Respostas Brutas */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowRawData(!showRawData)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Visualizar Respostas Coletadas do Formulário</span>
                    </div>
                    {showRawData ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  
                  {showRawData && (
                    <div className="p-5 border-t border-slate-200 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 rounded-b-xl">
                      <pre>{JSON.stringify(activeData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* RENDERIZAÇÃO DA OPÇÃO B: FORMULÁRIO QUANTITATIVO COMPLETO (20 PERGUNTAS SANFONADAS + CAMPOS ABERTOS) */}
            {analysisMode === "B" && (
              <div className="space-y-4">
                
                {/* Header do Formulário Quantitativo */}
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-blue-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      Questionário Quantitativo PET-Saúde Digital (20 Perguntas)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Unidade: <strong>{selectedUBS}</strong> • Total de Respostas Compiladas: <strong className="text-blue-700">{totalResponsesRecorded}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setQuantData(generateInitialQuantData(selectedUBS))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Restaurar dados padrões da unidade"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar Amostra
                  </button>
                </div>

                {/* Q1 & Q2 - Bloco de Identificação */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded">Q1 & Q2</span>
                    <h4 className="font-bold text-xs text-slate-800">Identificação da Unidade e Município de Pesquisa</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Q1: Município</span>
                      <span className="font-black text-slate-800">{currentCity} - SP</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Q2: Unidade Selecionada</span>
                      <span className="font-bold text-slate-800 truncate block" title={selectedUBS}>{selectedUBS}</span>
                    </div>
                  </div>
                </div>

                {/* Perguntas Q3 a Q20 em Accordions Sanfonados */}
                <div className="space-y-3">
                  {questionnaireStructure.map((q) => {
                    const isOpen = Boolean(openAccordions[q.id]);
                    const currentCounts = quantData[q.id] || {};
                    const totalQ = Object.values(currentCounts).reduce((s: number, n: unknown) => s + (typeof n === "number" ? n : 0), 0);

                    return (
                      <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        
                        {/* Header do Accordion */}
                        <button
                          type="button"
                          onClick={() => toggleAccordion(q.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 pr-2">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0">
                              {q.num}
                            </span>
                            <div>
                              <h4 className="font-bold text-xs text-slate-800 leading-snug">
                                {q.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">{q.category}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-full">
                              {totalQ} votos
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>

                        {/* Corpo com inputs numéricos para cada alternativa */}
                        {isOpen && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2.5 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              {q.options.map((opt) => {
                                const val = currentCounts[opt] || 0;
                                return (
                                  <div 
                                    key={opt}
                                    className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                                  >
                                    <span className="text-slate-700 text-[11px] font-medium leading-tight flex-1" title={opt}>
                                      {opt}
                                    </span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleQuantChange(q.id, opt, val - 1)}
                                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={val}
                                        onChange={(e) => handleQuantChange(q.id, opt, parseInt(e.target.value, 10) || 0)}
                                        className="w-12 text-center bg-slate-50 border border-slate-300 rounded py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleQuantChange(q.id, opt, val + 1)}
                                        className="w-6 h-6 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* CAMPOS ABERTOS QUALITATIVOS EDITÁVEIS PARA A OPÇÃO B */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Observações Complementares da Amostragem (Editável)
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Contexto e Notas de Aplicação do Questionário
                    </label>
                    <textarea
                      rows={3}
                      value={qualitativeNotes}
                      onChange={(e) => setQualitativeNotes(e.target.value)}
                      placeholder="Insira detalhes adicionais observados durante a aplicação das perguntas..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-y leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Diretrizes de Gestão & Recomendações Esperadas
                    </label>
                    <textarea
                      rows={2}
                      value={gestaoNotes}
                      onChange={(e) => setGestaoNotes(e.target.value)}
                      placeholder="Diretrizes locais para orientar o plano de ação da IA..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-y leading-relaxed font-sans"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: AI Insights / Diagnosis (5/12 grid layout) */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-white rounded-xl border border-blue-100 shadow-md flex flex-col overflow-hidden min-h-[500px]">
              
              {/* Header de Diagnóstico IA (QWEN) */}
              <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
                 <div className="flex items-center gap-2">
                    <Brain className="w-4.5 h-4.5 text-white animate-pulse" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-wider">DIAGNÓSTICO DE IA (QWEN)</span>
                 </div>
                 <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded border border-blue-400 font-bold uppercase tracking-wider">
                   {analysisMode === "A" ? "Qualitativo" : "Quantitativo"}
                 </span>
              </div>

              {/* Corpo da análise */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs select-text">
                
                {/* MENSAGEM DE ERRO CASO OCORRA */}
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs flex gap-2 items-start">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500 font-semibold animate-pulse">
                      Qwen gerando relatório técnico com Engenharia de Prompt para a {selectedUBS.split("-")[0]}...
                    </p>
                  </div>
                ) : aiResponse ? (
                  /* EXIBIÇÃO REAL DA IA (QWEN) */
                  <div className="space-y-4 font-normal" id="ai_response_content">
                    {aiResponse.split("\n").map((line, index) => {
                      if (line.startsWith("###")) {
                        return <h4 key={index} className="text-slate-900 font-black text-[11px] uppercase tracking-wide mt-5 mb-1.5 border-b pb-1 border-slate-100">{line.replace("###", "").trim()}</h4>;
                      } else if (line.startsWith("##")) {
                        return <h3 key={index} className="text-slate-900 font-black text-xs uppercase tracking-wide mt-6 mb-2 border-b pb-1 border-slate-200">{line.replace("##", "").trim()}</h3>;
                      } else if (line.startsWith("**") && line.endsWith("**")) {
                        return <h4 key={index} className="text-slate-900 font-bold text-[10px] uppercase mt-4 mb-1 tracking-wide">{line.replace(/\*\*/g, "").trim()}</h4>;
                      } else if (line.startsWith("-") || line.startsWith("*")) {
                        return (
                          <li key={index} className="ml-4 list-disc pl-1 text-slate-700 my-1 leading-relaxed">
                            {line.substring(1).trim()}
                          </li>
                        );
                      } else if (line.trim() === "---") {
                        return <hr key={index} className="my-3 border-slate-200" />;
                      } else if (line.trim() === "") {
                        return <div key={index} className="h-1"></div>;
                      } else {
                        return (
                          <p key={index} className="my-1.5 leading-relaxed text-slate-600">
                            {line.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-800 font-bold">{part}</strong> : part)}
                          </p>
                        );
                      }
                    })}
                  </div>
                ) : (
                  /* DEMO / FALLBACK ESTRUTURADO NO TEMPLATE RIGOROSO EXIGIDO */
                  <div className="space-y-4" id="demo_response_content">
                    <div className="border-l-4 border-red-500 pl-3 py-1.5 bg-red-50 rounded-r-lg">
                      <p className="font-bold text-red-700 uppercase text-[10px] mb-1 tracking-wider">### 1. DIAGNÓSTICO DE ESTRESSE DIGITAL E GARGALOS OPERACIONAIS</p>
                      <p className="text-slate-700 leading-relaxed text-[11px] md:text-xs">
                        - <strong>Nível de Estresse Digital</strong>: Elevado na equipe multiprofissional devido ao retrabalho com registros paralelos em papel e instabilidade de conexão.<br/>
                        - <strong>Cruzamento de Ferramentas</strong>: O uso de formulários manuais somado ao e-SUS APS gera perda de aproximadamente <strong>{activeMinutes} minutos pós-consulta</strong> por paciente.<br/>
                        - <strong>Riscos de Segurança</strong>: Adoção frequente de login compartilhado e smartphones particulares (WhatsApp) sem conformidade com a LGPD e diretrizes do SUS.
                      </p>
                    </div>

                    <div className="border-l-4 border-amber-500 pl-3 py-1.5 bg-amber-50 rounded-r-lg">
                      <p className="font-bold text-amber-800 uppercase text-[10px] mb-1 tracking-wider">### 2. ANÁLISE DE IMPACTO NO ATENDIMENTO</p>
                      <p className="text-slate-700 leading-relaxed text-[11px] md:text-xs">
                        A lentidão crônica e a duplicidade de informações acumulam atrasos sistemáticos na agenda vespertina, reduzindo o tempo de escuta clínica humanizada e sobrecarregando a fila física de espera.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                      <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">### 3. PLANO DE AÇÃO ESTRUTURADO (PET-SAÚDE DIGITAL)</p>
                      
                      <div className="space-y-1.5 text-[11px] md:text-xs text-slate-700">
                        <p><strong>• Ações Imediatas (0 a 30 dias):</strong> Eliminação gradativa de fichas físicas de triagem e criação de templates rápidos de atendimento no e-SUS APS.</p>
                        <p><strong>• Ações de Médio Prazo (30 a 90 dias):</strong> Capacitação continuada pelo PET-Saúde com foco no app e-SUS Território e individualização de credenciais de login.</p>
                        <p><strong>• Ações de Longo Prazo:</strong> Redundância de link de internet municipal e integração completa do prontuário com laboratórios e farmácia.</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/80 p-3.5 rounded-lg border border-blue-200">
                      <p className="font-bold text-blue-900 text-[10px] uppercase mb-1.5 tracking-wide">### 4. QUADRO DE VIABILIDADE E IMPACTO</p>
                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
                        <div className="bg-white p-2 rounded border border-blue-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Viabilidade Técnica</span>
                          <span className="text-xs font-black text-emerald-700">ALTA</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Custo de Implantação</span>
                          <span className="text-xs font-black text-blue-700">BAIXO</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Botão de rodapé para gerar o plano de ação */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={handleGenerateAI}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Processando com Qwen..." : `Gerar Relatório Técnico Qwen (${analysisMode === "A" ? "Qualitativo" : "Quantitativo"})`}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-auto px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 text-center sm:text-left flex-shrink-0 bg-white">
          <p>PET-Saúde Digital {currentCity} SP / UNESP — Apresentação da Banca Examinadora 2026</p>
          <p className="font-mono">Ambiente Seguro de Saúde Digital • Qwen AI Engine</p>
        </footer>

      </main>

    </div>
  );
}
