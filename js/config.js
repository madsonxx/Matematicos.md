/* ==========================================================================
   1. js/config.js — Configurações Centralizadas (window.CONFIG)
   Inclui Sistema de Probabilidades por Nível estilo Dota Underlords (Tiers 1 a 5).
   ========================================================================== */

window.CONFIG = {
  NOME_JOGO: 'MATEMÁGICOS',
  VERSAO: '1.4.0',

  CHAVE_STORAGE: 'MATEMAGICOS_DADOS_V1',

  URL_PLANILHA_RANKING: 'https://script.google.com/macros/s/AKfycbxGSk_foYrDo13aLvDDgKZVgC72crUh78h_d2DQeTMxLSXEODkZCZtyoHAEQD68gcqd/exec',
  RANKING_URL: 'https://script.google.com/macros/s/AKfycbxGSk_foYrDo13aLvDDgKZVgC72crUh78h_d2DQeTMxLSXEODkZCZtyoHAEQD68gcqd/exec',

  CORES: {
    BG_FUNDO: '#0F172A',
    BG_PAINEL: '#1E293B',
    NEON_AZUL: '#38BDF8',
    NEON_ROXO: '#A78BFA',
    MULT_4X: '#FBBF24',
    ACERTO: '#22C55E',
    ERRO: '#EF4444',
    TEXTO: '#E2E8F0'
  },

  JOGO: {
    TEMPO_DESAFIO_SEGUNDOS: 30,
    PONTOS_BASE_ACERTO: 100,
    TEMPO_FLASH_ERRO_MS: 300,
    TEMPO_AVANCO_TREINO_MS: 1500,
    COOLDOWN_RANKING_MS: 3000
  },

  COMBO: {
    FAIXAS: [
      { minAcertos: 14, multiplicador: 4, cor: '#FBBF24', rotulo: '×4 🔥' },
      { minAcertos: 7, multiplicador: 3, cor: '#38BDF8', rotulo: '×3 ⚡' },
      { minAcertos: 3, multiplicador: 2, cor: '#22C55E', rotulo: '×2' },
      { minAcertos: 0, multiplicador: 1, cor: '#E2E8F0', rotulo: '×1' }
    ],
    MARCOS_FOGO: [3, 7, 10, 14, 18, 22, 26, 30],
    MARCOS_CONFETE: [3, 7, 14, 20, 25, 30]
  },

  // Motor Adaptativo + Sistema de Loja estilo Dota Underlords
  ADAPTATIVO: {
    DEGRAU_MIN: 0,
    DEGRAU_MAX: 11,
    CICLO_SUBIDA: [4, 5, 6, 7],
    MAX_SUBIDA_POR_PARTIDA: 2,
    ERROS_PARA_DESCER: 3,
    CHANCE_DEGRAU_ATUAL: 0.70,
    DEGRAU_INICIAL_VETERANO: 3,

    // PROBABILIDADES ESTILO DOTA UNDERLORDS (Tiers 1 a 5):
    // [ % Tier 1 (Básicas <=10), % Tier 2 (Até 19 s/ reserva), % Tier 3 (Dezenas limpas), % Tier 4 (Com Reserva), % Tier 5 (Pesadas) ]
    // Mesmo nos níveis altos, mantém alta % de contas rápidas (Tier 1 e 2) para dar fluidez aos 30s!
    CHANCES_LOJA_TIERS: [
      // Nível 1 de Loja (Início da partida: 0 a 4 acertos)
      { minAcertos: 0, pesos: [85, 15, 0, 0, 0] },
      // Nível 2 de Loja (Aquecido: 5 a 9 acertos)
      { minAcertos: 5, pesos: [60, 28, 12, 0, 0] },
      // Nível 3 de Loja (Ritmo Forte: 10 a 15 acertos — Desbloqueia 10% de chance de Com Reserva)
      { minAcertos: 10, pesos: [45, 28, 17, 10, 0] },
      // Nível 4 de Loja (Combo x4: 16 a 21 acertos — Desbloqueia 5% de Lendárias)
      { minAcertos: 16, pesos: [35, 25, 20, 15, 5] },
      // Nível 5 de Loja (Lenda 22+ acertos — Equilíbrio dinâmico)
      { minAcertos: 22, pesos: [30, 22, 20, 18, 10] }
    ],

    // Definição Pedagógica dos 5 Tiers de Contas
    TIERS_DEFINICAO: {
      1: { tier: 1, nome: 'Comum', somaMin: 2, somaSubMax: 10, difMax: 9, modoReserva: 'proibido', multTabuadas: [2, 5, 10], multFatorMin: 1, multFatorMax: 5, divDivisores: [2, 5, 10], divQuocienteMax: 5 },
      2: { tier: 2, nome: 'Incomum', somaMin: 11, somaSubMax: 19, difMax: 9, modoReserva: 'regra19', multTabuadas: [2, 3, 4, 5, 10], multFatorMin: 2, multFatorMax: 6, divDivisores: [2, 3, 4, 5, 10], divQuocienteMax: 6 },
      3: { tier: 3, nome: 'Raro', somaMin: 20, somaSubMax: 39, difMax: 20, modoReserva: 'proibido', multTabuadas: [2, 3, 4, 5, 6], multFatorMin: 2, multFatorMax: 8, divDivisores: [2, 3, 4, 5, 6], divQuocienteMax: 7 },
      4: { tier: 4, nome: 'Épico', somaMin: 18, somaSubMax: 45, difMax: 22, modoReserva: 'obrigatorio', multTabuadas: [3, 4, 6, 7, 8], multFatorMin: 3, multFatorMax: 8, divDivisores: [3, 4, 6, 7, 8], divQuocienteMax: 8 },
      5: { tier: 5, nome: 'Lendário', somaMin: 35, somaSubMax: 85, difMax: 30, modoReserva: 'obrigatorio', multTabuadas: [6, 7, 8, 9], multFatorMin: 4, multFatorMax: 10, divDivisores: [6, 7, 8, 9], divQuocienteMax: 10 }
    },

    // Tabela de 0 a 11 mantida para compatibilidade com outros módulos
    TABELA_DEGRAUS: [
      { degrau: 0, nivelLojaBase: 0, somaSubMax: 10, difMax: 9, multTabuadas: [2, 5, 10], multFatorMax: 4, divDivisores: [2, 5, 10], divQuocienteMax: 4 },
      { degrau: 1, nivelLojaBase: 0, somaSubMax: 10, difMax: 9, multTabuadas: [2, 5, 10], multFatorMax: 5, divDivisores: [2, 5, 10], divQuocienteMax: 5 },
      { degrau: 2, nivelLojaBase: 0, somaSubMax: 15, difMax: 9, multTabuadas: [2, 3, 5, 10], multFatorMax: 5, divDivisores: [2, 3, 5, 10], divQuocienteMax: 5 },
      { degrau: 3, nivelLojaBase: 1, somaSubMax: 19, difMax: 10, multTabuadas: [2, 3, 4, 5], multFatorMax: 6, divDivisores: [2, 3, 4, 5], divQuocienteMax: 6 },
      { degrau: 4, nivelLojaBase: 1, somaSubMax: 25, difMax: 15, multTabuadas: [2, 3, 4, 5], multFatorMax: 6, divDivisores: [2, 3, 4, 5], divQuocienteMax: 6 },
      { degrau: 5, nivelLojaBase: 1, somaSubMax: 35, difMax: 20, multTabuadas: [2, 3, 4, 5, 6], multFatorMax: 7, divDivisores: [2, 3, 4, 5, 6], divQuocienteMax: 7 },
      { degrau: 6, nivelLojaBase: 2, somaSubMax: 40, difMax: 22, multTabuadas: [2, 3, 4, 5, 6, 7], multFatorMax: 7, divDivisores: [2, 3, 4, 5, 6, 7], divQuocienteMax: 7 },
      { degrau: 7, nivelLojaBase: 2, somaSubMax: 50, difMax: 25, multTabuadas: [3, 4, 5, 6, 7], multFatorMax: 8, divDivisores: [3, 4, 5, 6, 7], divQuocienteMax: 8 },
      { degrau: 8, nivelLojaBase: 2, somaSubMax: 60, difMax: 28, multTabuadas: [3, 4, 6, 7, 8], multFatorMax: 8, divDivisores: [3, 4, 6, 7, 8], divQuocienteMax: 8 },
      { degrau: 9, nivelLojaBase: 3, somaSubMax: 75, difMax: 30, multTabuadas: [4, 6, 7, 8, 9], multFatorMax: 9, divDivisores: [4, 6, 7, 8, 9], divQuocienteMax: 9 },
      { degrau: 10, nivelLojaBase: 3, somaSubMax: 85, difMax: 30, multTabuadas: [6, 7, 8, 9], multFatorMax: 10, divDivisores: [6, 7, 8, 9], divQuocienteMax: 10 },
      { degrau: 11, nivelLojaBase: 3, somaSubMax: 99, difMax: 30, multTabuadas: [6, 7, 8, 9, 10], multFatorMax: 10, divDivisores: [6, 7, 8, 9, 10], divQuocienteMax: 10 }
    ]
  },

  OPERACOES: {
    adicao: { nome: 'Adição', simbolo: '+', icone: '➕' },
    subtracao: { nome: 'Subtração', simbolo: '−', icone: '➖' },
    multiplicacao: { nome: 'Multiplicação', simbolo: '×', icone: '✖️' },
    divisao: { nome: 'Divisão', simbolo: '÷', icone: '➗' },
    mestre: { nome: 'Modo Mestre', simbolo: '👑', icone: '👑' }
  },

  MASCOTES: {
    coruja: {
      emoji: '🦉',
      nome: 'Coruja Sábia',
      falaInicial: 'Use a mente mágica! Se precisar, clique em 💡 Ajuda.',
      falasAcerto: ['Muito bem pensado!', 'Excelente raciocínio!', 'Você está voando alto!'],
      falasErro: ['Quase lá! Que tal ligar a 💡 Ajuda para ver o passo a passo?', 'Respire fundo e observe as unidades!']
    },
    raposa: {
      emoji: '🦊',
      nome: 'Raposa Veloz',
      falaInicial: 'Preparado para acender a chama do combo? Vamos nessa!',
      falasAcerto: ['Uau, que rapidez!', 'Chama subindo! Continue assim! 🔥', 'Ninguém segura você!'],
      falasErro: ['Opa, tropeçamos! Vamos reacender o combo na próxima!']
    },
    tartaruga: {
      emoji: '🐢',
      nome: 'Tartaruga Zen',
      falaInicial: 'Sem pressa! O importante é entender cada passo.',
      falasAcerto: ['Passo a passo a gente chega longe!', 'Certíssimo! Calma e precisão!', 'Boa!'],
      falasErro: ['Tudo bem errar! Olhe com calma para a resposta certa.']
    }
  },

  CONQUISTAS: [
    { id: 'acertos_totais', titulo: 'Mago dos Números', descricao: 'Acertos totais acumulados', metas: [25, 100, 500] },
    { id: 'sequencia_max', titulo: 'Raio Implacável', descricao: 'Acertos seguidos numa partida', metas: [5, 10, 20] },
    { id: 'partidas_jog', titulo: 'Aprendiz Dedicado', descricao: 'Partidas jogadas', metas: [50, 150, 400] },
    { id: 'dias_ativos', titulo: 'Guardião do Tempo', descricao: 'Dias diferentes praticando', metas: [2, 5, 10] },
    { id: 'partidas_perf', titulo: 'Precisão Cristalina', descricao: 'Partidas sem nenhum erro', metas: [1, 5, 10] },
    { id: 'combo_4x', titulo: 'Chama Dourada ×4', descricao: 'Vezes que alcançou o combo ×4', metas: [1, 10, 50] },
    { id: 'acertos_treino', titulo: 'Mestre Zen', descricao: 'Acertos no Modo Treino', metas: [30, 80, 150] },
    { id: 'pontos_adicao', titulo: 'Mestre da Adição', descricao: 'Recorde de pontos na Adição', metas: [500, 3000, 10000] },
    { id: 'pontos_subtracao', titulo: 'Mestre da Subtração', descricao: 'Recorde de pontos na Subtração', metas: [500, 3000, 10000] },
    { id: 'pontos_multiplicacao', titulo: 'Mestre da Multiplicação', descricao: 'Recorde de pontos na Multiplicação', metas: [500, 3000, 10000] },
    { id: 'pontos_divisao', titulo: 'Mestre da Divisão', descricao: 'Recorde de pontos na Divisão', metas: [500, 3000, 10000] },
    { id: 'pontos_mestre', titulo: 'Mestre Supremo', descricao: 'Recorde de pontos no Modo Mestre', metas: [500, 3000, 10000] }
  ]
};