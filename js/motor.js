/* ==========================================================================
   4. js/motor.js — Motor Adaptativo Estilo "Dota Underlords" + Exclusão (window.Motor)
   Implementa:
   - Sistema de Roleta de Tiers (1 a 5): mantém alta % de contas básicas rápidas
     enquanto desbloqueia gradualmente a chance de contas mais desafiadoras.
   - Regra de Respiro: nunca sorteia duas contas pesadas (Tier 4 ou 5) seguidas!
   - Diagnóstico por Exclusão 100% em RAM durante a partida.
   ========================================================================== */

window.Motor = {
  operacaoEscolhida: 'adicao',
  degrauInicialPartida: 0,
  degrauAtual: 0,
  indiceCicloSubida: 0,
  acertosSeguidosDegrau: 0,
  acertosNaPartida: 0,
  acertosSeguidosPartida: 0,
  errosSeguidosDegrau: 0,
  atingiuTopo11NestaPartida: false,
  contasGeradasNaPartida: 0,
  ultimoTierSorteado: 1,
  ultimaChaveConta: '',
  contaAtual: null,

  diagSessao: null,
  deltasSessao: null,

  iniciarPartida: function (operacao) {
    this.operacaoEscolhida = operacao || 'adicao';
    this.degrauInicialPartida = window.Dados.obterDegrauOperacao(this.operacaoEscolhida);
    this.degrauAtual = this.degrauInicialPartida;
    this.indiceCicloSubida = 0;
    this.acertosSeguidosDegrau = 0;
    this.acertosNaPartida = 0;
    this.acertosSeguidosPartida = 0;
    this.errosSeguidosDegrau = 0;
    this.atingiuTopo11NestaPartida = false;
    this.contasGeradasNaPartida = 0;
    this.ultimoTierSorteado = 1;
    this.ultimaChaveConta = '';
    this.contaAtual = null;

    this.diagSessao = {
      adicao: window.Dados.obterDiagnosticoOperacao ? window.Dados.obterDiagnosticoOperacao('adicao') : [0, 0, 0, 0, 0, 0, 0, 0],
      subtracao: window.Dados.obterDiagnosticoOperacao ? window.Dados.obterDiagnosticoOperacao('subtracao') : [0, 0, 0, 0, 0, 0, 0, 0],
      multiplicacao: window.Dados.obterDiagnosticoOperacao ? window.Dados.obterDiagnosticoOperacao('multiplicacao') : [0, 0, 0, 0, 0, 0, 0, 0],
      divisao: window.Dados.obterDiagnosticoOperacao ? window.Dados.obterDiagnosticoOperacao('divisao') : [0, 0, 0, 0, 0, 0, 0, 0]
    };

    this.deltasSessao = {
      adicao: [0, 0, 0, 0, 0, 0, 0, 0],
      subtracao: [0, 0, 0, 0, 0, 0, 0, 0],
      multiplicacao: [0, 0, 0, 0, 0, 0, 0, 0],
      divisao: [0, 0, 0, 0, 0, 0, 0, 0]
    };
  },

  _intAleatorio: function (min, max) {
    if (max < min) max = min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  _escolherItem: function (lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  },

  // Analisa o micro-array [bA, bE, mA, mE, aA, aE, erroSemRes, erroComRes] por EXCLUSÃO
  _analisarPerfilPorExclusao: function (opReal) {
    var d = (this.diagSessao && this.diagSessao[opReal]) ? this.diagSessao[opReal] : [0, 0, 0, 0, 0, 0, 0, 0];
    var mA = d[2], mE = d[3];
    var aA = d[4], aE = d[5];
    var erroSemRes = d[6], erroComRes = d[7];

    var gargaloMedia = ((mA + mE) >= 4) && (mE > mA);
    var gargaloNumeroAlto = ((aA + aE) >= 3) && (aE >= aA);
    var gargaloReserva = (erroComRes >= 3) && (erroComRes > (erroSemRes + 1));

    return {
      gargaloMedia: gargaloMedia,
      gargaloNumeroAlto: gargaloNumeroAlto,
      gargaloReserva: gargaloReserva
    };
  },

  /**
   * Sorteia o Tier da próxima conta como a Loja do Dota Underlords:
   * - Usa os acertos na partida + bônus leve do degrau do aluno para definir os pesos [T1, T2, T3, T4, T5]
   * - Aplica a Regra de Exclusão: se o aluno tem gargalo em Número Alto, zera o peso do Tier 5 e foca no Tier 2/3.
   * - Regra de Respiro: se a última conta já foi Tier 4 ou 5, a próxima é garantida ser Tier 1 ou 2 (rápida)!
   */
  _sortearFaixaUnderlords: function (opReal) {
    var cfg = window.CONFIG.ADAPTATIVO;
    var definicoes = cfg.TIERS_DEFINICAO;
    var tabelaChances = cfg.CHANCES_LOJA_TIERS;

    // As 2 primeiras contas da partida são sempre Tier 1 (aquecimento instantâneo)
    if (this.contasGeradasNaPartida < 2) {
      this.ultimoTierSorteado = 1;
      return definicoes[1];
    }

    // Regra de Respiro para não sufocar no tempo de 30s:
    // Depois de uma conta pesada (Tier 4 ou 5), dá uma conta rápida (Tier 1 ou 2)
    if (this.ultimoTierSorteado >= 4) {
      var tierRespiro = Math.random() < 0.70 ? 1 : 2;
      this.ultimoTierSorteado = tierRespiro;
      return definicoes[tierRespiro];
    }

    // Calcula os acertos efetivos somando um pequeno bônus se o aluno já for veterano
    var bonusDegrau = Math.floor(this.degrauAtual / 3) * 2;
    var progressoLoja = this.acertosNaPartida + bonusDegrau;

    var pesosOriginais = tabelaChances[0].pesos;
    for (var i = tabelaChances.length - 1; i >= 0; i--) {
      if (progressoLoja >= tabelaChances[i].minAcertos) {
        pesosOriginais = tabelaChances[i].pesos;
        break;
      }
    }

    var pesos = pesosOriginais.slice(); // [T1, T2, T3, T4, T5]
    var perfil = this._analisarPerfilPorExclusao(opReal);

    // EXCLUSÃO: Se o aluno trava em números altos (>25), bloqueia Tier 5 e reduz Tier 3/4, mantendo foco em T1/T2
    if (perfil.gargaloNumeroAlto) {
      pesos[1] += pesos[4] + Math.floor(pesos[3] / 2);
      pesos[3] = Math.ceil(pesos[3] / 2);
      pesos[4] = 0;
    } else if (perfil.gargaloMedia) {
      // Se ainda erra faixa média (11..25), segura no Tier 1 e Tier 2
      pesos[0] += pesos[3] + pesos[4];
      pesos[3] = 0;
      pesos[4] = 0;
    }

    // Roleta ponderada (soma dos pesos = 100)
    var somaTotal = 0;
    for (var p = 0; p < pesos.length; p++) {
      somaTotal += pesos[p];
    }

    var sorteio = Math.random() * somaTotal;
    var acumulado = 0;
    var tierEscolhido = 1;

    for (var t = 0; t < pesos.length; t++) {
      acumulado += pesos[t];
      if (sorteio <= acumulado) {
        tierEscolhido = t + 1;
        break;
      }
    }

    this.ultimoTierSorteado = tierEscolhido;
    return definicoes[tierEscolhido] || definicoes[1];
  },

  // 1. Gerador de ADIÇÃO
  _gerarAdicao: function (faixa) {
    var teto = Math.min(99, faixa.somaSubMax);
    var piso = Math.max(2, Math.min(faixa.somaMin || 2, teto - 2));
    var modo = faixa.modoReserva;

    var numA = 2, numB = 3, resultado = 5;
    var gerou = false;

    // Tier 2 ('regra19'): 50% Regra do 19 sem reserva (12+5) e 50% Ponte do 10 simples (7+5)
    if (modo === 'regra19') {
      if (Math.random() < 0.55) {
        numA = this._intAleatorio(10, 16);
        numB = this._intAleatorio(2, 19 - numA);
        resultado = numA + numB;
      } else {
        numA = this._intAleatorio(5, 9);
        numB = this._intAleatorio(Math.max(2, 11 - numA), 8);
        resultado = numA + numB;
      }
      gerou = true;
    }

    // Tier 4 e 5 ('obrigatorio' — Com "Vai 1")
    if (!gerou && modo === 'obrigatorio') {
      for (var t = 0; t < 20; t++) {
        var uA = this._intAleatorio(3, 9);
        var uB = this._intAleatorio(10 - uA, 9);
        var somaUnidades = uA + uB;
        var maxDezenas = Math.floor((teto - somaUnidades) / 10);

        if (maxDezenas >= 1) {
          var dA = this._intAleatorio(1, maxDezenas);
          var restDez = maxDezenas - dA;
          var dB = restDez > 0 ? this._intAleatorio(0, restDez) : 0;

          var candA = dA * 10 + uA;
          var candB = dB * 10 + uB;
          var candSoma = candA + candB;

          if (candSoma >= piso && candSoma <= teto && candSoma <= 99) {
            numA = candA;
            numB = candB;
            resultado = candSoma;
            gerou = true;
            break;
          }
        }
      }
    }

    // Tier 1 e Tier 3 ('proibido' — Sem reagrupamento para cálculo mental rápido)
    if (!gerou && modo === 'proibido') {
      for (var s = 0; s < 20; s++) {
        var uA2 = this._intAleatorio(1, 7);
        var uB2 = this._intAleatorio(1, 9 - uA2);
        var maxDez2 = Math.floor((teto - (uA2 + uB2)) / 10);
        var dA2 = maxDez2 > 0 ? this._intAleatorio(0, maxDez2) : 0;
        var dB2 = (maxDez2 - dA2) > 0 ? this._intAleatorio(0, maxDez2 - dA2) : 0;

        var cA = dA2 * 10 + uA2;
        var cB = dB2 * 10 + uB2;
        if (cA >= 1 && cB >= 1 && (cA + cB) >= piso && (cA + cB) <= teto) {
          numA = cA;
          numB = cB;
          resultado = cA + cB;
          gerou = true;
          break;
        }
      }
    }

    if (!gerou) {
      resultado = this._intAleatorio(piso, teto);
      numA = this._intAleatorio(1, resultado - 1);
      numB = resultado - numA;
    }

    if (Math.random() < 0.5) {
      var temp = numA;
      numA = numB;
      numB = temp;
    }

    var temReagrupamento = ((numA % 10) + (numB % 10)) >= 10;

    return {
      numA: numA,
      numB: numB,
      operacao: 'adicao',
      simbolo: '+',
      resposta: resultado,
      tier: faixa.tier || 1,
      formatoVertical: true,
      temReagrupamento: temReagrupamento,
      texto: numA + ' + ' + numB + ' ='
    };
  },

  // 2. Gerador de SUBTRAÇÃO
  _gerarSubtracao: function (faixa) {
    var teto = Math.min(99, faixa.somaSubMax);
    var piso = Math.max(3, Math.min(faixa.somaMin || 3, teto - 2));
    var limiteDif = Math.min(faixa.difMax || 30, 30);
    var modo = faixa.modoReserva;

    var numA = 6, numB = 2, resposta = 4;
    var gerou = false;

    // Tier 2 ('regra19'): Dezena até 19 sem empréstimo (ex: 17 - 5 = 12) ou Ponte 10 (13 - 5 = 8)
    if (modo === 'regra19') {
      if (Math.random() < 0.65) {
        numA = this._intAleatorio(12, 19);
        numB = this._intAleatorio(2, numA % 10);
        resposta = numA - numB;
      } else {
        numA = this._intAleatorio(11, 16);
        numB = this._intAleatorio((numA % 10) + 1, 8);
        resposta = numA - numB;
      }
      gerou = true;
    }

    // Tier 4 e 5 ('obrigatorio' — Com Empréstimo)
    if (!gerou && teto >= 20 && modo === 'obrigatorio') {
      for (var t = 0; t < 25; t++) {
        var uA = this._intAleatorio(0, 7);
        var uB = this._intAleatorio(uA + 1, 9);
        var maxDezenaA = Math.floor((teto - uA) / 10);

        if (maxDezenaA >= 2) {
          var dA = this._intAleatorio(2, maxDezenaA);
          var candA = dA * 10 + uA;
          var dBMin = Math.max(0, dA - Math.floor(limiteDif / 10));
          var dBMax = dA - 1;

          if (dBMax >= dBMin) {
            var dB = this._intAleatorio(dBMin, dBMax);
            var candB = dB * 10 + uB;
            var candResp = candA - candB;

            if (candA >= piso && candA <= teto && candResp >= 2 && candResp <= limiteDif) {
              numA = candA;
              numB = candB;
              resposta = candResp;
              gerou = true;
              break;
            }
          }
        }
      }
    }

    // Tier 1 e Tier 3 ('proibido' — Sem Empréstimo)
    if (!gerou && modo === 'proibido') {
      for (var s = 0; s < 20; s++) {
        var uA2 = this._intAleatorio(2, 9);
        var uB2 = this._intAleatorio(1, uA2);
        var maxDezA = Math.floor((teto - uA2) / 10);
        var minDezA = teto >= 20 ? 2 : 0;
        var dA2 = maxDezA >= minDezA ? this._intAleatorio(minDezA, maxDezA) : 0;
        var dB2 = dA2 > 0 ? this._intAleatorio(0, dA2 - (uA2 === uB2 ? 1 : 0)) : 0;

        var cA = dA2 * 10 + uA2;
        var cB = dB2 * 10 + uB2;
        var cResp = cA - cB;

        if (cA >= piso && cA <= teto && cB >= 1 && cResp >= 1 && cResp <= limiteDif) {
          numA = cA;
          numB = cB;
          resposta = cResp;
          gerou = true;
          break;
        }
      }
    }

    if (!gerou) {
      numA = this._intAleatorio(piso, teto);
      var maxDif = Math.min(numA - 1, limiteDif);
      resposta = this._intAleatorio(1, Math.max(1, maxDif));
      numB = numA - resposta;
    }

    var temReagrupamento = ((numA % 10) < (numB % 10));

    return {
      numA: numA,
      numB: numB,
      operacao: 'subtracao',
      simbolo: '−',
      resposta: resposta,
      tier: faixa.tier || 1,
      formatoVertical: true,
      temReagrupamento: temReagrupamento,
      texto: numA + ' − ' + numB + ' ='
    };
  },

  // 3. Gerador de MULTIPLICAÇÃO
  _gerarMultiplicacao: function (faixa) {
    var tabuada = this._escolherItem(faixa.multTabuadas);
    var minFator = faixa.multFatorMin || 1;
    var maxFator = Math.max(minFator, faixa.multFatorMax || 5);
    var fator = this._intAleatorio(minFator, maxFator);

    var inverter = Math.random() < 0.5;
    var numA = inverter ? fator : tabuada;
    var numB = inverter ? tabuada : fator;

    return {
      numA: numA,
      numB: numB,
      operacao: 'multiplicacao',
      simbolo: '×',
      resposta: numA * numB,
      tier: faixa.tier || 1,
      formatoVertical: false,
      temReagrupamento: false,
      texto: numA + ' × ' + numB + ' ='
    };
  },

  // 4. Gerador de DIVISÃO
  _gerarDivisao: function (faixa) {
    var divisor = this._escolherItem(faixa.divDivisores);
    var minQuociente = (faixa.tier || 1) >= 3 ? 2 : 1;
    var maxQuociente = Math.max(minQuociente, faixa.divQuocienteMax || 5);
    var quociente = this._intAleatorio(minQuociente, maxQuociente);
    var dividendo = divisor * quociente;

    return {
      numA: dividendo,
      numB: divisor,
      operacao: 'divisao',
      simbolo: '÷',
      resposta: quociente,
      tier: faixa.tier || 1,
      formatoVertical: false,
      temReagrupamento: false,
      texto: dividendo + ' ÷ ' + divisor + ' ='
    };
  },

  sortearConta: function () {
    var operacoesPossiveis = ['adicao', 'subtracao', 'multiplicacao', 'divisao'];
    var conta = null;
    var tentativas = 0;

    do {
      var opReal = this.operacaoEscolhida === 'mestre'
        ? this._escolherItem(operacoesPossiveis)
        : this.operacaoEscolhida;

      var faixaTier = this._sortearFaixaUnderlords(opReal);

      if (opReal === 'adicao') {
        conta = this._gerarAdicao(faixaTier);
      } else if (opReal === 'subtracao') {
        conta = this._gerarSubtracao(faixaTier);
      } else if (opReal === 'multiplicacao') {
        conta = this._gerarMultiplicacao(faixaTier);
      } else {
        conta = this._gerarDivisao(faixaTier);
      }

      tentativas++;
    } while (conta.texto === this.ultimaChaveConta && tentativas < 6);

    this.ultimaChaveConta = conta.texto;
    this.contasGeradasNaPartida++;
    this.contaAtual = conta;
    return conta;
  },

  _registrarDiagnosticoEmRAM: function (conta, acertou) {
    if (!conta || !this.diagSessao || !this.deltasSessao) return;
    var op = conta.operacao || 'adicao';
    if (!this.diagSessao[op]) return;

    var magnitude = Math.max(Number(conta.numA) || 0, Number(conta.numB) || 0, Number(conta.resposta) || 0);
    var idxAcerto = 0;
    if (magnitude <= 10) {
      idxAcerto = 0;
    } else if (magnitude <= 25) {
      idxAcerto = 2;
    } else {
      idxAcerto = 4;
    }

    var posFaixa = acertou ? idxAcerto : (idxAcerto + 1);
    this.diagSessao[op][posFaixa] = Math.min(99, (this.diagSessao[op][posFaixa] || 0) + 1);
    this.deltasSessao[op][posFaixa] += 1;

    if (!acertou) {
      var posReserva = conta.temReagrupamento ? 7 : 6;
      this.diagSessao[op][posReserva] = Math.min(99, (this.diagSessao[op][posReserva] || 0) + 1);
      this.deltasSessao[op][posReserva] += 1;
    }
  },

  registrarResposta: function (acertou) {
    var cfg = window.CONFIG.ADAPTATIVO;
    var mudouDegrau = false;

    this._registrarDiagnosticoEmRAM(this.contaAtual, acertou);

    if (acertou) {
      this.acertosNaPartida++;
      this.acertosSeguidosDegrau++;
      this.acertosSeguidosPartida++;
      this.errosSeguidosDegrau = 0;

      var ciclo = cfg.CICLO_SUBIDA || [4, 5, 6, 7];
      var metaAcertos = ciclo[Math.min(this.indiceCicloSubida, ciclo.length - 1)];
      var tetoPartida = Math.min(cfg.DEGRAU_MAX, this.degrauInicialPartida + (cfg.MAX_SUBIDA_POR_PARTIDA || 2));

      if (this.acertosSeguidosDegrau >= metaAcertos) {
        this.acertosSeguidosDegrau = 0;
        if (this.indiceCicloSubida < ciclo.length - 1) {
          this.indiceCicloSubida++;
        }

        if (this.degrauAtual < tetoPartida) {
          this.degrauAtual++;
          mudouDegrau = true;
          if (this.degrauAtual === cfg.DEGRAU_MAX) {
            this.atingiuTopo11NestaPartida = true;
          }
        }
      }
    } else {
      this.acertosSeguidosDegrau = 0;
      this.acertosSeguidosPartida = 0;
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

    return {
      mudouDegrau: mudouDegrau,
      novoDegrau: this.degrauAtual
    };
  },

  exportarResumoSessao: function () {
    return {
      degrauFinal: this.degrauAtual,
      atingiuTopo11: this.atingiuTopo11NestaPartida,
      deltasPorOperacao: this.deltasSessao
    };
  }
};