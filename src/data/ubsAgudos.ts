// ==============================================================================
// CATÁLOGO OFICIAL DE UNIDADES DE SAÚDE (UBS / ESF) - AGUDOS / SP
// PET-Saúde Digital - Mapeamento e Diagnóstico de Estresse Digital
// ==============================================================================

export interface HealthUnit {
  id: string;
  name: string;
  shortName: string;
  type: "UBS" | "ESF" | "UPA" | "CENTRO_SAUDE";
  cnes?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  openingHours: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  coveragePopulation: number;
  activeTeams: number;
  services: string[];
  // Dados coletados na pesquisa PET-Saúde para esta unidade
  surveyData: {
    respondentName: string;
    role: string;
    toolsUsed: string[];
    hasClearProtocol: "Sim, rígido" | "Compartilhado/flexível" | "Não existe formalmente";
    geographicBarriers: "Sim, dificulta bastante" | "Parcialmente" | "Não, é central e fácil";
    predominantAgeGroup: "Crianças/Pediatria" | "Jovens/Adultos" | "Idosos (>60 anos)" | "Distribuição mista";
    predominantClass: "Classe C/D" | "Classe D/E (Vulnerabilidade)" | "Extrema Vulnerabilidade" | "Misto";
    eSusUpdateFrequency: "Imediatamente pós-consulta" | "Em blocos (fim de turno)" | "Semanal ou acumulado";
    needsDuplicateRecord: boolean;
    duplicateFrequency: "Sempre" | "Frequentemente" | "Às vezes" | "Raramente" | "Nunca";
    duplicatedLocations: string[];
    hasRigidClinicalStandard: "Sim, padronizado" | "Básico com variação" | "Não há padronização";
    supportMaterialsAvailable: "Sim, claros e atualizados" | "Manuais confusos/desatualizados" | "Não há materiais";
    loginPolicy: "Individual com senha" | "Compartilhado por sala" | "Geral único da unidade";
    usesPersonalPhone: boolean;
    careQualityRating: number; // 1 a 5
    perceivedBenefits: string[];
    minutesFillingPostConsultation: number;
    lagFrequency: "Sempre (diariamente)" | "Frequentemente (várias vezes/semana)" | "Raramente" | "Nunca";
  };
  stressLevel: "BAIXO" | "MODERADO" | "ALTO" | "CRÍTICO";
  stressScore: number; // 0 a 100
}

