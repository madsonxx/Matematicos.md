/* ==========================================================================
   1. js/config.js — Configurações Centralizadas (window.CONFIG)
   Toda regra de negócio, pontuação, cores, textos e degraus ficam aqui.
   ========================================================================== */

window.CONFIG = {
  // Identificação do projeto
  NOME_JOGO: 'MATEMÁGICOS',
  VERSAO: '1.2.0',

  // Chave raiz para armazenamento no navegador (localStorage)
  CHAVE_STORAGE: 'MATEMAGICOS_DADOS_V1',

  // URL do Google Apps Script para o Ranking da Turma (será preenchida no Marco 5)
  URL_PLANILHA_RANKING: '',

  // Paleta de Cores "Meia-Noite" (espelhada com o CSS para uso via JS)
  CORES: {
    BG_FUNDO: '#0F172A',
    BG_PAINEL: '#1E293B',
    NEON_AZUL: '#38BDF8',
    NEON_ROXO: '#A78BFA',
    MULT_4X: '#FBBF24',    // Dourado
    ACERTO: '#22C55E',     // Verde
    ERRO: '#EF4444',       // Vermelho
    TEXTO: '#E2E8F0'       // Branco suave
  },

  // Regras do Modo Desafio e Pontuação
  JOGO: {
    TEMPO_DESAFIO_SEGUNDOS: 30,
    PONTOS_BASE_ACERTO: 100,        // 100 pontos por acerto × multiplicador
    TEMPO_FLASH_ERRO_MS: 300,       // 0,3s mostrando a resposta certa em vermelho no Desafio
    TEMPO_AVANCO_TREINO_MS: 1500,   // 1,5s para explicar e avançar no Modo Treino
    COOLDOWN_RANKING_MS: 3000       // 3s entre envios para a planilha (M5)
  },

  // Tabela de Combo e Multiplicadores (0–2 = x1 | 3–6 = x2 | 7–13 = x3 | 14+ = x4)
  COMBO: {
    FAIXAS: [
      { minAcertos: 14, multiplicador: 4, cor: '#FBBF24', rotulo: '×4' }, // Dourado
      { minAcertos: 7,  multiplicador: 3, cor: '#38BDF8', rotulo: '×3' }, // Azul
      { minAcertos: 3,  multiplicador: 2, cor: '#22C55E', rotulo: '×2' }, // Verde
      { minAcertos: 0,  multiplicador: 1, cor: '#E2E8F0', rotulo: '×1' }  // Branco
    ],
    // Marcos de acertos seguidos que soltam confete e som especial
    MARCOS_CONFETE: [3, 7, 14, 20, 25, 30]
  },

  // Regras do Motor Adaptativo Invisível (Degraus 0 a 11)
  ADAPTATIVO: {
    DEGRAU_MIN: 0,
    DEGRAU_MAX: 11,
    CICLO_SUBIDA: [3, 5, 7, 9],     // Acertos seguidos necessários para subir 1 degrau
    MAX_SUBIDA_POR_PARTIDA: 1,      // Sobe no máximo 1 degrau por partida
    ERROS_PARA_DESCER: 3,           // Desce 1 degrau após 3 erros seguidos
    CHANCE_DEGRAU_ATUAL: 0.70,      // Grey area: 70% degrau atual, 30% de 1 degrau abaixo
    DEGRAU_INICIAL_VETERANO: 3,     // Quem já atingiu degrau 11 duas ou mais vezes começa no 3

    // Tabela oficial de faixas por degrau (0 a 11)
    TABELA_DEGRAUS: [
      // Degraus 0 e 1
      { degrau: 0,  somaSubMax: 6,  difMax: 6,  multTabuadas: [2, 5, 10],             multFatorMax: 3,  divDivisores: [2, 5, 10],             divQuocienteMax: 3 },
      { degrau: 1,  somaSubMax: 6,  difMax: 6,  multTabuadas: [2, 5, 10],             multFatorMax: 3,  divDivisores: [2, 5, 10],             divQuocienteMax: 3 },
      // Degraus 2 e 3
      { degrau: 2,  somaSubMax: 10, difMax: 10, multTabuadas: [2, 3, 5, 10],          multFatorMax: 4,  divDivisores: [2, 3, 5, 10],          divQuocienteMax: 4 },
      { degrau: 3,  somaSubMax: 10, difMax: 10, multTabuadas: [2, 3, 5, 10],          multFatorMax: 4,  divDivisores: [2, 3, 5, 10],          divQuocienteMax: 4 },
      // Degraus 4 e 5
      { degrau: 4,  somaSubMax: 20, difMax: 20, multTabuadas: [2, 3, 4, 5],           multFatorMax: 5,  divDivisores: [2, 3, 4, 5],           divQuocienteMax: 5 },
      { degrau: 5,  somaSubMax: 20, difMax: 20, multTabuadas: [2, 3, 4, 5],           multFatorMax: 5,  divDivisores: [2, 3, 4, 5],           divQuocienteMax: 5 },
      // Degraus 6 e 7
      { degrau: 6,  somaSubMax: 40, difMax: 40, multTabuadas: [2, 3, 4, 5, 6, 7],     multFatorMax: 7,  divDivisores: [2, 3, 4, 5, 6, 7],     divQuocienteMax: 7 },
      { degrau: 7,  somaSubMax: 40, difMax: 40, multTabuadas: [2, 3, 4, 5, 6, 7],     multFatorMax: 7,  divDivisores: [2, 3, 4, 5, 6, 7],     divQuocienteMax: 7 },
      // Degraus 8 e 9
      { degrau: 8,  somaSubMax: 70, difMax: 30, multTabuadas: [2, 3, 4, 5, 6, 7, 8],  multFatorMax: 8,  divDivisores: [2, 3, 4, 5, 6, 7, 8],  divQuocienteMax: 8 },
      { degrau: 9,  somaSubMax: 70, difMax: 30, multTabuadas: [2, 3, 4, 5, 6, 7, 8],  multFatorMax: 8,  divDivisores: [2, 3, 4, 5, 6, 7, 8],  divQuocienteMax: 8 },
      // Degraus 10 e 11
      { degrau: 10, somaSubMax: 99, difMax: 30, multTabuadas: [2,3,4,5,6,7,8,9,10],   multFatorMax: 10, divDivisores: [2,3,4,5,6,7,8,9,10],   divQuocienteMax: 10 },
      { degrau: 11, somaSubMax: 99, difMax: 30, multTabuadas: [2,3,4,5,6,7,8,9,10],   multFatorMax: 10, divDivisores: [2,3,4,5,6,7,8,9,10],   divQuocienteMax: 10 }
    ]
  },

  // Nomes e símbolos amigáveis das operações
  OPERACOES: {
    adicao:        { nome: 'Adição',        simbolo: '+', icone: '➕' },
    subtracao:     { nome: 'Subtração',     simbolo: '−', icone: '➖' },
    multiplicacao: { nome: 'Multiplicação', simbolo: '×', icone: '✖️' },
    divisao:       { nome: 'Divisão',       simbolo: '÷', icone: '➗' },
    mestre:        { nome: 'Modo Mestre',   simbolo: '👑', icone: '👑' }
  },

  // Textos e personalidades dos 3 Mascotes
  MASCOTES: {
    coruja: {
      emoji: '🦉',
      nome: 'Coruja Sábia',
      falaInicial: 'Use a mente mágica! Se precisar, clique em 💡 Ajuda.',
      falasAcerto: ['Muito bem pensado!', 'Excelente raciocínio!', 'Você está voando alto!'],
      falasErro: ['Quase lá! Que tal ligar a 💡 Ajuda para ver as bolinhas?', 'Respire fundo e observe os números!']
    },
    raposa: {
      emoji: '🦊',
      nome: 'Raposa Veloz',
      falaInicial: 'Preparado para fazer combos rápidos? Vamos nessa!',
      falasAcerto: ['Uau, que rapidez!', 'Combo subindo! Continue assim!', 'Ninguém segura você!'],
      falasErro: ['Opa, tropeçamos! Vamos recuperar o combo na próxima!']
    },
    tartaruga: {
      emoji: '🐢',
      nome: 'Tartaruga Zen',
      falaInicial: 'Sem pressa! O importante é entender cada passo.',
      falasAcerto: ['Passo a passo a gente chega longe!', 'Certíssimo! Calma e precisão!', 'Boa!'],
      falasErro: ['Tudo bem errar! Olhe com calma para a resposta certa.']
    }
  },

  // Metas das Conquistas de 3 estrelas (para uso no Marco 2)
  CONQUISTAS: [
    { id: 'acertos_totais', titulo: 'Mago dos Números',   descricao: 'Acertos totais acumulados',      metas: [25, 100, 500] },
    { id: 'sequencia_max',  titulo: 'Raio Implacável',    descricao: 'Acertos seguidos numa partida',  metas: [5, 10, 20] },
    { id: 'partidas_jog',   titulo: 'Aprendiz Dedicado',  descricao: 'Partidas jogadas',               metas: [50, 150, 400] },
    { id: 'dias_ativos',    titulo: 'Guardião do Tempo',  descricao: 'Dias diferentes praticando',     metas: [2, 5, 10] },
    { id: 'partidas_perf',  titulo: 'Precisão Cristalina',descricao: 'Partidas sem nenhum erro',       metas: [1, 5, 10] },
    { id: 'combo_4x',       titulo: 'Lenda Dourada ×4',   descricao: 'Vezes que alcançou o combo ×4',  metas: [1, 10, 50] },
    { id: 'acertos_treino', titulo: 'Mestre Zen',         descricao: 'Acertos no Modo Treino',         metas: [30, 80, 150] }
  ]
};