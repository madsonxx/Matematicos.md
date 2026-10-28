/* ==========================================================================
   1. js/config.js — Configurações Centralizadas (window.CONFIG)
   Toda regra de negócio, pontuação, cores, textos e degraus ficam aqui.
   ========================================================================== */

window.CONFIG = {
  // Identificação do projeto
  NOME_JOGO: 'MATEMÁGICOS',
  VERSAO: '1.3.0',

  // Chave raiz para armazenamento no navegador (localStorage)
  CHAVE_STORAGE: 'MATEMAGICOS_DADOS_V1',

  // URL do Google Apps Script para o Ranking da Turma
  URL_PLANILHA_RANKING: 'https://script.google.com/macros/s/AKfycbxGSk_foYrDo13aLvDDgKZVgC72crUh78h_d2DQeTMxLSXEODkZCZtyoHAEQD68gcqd/exec',
  RANKING_URL: 'https://script.google.com/macros/s/AKfycbxGSk_foYrDo13aLvDDgKZVgC72crUh78h_d2DQeTMxLSXEODkZCZtyoHAEQD68gcqd/exec',

  // Paleta de Cores "Meia-Noite"
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
    COOLDOWN_RANKING_MS: 3000       // 3s entre envios para a planilha
  },

  // Tabela de Combo, Multiplicadores e Marcos de Fogo Neon
  COMBO: {
    FAIXAS: [
      { minAcertos: 14, multiplicador: 4, cor: '#FBBF24', rotulo: '×4 🔥' },
      { minAcertos: 7, multiplicador: 3, cor: '#38BDF8', rotulo: '×3 ⚡' },
      { minAcertos: 3, multiplicador: 2, cor: '#22C55E', rotulo: '×2' },
      { minAcertos: 0, multiplicador: 1, cor: '#E2E8F0', rotulo: '×1' }
    ],
    MARCOS_FOGO: [3, 7, 10, 14, 18, 22, 26, 30],
    MARCOS_CONFETE: [3, 7, 14, 20, 25, 30] // Mantido por retrocompatibilidade
  },

  // Regras do Motor Adaptativo Invisível (12 Degraus Reais: 0 a 11)
  ADAPTATIVO: {
    DEGRAU_MIN: 0,
    DEGRAU_MAX: 11,
    // Ciclo dinâmico: sobe rápido no início da sequência (2, depois +3, +3, +4)
    CICLO_SUBIDA: [2, 3, 3, 4],
    MAX_SUBIDA_POR_PARTIDA: 5,
    ERROS_PARA_DESCER: 2,
    CHANCE_DEGRAU_ATUAL: 0.70,
    DEGRAU_INICIAL_VETERANO: 3,

    // 12 Marcos Pedagógicos Distintos (Sem degraus gêmeos duplicados)
    // modoReserva: 'proibido' | 'ponte10' | 'opcional' | 'obrigatorio'
    TABELA_DEGRAUS: [
      // Degrau 0: Fatos iniciais até 6 (contagem direta)
      { degrau: 0, somaMin: 2, somaSubMax: 6, difMax: 6, modoReserva: 'proibido', multTabuadas: [2, 10], multFatorMin: 1, multFatorMax: 3, divDivisores: [2, 10], divQuocienteMax: 3 },
      // Degrau 1: Fatos básicos até 10 (complementos de 10)
      { degrau: 1, somaMin: 5, somaSubMax: 10, difMax: 9, modoReserva: 'proibido', multTabuadas: [2, 5, 10], multFatorMin: 1, multFatorMax: 4, divDivisores: [2, 5, 10], divQuocienteMax: 4 },
      // Degrau 2: Ponte do 10 (Parcelas de 1 dígito que somam entre 11 e 18, ex: 7+5, 8+6)
      { degrau: 2, somaMin: 11, somaSubMax: 18, difMax: 9, modoReserva: 'ponte10', multTabuadas: [2, 3, 5, 10], multFatorMin: 2, multFatorMax: 5, divDivisores: [2, 3, 5, 10], divQuocienteMax: 5 },
      // Degrau 3: Regra do 19 (Dezena + Unidade até 19 SEM reagrupamento: ex 12+5, 18-6)
      { degrau: 3, somaMin: 12, somaSubMax: 19, difMax: 9, modoReserva: 'proibido', multTabuadas: [2, 3, 4, 5], multFatorMin: 2, multFatorMax: 5, divDivisores: [2, 3, 4, 5], divQuocienteMax: 5 },
      // Degrau 4: Transição do 20 COM reagrupamento leve (ex: 14+7=21, 22-5=17)
      { degrau: 4, somaMin: 19, somaSubMax: 26, difMax: 12, modoReserva: 'obrigatorio', multTabuadas: [2, 3, 4, 5, 6], multFatorMin: 2, multFatorMax: 6, divDivisores: [2, 3, 4, 5, 6], divQuocienteMax: 6 },
      // Degrau 5: Dezenas até 35 SEM reagrupamento (Foco em valor posicional limpo: ex 21+13, 34-12)
      { degrau: 5, somaMin: 20, somaSubMax: 35, difMax: 20, modoReserva: 'proibido', multTabuadas: [2, 3, 4, 5, 6], multFatorMin: 3, multFatorMax: 7, divDivisores: [2, 3, 4, 5, 6], divQuocienteMax: 7 },
      // Degrau 6: Dezenas até 40 COM reagrupamento obrigatório ("Vai 1 / Empresta")
      { degrau: 6, somaMin: 22, somaSubMax: 40, difMax: 22, modoReserva: 'obrigatorio', multTabuadas: [3, 4, 5, 6, 7], multFatorMin: 3, multFatorMax: 7, divDivisores: [3, 4, 5, 6, 7], divQuocienteMax: 7 },
      // Degrau 7: Agilidade mental até 55 SEM reagrupamento (Cálculo mental rápido com dezenas médias)
      { degrau: 7, somaMin: 30, somaSubMax: 55, difMax: 25, modoReserva: 'proibido', multTabuadas: [3, 4, 6, 7, 8], multFatorMin: 3, multFatorMax: 8, divDivisores: [3, 4, 6, 7, 8], divQuocienteMax: 8 },
      // Degrau 8: Até 60 COM reagrupamento obrigatório
      { degrau: 8, somaMin: 32, somaSubMax: 60, difMax: 28, modoReserva: 'obrigatorio', multTabuadas: [4, 5, 6, 7, 8], multFatorMin: 4, multFatorMax: 8, divDivisores: [4, 5, 6, 7, 8], divQuocienteMax: 8 },
      // Degrau 9: Até 75 Misto (Alterna com e sem reserva para leitura atenta da coluna U)
      { degrau: 9, somaMin: 40, somaSubMax: 75, difMax: 30, modoReserva: 'opcional', multTabuadas: [4, 6, 7, 8, 9], multFatorMin: 4, multFatorMax: 9, divDivisores: [4, 6, 7, 8, 9], divQuocienteMax: 9 },
      // Degrau 10: Até 90 COM reagrupamento forte (Foco em unidades 6, 7, 8, 9)
      { degrau: 10, somaMin: 48, somaSubMax: 90, difMax: 30, modoReserva: 'obrigatorio', multTabuadas: [6, 7, 8, 9], multFatorMin: 4, multFatorMax: 10, divDivisores: [6, 7, 8, 9], divQuocienteMax: 10 },
      // Degrau 11: Nível Mestre (Até 99 com reagrupamento intenso e tabuadas completas)
      { degrau: 11, somaMin: 55, somaSubMax: 99, difMax: 35, modoReserva: 'obrigatorio', multTabuadas: [6, 7, 8, 9, 10, 11, 12], multFatorMin: 5, multFatorMax: 10, divDivisores: [6, 7, 8, 9, 10], divQuocienteMax: 10 }
    ]
  },

  // Nomes e símbolos amigáveis das operações
  OPERACOES: {
    adicao: { nome: 'Adição', simbolo: '+', icone: '➕' },
    subtracao: { nome: 'Subtração', simbolo: '−', icone: '➖' },
    multiplicacao: { nome: 'Multiplicação', simbolo: '×', icone: '✖️' },
    divisao: { nome: 'Divisão', simbolo: '÷', icone: '➗' },
    mestre: { nome: 'Modo Mestre', simbolo: '👑', icone: '👑' }
  },

  // Mascotes
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

  // Metas das Conquistas (incluindo as pontuações por operação)
  CONQUISTAS: [
    { id: 'acertos_totais', titulo: 'Mago dos Números', descricao: 'Acertos totais acumulados', metas: [25, 100, 500] },
    { id: 'sequencia_max', titulo: 'Raio Implacável', descricao: 'Acertos seguidos numa partida', metas: [5, 10, 20] },
    { id: 'partidas_jog', titulo: 'Aprendiz Dedicado', descricao: 'Partidas jogadas', metas: [50, 150, 400] },
    { id: 'dias_ativos', titulo: 'Guardião do Tempo', descricao: 'Dias diferentes praticando', metas: [2, 5, 10] },
    { id: 'partidas_perf', titulo: 'Precisão Cristalina', descricao: 'Partidas sem nenhum erro', metas: [1, 5, 10] },
    { id: 'combo_4x', titulo: 'Chama Dourada ×4', descricao: 'Vezes que alcançou o combo ×4', metas: [1, 10, 50] },
    { id: 'acertos_treino', titulo: 'Mestre Zen', descricao: 'Acertos no Modo Treino', metas: [30, 80, 150] },

    // Conquistas por Operação (Pontuações)
    { id: 'pontos_adicao', titulo: 'Mestre da Adição', descricao: 'Recorde de pontos na Adição', metas: [500, 3000, 10000] },
    { id: 'pontos_subtracao', titulo: 'Mestre da Subtração', descricao: 'Recorde de pontos na Subtração', metas: [500, 3000, 10000] },
    { id: 'pontos_multiplicacao', titulo: 'Mestre da Multiplicação', descricao: 'Recorde de pontos na Multiplicação', metas: [500, 3000, 10000] },
    { id: 'pontos_divisao', titulo: 'Mestre da Divisão', descricao: 'Recorde de pontos na Divisão', metas: [500, 3000, 10000] },
    { id: 'pontos_mestre', titulo: 'Mestre Supremo', descricao: 'Recorde de pontos no Modo Mestre', metas: [500, 3000, 10000] }
  ]
};