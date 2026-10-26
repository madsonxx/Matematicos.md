/* ==========================================================================
   4. js/motor.js — Sorteio de Contas e Motor Adaptativo Invisível (window.Motor)
   Implementa:
   - Degraus 0 a 11 conforme tabela oficial do DECISOES.md
   - Grey area: 70% degrau atual (N) e 30% degrau anterior (N-1)
   - Rampa interna suave dentro do mesmo degrau
   - Subida no ciclo 3 -> 5 -> 7 -> 9 (máx +1 degrau de ganho líquido por partida)
   - Descida após 3 erros seguidos
   - Garantias matemáticas: Adição <= 99, Subtração >= 0 (dif <= 30), Divisão exata
   ========================================================================== */

window.Motor = {
  operacaoEscolhida: 'adicao',
  degrauInicialPartida: 0,
  degrauAtual: 0,
  indiceCicloSubida: 0,      // Aponta para [3, 5, 7, 9]
  acertosSeguidosDegrau: 0,
  errosSeguidosDegrau: 0,
  contasGeradasNaPartida: 0,
  ultimaChaveConta: '',
  contaAtual: null,

  // Inicializa o motor para uma nova partida carregando o degrau salvo do aluno
  iniciarPartida: function (operacao) {
    this.operacaoEscolhida = operacao || 'adicao';
    this.degrauInicialPartida = window.Dados.obterDegrauOperacao(this.operacaoEscolhida);
    this.degrauAtual = this.degrauInicialPartida;
    this.indiceCicloSubida = 0;
    this.acertosSeguidosDegrau = 0;
    this.errosSeguidosDegrau = 0;
    this.contasGeradasNaPartida = 0;
    this.ultimaChaveConta = '';
    this.contaAtual = null;
  },

  // Utilitário: sorteia inteiro entre min e max (inclusive)
  _intAleatorio: function (min, max) {
    if (max < min) max = min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Utilitário: escolhe um item aleatório de um array
  _escolherItem: function (lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  },

  // Escolhe o degrau da questão aplicando a regra da Grey Area (70% N, 30% N-1)
  _sortearDegrauEfetivo: function () {
    if (this.degrauAtual <= 0) return 0;
    var chanceAtual = window.CONFIG.ADAPTATIVO.CHANCE_DEGRAU_ATUAL || 0.70;
    return Math.random() < chanceAtual ? this.degrauAtual : (this.degrauAtual - 1);
  },

  // Rampa interna suave: nas primeiras 2 contas da partida usa até 75% do teto da faixa
  _aplicarRampaInterna: function (limiteMaximo, minimoSeguranca) {
    if (this.contasGeradasNaPartida < 2) {
      return Math.max(minimoSeguranca, Math.ceil(limiteMaximo * 0.75));
    }
    return limiteMaximo;
  },

  // 1. Gerador de ADIÇÃO (Resultado nunca passa de somaSubMax nem de 99)
  _gerarAdicao: function (faixa) {
    var tetoSoma = Math.min(99, this._aplicarRampaInterna(faixa.somaSubMax, 4));
    var minSoma = faixa.degrau >= 4 ? Math.max(4, Math.floor(tetoSoma * 0.35)) : 2;
    var resultado = this._intAleatorio(minSoma, tetoSoma);
    var numA = this._intAleatorio(1, resultado - 1);
    var numB = resultado - numA;

    return {
      numA: numA,
      numB: numB,
      operacao: 'adicao',
      simbolo: '+',
      resposta: resultado,
      texto: numA + ' + ' + numB + ' ='
    };
  },

  // 2. Gerador de SUBTRAÇÃO (Nunca negativa e diferença <= difMax / <= 30)
  _gerarSubtracao: function (faixa) {
    var tetoMinuendo = Math.min(99, this._aplicarRampaInterna(faixa.somaSubMax, 4));
    var minMinuendo = faixa.degrau >= 4 ? Math.max(4, Math.floor(tetoMinuendo * 0.35)) : 2;
    var numA = this._intAleatorio(minMinuendo, tetoMinuendo);

    // Garante que o resultado (diferença = numA - numB) seja >= 0 e <= difMax (máx 30 nos degraus altos)
    var maxDiferenca = Math.min(numA, faixa.difMax, 30);
    var minDiferenca = numA > 2 ? 1 : 0;
    var resposta = this._intAleatorio(minDiferenca, maxDiferenca);
    var numB = numA - resposta;

    return {
      numA: numA,
      numB: numB,
      operacao: 'subtracao',
      simbolo: '−',
      resposta: resposta,
      texto: numA + ' − ' + numB + ' ='
    };
  },

  // 3. Gerador de MULTIPLICAÇÃO (Respeita as tabuadas e fator máximo do degrau)
  _gerarMultiplicacao: function (faixa) {
    var tabuada = this._escolherItem(faixa.multTabuadas);
    var tetoFator = this._aplicarRampaInterna(faixa.multFatorMax, 2);
    var fator = this._intAleatorio(1, tetoFator);

    // Alterna ordem dos fatores em 50% das vezes para variar visualmente
    var inverter = Math.random() < 0.5;
    var numA = inverter ? fator : tabuada;
    var numB = inverter ? tabuada : fator;

    return {
      numA: numA,
      numB: numB,
      operacao: 'multiplicacao',
      simbolo: '×',
      resposta: numA * numB,
      texto: numA + ' × ' + numB + ' ='
    };
  },

  // 4. Gerador de DIVISÃO (Sempre exata: sorteia divisor e quociente para achar o dividendo)
  _gerarDivisao: function (faixa) {
    var divisor = this._escolherItem(faixa.divDivisores);
    var tetoQuociente = this._aplicarRampaInterna(faixa.divQuocienteMax, 2);
    var quociente = this._intAleatorio(1, tetoQuociente);
    var dividendo = divisor * quociente;

    return {
      numA: dividendo,
      numB: divisor,
      operacao: 'divisao',
      simbolo: '÷',
      resposta: quociente,
      texto: dividendo + ' ÷ ' + divisor + ' ='
    };
  },

  // Sorteia a próxima conta (evitando repetir exatamente a mesma conta seguida)
  sortearConta: function () {
    var degrauSorteado = this._sortearDegrauEfetivo();
    var tabela = window.CONFIG.ADAPTATIVO.TABELA_DEGRAUS;
    var faixa = tabela[degrauSorteado] || tabela[0];

    var operacoesPossiveis = ['adicao', 'subtracao', 'multiplicacao', 'divisao'];
    var conta = null;
    var tentativas = 0;

    do {
      var opReal = this.operacaoEscolhida === 'mestre'
        ? this._escolherItem(operacoesPossiveis)
        : this.operacaoEscolhida;

      if (opReal === 'adicao') {
        conta = this._gerarAdicao(faixa);
      } else if (opReal === 'subtracao') {
        conta = this._gerarSubtracao(faixa);
      } else if (opReal === 'multiplicacao') {
        conta = this._gerarMultiplicacao(faixa);
      } else {
        conta = this._gerarDivisao(faixa);
      }

      tentativas++;
    } while (conta.texto === this.ultimaChaveConta && tentativas < 6);

    this.ultimaChaveConta = conta.texto;
    this.contasGeradasNaPartida++;
    this.contaAtual = conta;
    return conta;
  },

  // Processa acerto ou erro no motor adaptativo (Ciclo 3->5->7->9 e trava de +1 por partida)
  registrarResposta: function (acertou) {
    var cfg = window.CONFIG.ADAPTATIVO;
    var mudouDegrau = false;
    var atingiuTopo11 = false;

    if (acertou) {
      this.acertosSeguidosDegrau++;
      this.errosSeguidosDegrau = 0;

      var ciclo = cfg.CICLO_SUBIDA || [3, 5, 7, 9];
      var metaAcertos = ciclo[Math.min(this.indiceCicloSubida, ciclo.length - 1)];

      // Sobe no máximo +1 degrau acima do degrau em que começou a partida
      var tetoPartida = Math.min(cfg.DEGRAU_MAX, this.degrauInicialPartida + (cfg.MAX_SUBIDA_POR_PARTIDA || 1));

      if (this.acertosSeguidosDegrau >= metaAcertos) {
        this.acertosSeguidosDegrau = 0;
        if (this.indiceCicloSubida < ciclo.length - 1) {
          this.indiceCicloSubida++;
        }

        if (this.degrauAtual < tetoPartida) {
          this.degrauAtual++;
          mudouDegrau = true;
          if (this.degrauAtual === cfg.DEGRAU_MAX) {
            atingiuTopo11 = true;
          }
        }
      }
    } else {
      // Errou: zera contagem de subida e acumula erro para descida (3 erros seguidos)
      this.acertosSeguidosDegrau = 0;
      this.errosSeguidosDegrau++;

      if (this.errosSeguidosDegrau >= (cfg.ERROS_PARA_DESCER || 3)) {
        this.errosSeguidosDegrau = 0;
        var pisoMinimo = cfg.DEGRAU_MIN || 0;
        if (this.degrauAtual > pisoMinimo) {
          this.degrauAtual--;
          mudouDegrau = true;
        }
      }
    }

    // Salva imediatamente no localStorage se o degrau do aluno mudou
    if (mudouDegrau) {
      window.Dados.salvarDegrauOperacao(this.operacaoEscolhida, this.degrauAtual, atingiuTopo11);
    }

    return {
      mudouDegrau: mudouDegrau,
      novoDegrau: this.degrauAtual
    };
  }
};