export const ubsAgudosList: HealthUnit[] = [
  {
    id: "ubs-central-dom-boscolo",
    name: "UBS Central - Centro de Saúde Dr. Domingos Bôscolo",
    shortName: "UBS Central / Dom Bôscolo",
    type: "CENTRO_SAUDE",
    cnes: "2081541",
    address: "Rua 13 de Maio, 242",
    neighborhood: "Centro",
    city: "Agudos",
    state: "SP",
    zipCode: "17120-000",
    phone: "(14) 3262-1234",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4687,
      lon: -48.9858
    },
    coveragePopulation: 9500,
    activeTeams: 4,
    services: [
      "Clínica Médica",
      "Pediatria",
      "Ginecologia e Obstetrícia",
      "Sala de Vacinas Central",
      "Farmácia Municipal",
      "Coleta de Exames Laboratoriais",
      "Curativos e Procedimentos"
    ],
    surveyData: {
      respondentName: "Dr. Marcelo Antunes Ribeiro",
      role: "Médico Clínico Geral",
      toolsUsed: ["Prontuário Eletrônico e-SUS APS", "Ficha de Papel Paralela", "Planilha de Controle Excel", "WhatsApp Pessoal"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Não, é central e fácil",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Classe C/D",
      eSusUpdateFrequency: "Em blocos (fim de turno)",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Prontuário e-SUS", "Ficha Física de Atendimento", "Livro de Registro de Medicamentos Controlados"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Manuais confusos/desatualizados",
      loginPolicy: "Compartilhado por sala",
      usesPersonalPhone: true,
      careQualityRating: 3,
      perceivedBenefits: ["Histórico digital centralizado", "Facilidade de emissão de receitas"],
      minutesFillingPostConsultation: 11,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "ALTO",
    stressScore: 78
  },
  {
    id: "esf-severino-calazans",
    name: "ESF Prof. Severino Calazans",
    shortName: "ESF Severino Calazans",
    type: "ESF",
    cnes: "2081550",
    address: "Rua Antônio Alves, 410",
    neighborhood: "Jardim Nilce / Centenário",
    city: "Agudos",
    state: "SP",
    zipCode: "17122-150",
    phone: "(14) 3262-3450",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4782,
      lon: -48.9815
    },
    coveragePopulation: 4200,
    activeTeams: 2,
    services: [
      "Estratégia Saúde da Família",
      "Acompanhamento Hiperdia",
      "Puericultura e Pré-Natal",
      "Visitas Domiciliares ACS",
      "Imunização Básica",
      "Saúde Bucal / Odontologia"
    ],
    surveyData: {
      respondentName: "Carla Mendes de Oliveira",
      role: "Enfermeira Coordenadora de Equipe",
      toolsUsed: ["e-SUS APS Território", "Caderno de Triagem Físico", "WhatsApp Pessoal para ACS"],
      hasClearProtocol: "Não existe formalmente",
      geographicBarriers: "Sim, dificulta bastante",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Semanal ou acumulado",
      needsDuplicateRecord: true,
      duplicateFrequency: "Sempre",
      duplicatedLocations: ["Ficha CDS de Visita em Papel", "Sistema e-SUS APS", "Caderno de Visitas Domiciliares"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Não há materiais",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: true,
      careQualityRating: 2,
      perceivedBenefits: ["Controle de metas Previne Brasil"],
      minutesFillingPostConsultation: 14,
      lagFrequency: "Sempre (diariamente)"
    },
    stressLevel: "CRÍTICO",
    stressScore: 88
  },
  {
    id: "esf-jardim-nilce",
    name: "ESF Jardim Nilce",
    shortName: "ESF Jardim Nilce",
    type: "ESF",
    cnes: "2081568",
    address: "Av. Sebastião Tronco, 310",
    neighborhood: "Jardim Nilce",
    city: "Agudos",
    state: "SP",
    zipCode: "17122-090",
    phone: "(14) 3262-4512",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4745,
      lon: -48.9790
    },
    coveragePopulation: 3800,
    activeTeams: 2,
    services: [
      "Atenção Básica à Família",
      "Acolhimento com Escuta Qualificada",
      "Vacinação de Rotina",
      "Controle de Diabetes e Hipertensão",
      "Coleta de Papanicolau",
      "Curativos"
    ],
    surveyData: {
      respondentName: "Juliana Santos Prado",
      role: "Técnica de Enfermagem",
      toolsUsed: ["e-SUS APS", "Ficha Manual de Sinais Vitais", "Planilha de Vacinação"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Parcialmente",
      predominantAgeGroup: "Distribuição mista",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Em blocos (fim de turno)",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Caderno de Triagem", "Prontuário Eletrônico"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Manuais confusos/desatualizados",
      loginPolicy: "Compartilhado por sala",
      usesPersonalPhone: true,
      careQualityRating: 3,
      perceivedBenefits: ["Histórico de vacinas", "Integração com cartão SUS"],
      minutesFillingPostConsultation: 9,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "MODERADO",
    stressScore: 65
  },
  {
    id: "esf-parque-das-vinhas",
    name: "ESF Parque das Vinhas",
    shortName: "ESF Parque das Vinhas",
    type: "ESF",
    cnes: "2081576",
    address: "Rua João Valério, 155",
    neighborhood: "Parque das Vinhas",
    city: "Agudos",
    state: "SP",
    zipCode: "17123-040",
    phone: "(14) 3262-5580",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4610,
      lon: -48.9920
    },
    coveragePopulation: 4600,
    activeTeams: 2,
    services: [
      "Saúde da Família e Comunidade",
      "Consultas Médicas e de Enfermagem",
      "Grupo de Gestantes",
      "Odontologia Preventiva",
      "Distribuição de Medicamentos Básicos",
      "Visitas Domiciliares"
    ],
    surveyData: {
      respondentName: "Lucas Fernando Silva",
      role: "Agente Comunitário de Saúde (ACS)",
      toolsUsed: ["Fichas CDS Papel", "App Celular Pessoal", "e-SUS Centralizado"],
      hasClearProtocol: "Sim, rígido",
      geographicBarriers: "Sim, dificulta bastante",
      predominantAgeGroup: "Jovens/Adultos",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Semanal ou acumulado",
      needsDuplicateRecord: true,
      duplicateFrequency: "Sempre",
      duplicatedLocations: ["Ficha de Papel do Ministério", "Sistema e-SUS Digitado por Terceiro"],
      hasRigidClinicalStandard: "Sim, padronizado",
      supportMaterialsAvailable: "Manuais confusos/desatualizados",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: true,
      careQualityRating: 3,
      perceivedBenefits: ["Mapeamento das famílias do microterritório"],
      minutesFillingPostConsultation: 12,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "ALTO",
    stressScore: 74
  },
  {
    id: "esf-vila-vigato",
    name: "ESF Vila Vigato - Pref. Waldomiro Fantini",
    shortName: "ESF Vila Vigato",
    type: "ESF",
    cnes: "2081584",
    address: "Rua 7 de Setembro, 1205",
    neighborhood: "Vila Vigato",
    city: "Agudos",
    state: "SP",
    zipCode: "17120-110",
    phone: "(14) 3262-6720",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4635,
      lon: -48.9772
    },
    coveragePopulation: 5100,
    activeTeams: 2,
    services: [
      "Estratégia Saúde da Família",
      "Atendimento Odontológico Completo",
      "Programa Saúde na Escola (PSE)",
      "Coleta Preventivo Ginecológico",
      "Curativos e Retirada de Pontos"
    ],
    surveyData: {
      respondentName: "Dra. Beatriz Campos Toledo",
      role: "Cirurgiã-Dentista",
      toolsUsed: ["Odonto e-SUS APS", "Ficha Odontológica Física", "WhatsApp"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Não, é central e fácil",
      predominantAgeGroup: "Crianças/Pediatria",
      predominantClass: "Classe C/D",
      eSusUpdateFrequency: "Imediatamente pós-consulta",
      needsDuplicateRecord: false,
      duplicateFrequency: "Às vezes",
      duplicatedLocations: ["Prontuário Odontológico e-SUS"],
      hasRigidClinicalStandard: "Sim, padronizado",
      supportMaterialsAvailable: "Sim, claros e atualizados",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: false,
      careQualityRating: 4,
      perceivedBenefits: ["Histórico odontológico integrado", "Agilidade no registro de procedimentos"],
      minutesFillingPostConsultation: 5,
      lagFrequency: "Raramente"
    },
    stressLevel: "BAIXO",
    stressScore: 32
  },
  {
    id: "esf-santa-cecilia",
    name: "ESF Santa Cecília",
    shortName: "ESF Santa Cecília",
    type: "ESF",
    cnes: "2081592",
    address: "Rua Joaquim de Andrade, 450",
    neighborhood: "Santa Cecília",
    city: "Agudos",
    state: "SP",
    zipCode: "17121-220",
    phone: "(14) 3262-7890",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4720,
      lon: -48.9940
    },
    coveragePopulation: 3900,
    activeTeams: 2,
    services: [
      "Saúde da Família",
      "Acompanhamento de Doenças Crônicas",
      "Planejamento Familiar",
      "Vacinas e Testes Rápidos (HIV/Sífilis/Hepatites)",
      "Atividades em Grupo com Idosos"
    ],
    surveyData: {
      respondentName: "Patrícia Helena Ramos",
      role: "Recepcionista / Auxiliar Administrativo",
      toolsUsed: ["e-SUS APS Recepção", "Livro de Presença Físico", "Planilha de Agendamento"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Parcialmente",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Imediatamente pós-consulta",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Caderno de Agendamento", "Sistema e-SUS"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Manuais confusos/desatualizados",
      loginPolicy: "Compartilhado por sala",
      usesPersonalPhone: true,
      careQualityRating: 3,
      perceivedBenefits: ["Facilidade de verificação de cadastro de usuários"],
      minutesFillingPostConsultation: 8,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "MODERADO",
    stressScore: 60
  },
  {
    id: "esf-pampulha",
    name: "ESF Pampulha / Jardim Europa",
    shortName: "ESF Pampulha",
    type: "ESF",
    cnes: "2081606",
    address: "Rua Minas Gerais, 82",
    neighborhood: "Vila Pampulha",
    city: "Agudos",
    state: "SP",
    zipCode: "17124-010",
    phone: "(14) 3262-8115",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4758,
      lon: -48.9895
    },
    coveragePopulation: 4100,
    activeTeams: 2,
    services: [
      "Atenção Primária à Saúde",
      "Visitas Domiciliares com Foco em Acamados",
      "Coleta de Exames Preventivos",
      "Imunização Infantil e de Adultos",
      "Controle de Tuberculose e Hanseníase"
    ],
    surveyData: {
      respondentName: "Fernando Augusto Castro",
      role: "Médico de Família",
      toolsUsed: ["e-SUS APS", "Prontuário em Papel", "Receituário Físico"],
      hasClearProtocol: "Sim, rígido",
      geographicBarriers: "Não, é central e fácil",
      predominantAgeGroup: "Distribuição mista",
      predominantClass: "Classe C/D",
      eSusUpdateFrequency: "Imediatamente pós-consulta",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Ficha Clínica de Papel", "e-SUS Prontuário"],
      hasRigidClinicalStandard: "Sim, padronizado",
      supportMaterialsAvailable: "Sim, claros e atualizados",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: false,
      careQualityRating: 4,
      perceivedBenefits: ["Prescrição eletrônica padronizada", "Acompanhamento longitudinal"],
      minutesFillingPostConsultation: 7,
      lagFrequency: "Raramente"
    },
    stressLevel: "BAIXO",
    stressScore: 38
  },
  {
    id: "esf-thyrso-dalla-dea",
    name: "ESF Prof. Thyrso Dalla Déa",
    shortName: "ESF Prof. Thyrso",
    type: "ESF",
    cnes: "2081614",
    address: "Rua José Carlos de Oliveira, 75",
    neighborhood: "Jardim Cruzeiro",
    city: "Agudos",
    state: "SP",
    zipCode: "17120-430",
    phone: "(14) 3262-9230",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4590,
      lon: -48.9810
    },
    coveragePopulation: 4700,
    activeTeams: 2,
    services: [
      "Saúde da Família",
      "Acolhimento com Classificação de Risco",
      "Pré-natal e Planejamento Reprodutivo",
      "Acompanhamento de Pacientes Oncológicos e Crônicos",
      "Grupo de Saúde Mental Leve"
    ],
    surveyData: {
      respondentName: "Renata Faria Vasconcelos",
      role: "Enfermeira de Família",
      toolsUsed: ["e-SUS APS", "Caderno de Enfermagem", "WhatsApp Pessoal"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Parcialmente",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Em blocos (fim de turno)",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Ficha de Triagem Manual", "e-SUS APS"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Manuais confusos/desatualizados",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: true,
      careQualityRating: 3,
      perceivedBenefits: ["Histórico de consultas anteriores"],
      minutesFillingPostConsultation: 10,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "ALTO",
    stressScore: 71
  },
  {
    id: "esf-jardim-danubio",
    name: "ESF Jardim Danúbio",
    shortName: "ESF Jardim Danúbio",
    type: "ESF",
    cnes: "2081622",
    address: "Rua Giácomo Bôscolo, 180",
    neighborhood: "Jardim Danúbio",
    city: "Agudos",
    state: "SP",
    zipCode: "17122-300",
    phone: "(14) 3262-3340",
    openingHours: "Segunda a Sexta, das 07h às 17h",
    coordinates: {
      lat: -22.4665,
      lon: -48.9965
    },
    coveragePopulation: 3600,
    activeTeams: 2,
    services: [
      "Atenção Básica à Saúde",
      "Consultas Médicas Agendadas",
      "Vacinação de Rotina",
      "Curativos e Inalação",
      "Visitas Domiciliares Periódicas"
    ],
    surveyData: {
      respondentName: "Gabriel Moreno Lima",
      role: "Agente Administrativo",
      toolsUsed: ["e-SUS APS", "Planilhas Google Drive", "Ata em Papel"],
      hasClearProtocol: "Não existe formalmente",
      geographicBarriers: "Parcialmente",
      predominantAgeGroup: "Distribuição mista",
      predominantClass: "Classe D/E (Vulnerabilidade)",
      eSusUpdateFrequency: "Em blocos (fim de turno)",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Planilha de Agendamento", "Sistema e-SUS"],
      hasRigidClinicalStandard: "Não há padronização",
      supportMaterialsAvailable: "Não há materiais",
      loginPolicy: "Compartilhado por sala",
      usesPersonalPhone: true,
      careQualityRating: 2,
      perceivedBenefits: ["Emissão de relatórios mensais"],
      minutesFillingPostConsultation: 11,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "ALTO",
    stressScore: 75
  },
  {
    id: "esf-distrito-domelia",
    name: "ESF Distrito de Domélia",
    shortName: "ESF Domélia (Distrito)",
    type: "ESF",
    cnes: "2081630",
    address: "Praça Central, s/n",
    neighborhood: "Distrito de Domélia",
    city: "Agudos",
    state: "SP",
    zipCode: "17128-000",
    phone: "(14) 3262-0199",
    openingHours: "Segunda a Sexta, das 07h às 16h30",
    coordinates: {
      lat: -22.6881,
      lon: -49.1245
    },
    coveragePopulation: 2200,
    activeTeams: 1,
    services: [
      "Atenção Primária Rural e Distrital",
      "Atendimento Médico e de Enfermagem",
      "Ponto de Apoio para Urgências Rurais",
      "Dispensação de Medicamentos Essenciais",
      "Visitas Domiciliares em Assentamentos e Sítios"
    ],
    surveyData: {
      respondentName: "Luciana Aparecida Benitez",
      role: "Enfermeira Chefe do Distrito",
      toolsUsed: ["Fichas Físicas Manuais", "e-SUS APS Offline", "WhatsApp para Encaminhamento SAMU"],
      hasClearProtocol: "Compartilhado/flexível",
      geographicBarriers: "Sim, dificulta bastante",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Extrema Vulnerabilidade",
      eSusUpdateFrequency: "Semanal ou acumulado",
      needsDuplicateRecord: true,
      duplicateFrequency: "Sempre",
      duplicatedLocations: ["Fichas em Papel", "Digitação Manual ao Fim da Semana na Sede"],
      hasRigidClinicalStandard: "Básico com variação",
      supportMaterialsAvailable: "Não há materiais",
      loginPolicy: "Geral único da unidade",
      usesPersonalPhone: true,
      careQualityRating: 2,
      perceivedBenefits: ["Cadastro dos moradores rurais"],
      minutesFillingPostConsultation: 16,
      lagFrequency: "Sempre (diariamente)"
    },
    stressLevel: "CRÍTICO",
    stressScore: 94
  },
  {
    id: "esf-distrito-rubiao",
    name: "ESF Distrito de Rubião / Santo Antônio",
    shortName: "ESF Rubião / Santo Antônio",
    type: "ESF",
    cnes: "2081649",
    address: "Estrada Municipal Agudos-Rubião, s/n",
    neighborhood: "Distrito de Rubião Júnior",
    city: "Agudos",
    state: "SP",
    zipCode: "17127-000",
    phone: "(14) 3262-0240",
    openingHours: "Segunda a Sexta, das 07h às 16h30",
    coordinates: {
      lat: -22.5200,
      lon: -48.9100
    },
    coveragePopulation: 1850,
    activeTeams: 1,
    services: [
      "Saúde da Família Rural",
      "Atendimento Clínico e Pediátrico",
      "Vacinação Agendada e Busca Ativa",
      "Acompanhamento de Doenças Tropicais e Zoonoses",
      "Visita Domiciliar ACS em Chácaras e Fazendas"
    ],
    surveyData: {
      respondentName: "Marcos Vinicius Rezende",
      role: "Agente Comunitário de Saúde Rural",
      toolsUsed: ["Caderno de Campo", "Fichas CDS Papel", "Celular Pessoal para Fotos"],
      hasClearProtocol: "Não existe formalmente",
      geographicBarriers: "Sim, dificulta bastante",
      predominantAgeGroup: "Idosos (>60 anos)",
      predominantClass: "Extrema Vulnerabilidade",
      eSusUpdateFrequency: "Semanal ou acumulado",
      needsDuplicateRecord: true,
      duplicateFrequency: "Sempre",
      duplicatedLocations: ["Fichas CDS Papel", "Relatório de Campo", "Digitação Centralizada"],
      hasRigidClinicalStandard: "Não há padronização",
      supportMaterialsAvailable: "Não há materiais",
      loginPolicy: "Geral único da unidade",
      usesPersonalPhone: true,
      careQualityRating: 2,
      perceivedBenefits: ["Histórico de vacinas de moradores rurais"],
      minutesFillingPostConsultation: 15,
      lagFrequency: "Sempre (diariamente)"
    },
    stressLevel: "CRÍTICO",
    stressScore: 91
  },
  {
    id: "upa-agudos",
    name: "UPA 24h - Pronto Atendimento Municipal de Agudos",
    shortName: "UPA 24h / PA Agudos",
    type: "UPA",
    cnes: "2081657",
    address: "Av. Richard Freudenberg, 100",
    neighborhood: "Bela Vista / Centro",
    city: "Agudos",
    state: "SP",
    zipCode: "17120-000",
    phone: "(14) 3262-1920",
    openingHours: "Atendimento Ininterrupto 24 Horas",
    coordinates: {
      lat: -22.4705,
      lon: -48.9830
    },
    coveragePopulation: 37500,
    activeTeams: 6,
    services: [
      "Pronto Atendimento de Urgência e Emergência 24h",
      "Triagem Protocolo Manchester",
      "Sala Vermelha (Estabilização Crítica)",
      "Sala Amarela (Observação Adulto e Pediátrica)",
      "Raio-X e Eletrocardiograma 24h",
      "Laboratório de Urgência",
      "Base de Apoio do SAMU"
    ],
    surveyData: {
      respondentName: "Dr. André Fioranti Santana",
      role: "Médico Emergencista Plantonista",
      toolsUsed: ["Sistema Hospitalar Próprio (SIS)", "Prontuário Eletrônico", "Prontuário Físico de Emergência"],
      hasClearProtocol: "Sim, rígido",
      geographicBarriers: "Não, é central e fácil",
      predominantAgeGroup: "Distribuição mista",
      predominantClass: "Classe C/D",
      eSusUpdateFrequency: "Imediatamente pós-consulta",
      needsDuplicateRecord: true,
      duplicateFrequency: "Frequentemente",
      duplicatedLocations: ["Prontuário Eletrônico", "Ficha de Prescrição Manual", "Livro de Plantão"],
      hasRigidClinicalStandard: "Sim, padronizado",
      supportMaterialsAvailable: "Sim, claros e atualizados",
      loginPolicy: "Individual com senha",
      usesPersonalPhone: true,
      careQualityRating: 4,
      perceivedBenefits: ["Histórico de alergias e comorbidades", "Agilidade na classificação de risco"],
      minutesFillingPostConsultation: 6,
      lagFrequency: "Frequentemente (várias vezes/semana)"
    },
    stressLevel: "MODERADO",
    stressScore: 58
  }
];

// Dicionário de análises técnicas locais prontas (Offline / Fallback Determinístico)
export const localDiagnosisDatabase: Record<string, {
  estresse: string;
  diagnostico: string;
  propostas: string[];
}> = {
  "ubs-central-dom-boscolo": {
    estresse: "⚠️ ALTO (Score: 78/100). A UBS Central sofre com gargalo de atendimento devido à duplicidade de registro entre o e-SUS e fichas físicas para controle de medicações especiais. O compartilhamento de computadores na recepção gera atritos no login e perda de registros temporários.",
    diagnostico: "⏳ O tempo médio de 11 minutos pós-consulta afeta diretamente o volume de consultas eletivas, gerando atraso médio de 45 minutos no início da tarde.",
    propostas: [
      "Padronização de modelos rápidos de anamnese no e-SUS APS para agilizar digitação de receitas crônicas.",
      "Criação de fila prioritária digital para entrega de medicamentos e vacinação sem travar o prontuário clínico.",
      "Capacitação dos médicos em atalhos de teclado e integração com o sistema municipal de exames laboratoriais."
    ]
  },
  "esf-severino-calazans": {
    estresse: "🚨 CRÍTICO (Score: 88/100). A unidade opera sob estresse digital severo. As fichas de visitas dos ACS em papel acumulam semanalmente para digitação tardia, gerando desatualização nos indicadores do Previne Brasil e sobrecarga da coordenação de enfermagem.",
    diagnostico: "⏳ Tempo de 14 minutos pós-atendimento com lentidão diária na internet, forçando profissionais a usar celulares particulares em grupos informais de WhatsApp.",
    propostas: [
      "Implementação do aplicativo móvel e-SUS Território nos celulares dos ACS para sincronização offline em visitas.",
      "Estabelecimento de protocolo de triagem rápida focada nos indicadores do Previne Brasil.",
      "Organização de escala de digitação em horários alternados para evitar congestionamento da rede local."
    ]
  },
  "esf-distrito-domelia": {
    estresse: "🚨 CRÍTICO (Score: 94/100). O isolamento geográfico do Distrito de Domélia (25 km da sede) agrava o hiato digital. A conexão de internet oscila frequentemente e os atendimentos rurais são registrados em papel e digitados na sede com atraso de até 15 dias.",
    diagnostico: "⏳ 16 minutos pós-consulta com dependência total de smartphone pessoal e WhatsApp para encaminhamentos de emergência ao SAMU.",
    propostas: [
      "Instalação de roteador com redundância 4G/Satélite para a unidade distrital de Domélia.",
      "Adoção de protocolo de contingência offline estruturado para registro e posterior batch-upload.",
      "Treinamento continuado do PET-Saúde Digital para a equipe multiprofissional rural."
    ]
  }
};
