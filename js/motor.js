/* ==========================================================================
   4. js/motor.js — Sorteio Inteligente e Motor Adaptativo por Exclusão (window.Motor)
   Implementa:
   - 12 Degraus Pedagógicos Reais (0 a 11) com "Regra do 19" no Degrau 3
   - Diagnóstico por Exclusão 100% em RAM durante a partida (salvo em lote no fim)
   - Identifica se o gargalo do aluno é "Número Alto" vs "Reagrupamento (Vai 1/Empresta)"
   - Exclui números infantis (<= 10) quando o aluno já os dominou
   ========================================================================== */

window.Motor = {
  operacaoEscolhida: 'adicao',
  degrauInicialPartida: 0,
  degrauAtual: 0,
  indiceCicloSubida: 0,
  acertosSeguidosDegrau: 0,
  acertosSeguidosPartida: 0,
  errosSeguidosDegrau: 0,
  atingiuTopo11NestaPartida: false,
  contasGeradasNaPartida: 0,
  ultimaChaveConta: '',
  contaAtual: null,

  // Buffers leves em memória RAM (zero acesso a disco durante a partida)
  diagSessao: null,
  deltasSessao: null,

  iniciarPartida: function (operacao) {
    this.operacaoEscolhida = operacao || 'adicao';
    this.degrauInicialPartida = window.Dados.obterDegrauOperacao(this.operacaoEscolhida);
    this.degrauAtual = this.degrauInicialPartida;
    this.indiceCicloSubida = 0;
    this.acertosSeguidosDegrau = 0;
    this.acertosSeguidosPartida = 0;
    this.errosSeguidosDegrau = 0;
    this.atingiuTopo11NestaPartida = false;
    this.contasGeradasNaPartida = 0;
    this.ultimaChaveConta = '';
    this.contaAtual = null;

    // Carrega cópia em RAM do diagnóstico atual do aluno
    this.diagSessao = {
      adicao: window.Dados.obterDiagnosticoOperacao('adicao'),
      subtracao: window.Dados.obterDiagnosticoOperacao('subtracao'),
      multiplicacao: window.Dados.obterDiagnosticoOperacao('multiplicacao'),
      divisao: window.Dados.obterDiagnosticoOperacao('divisao')
    };

    // Acumulador de deltas desta partida para gravação única no fim
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

  /**
   * Analisa o vetor [bA, bE, mA, mE, aA, aE, erroSemRes, erroComRes] por EXCLUSÃO:
   * - dominouBaixa: se acertou >= 6 na faixa <= 10 e taxa >= 80%, exclui números triviais
   * - gargaloNumeroAlto: se erra muito em números > 25, mas vai bem em números médios
   * - gargaloReserva: se erra desproporcionalmente quando tem "vai 1" / "empréstimo"
   */
  _analisarPerfilPorExclusao: function (opReal) {
    var d = (this.diagSessao && this.diagSessao[opReal]) ? this.diagSessao[opReal] : [0, 0, 0, 0, 0, 0, 0, 0];
    var bA = d[0], bE = d[1];
    var mA = d[2], mE = d[3];
    var aA = d[4], aE = d[5];
    var erroSemRes = d[6], erroComRes = d[7];

    var totalBaixa = bA + bE;
    var dominouBaixa = (totalBaixa >= 6) && ((bA / totalBaixa) >= 0.82);

    var totalAlta = aA + aE;
    var gargaloNumeroAlto = (totalAlta >= 3) && (aE > aA);

    var gargaloReserva = (erroComRes >= 3) && (erroComRes >= (erroSemRes * 1.6));

    return {
      dominouBaixa: dominouBaixa,
      gargaloNumeroAlto: gargaloNumeroAlto,
      gargaloReserva: gargaloReserva
    };
  },

  // Sorteia a faixa efetiva combinando a progressão com o Diagnóstico por Exclusão
  _obterFaixaAdaptada: function (opReal) {
    var tabela = window.CONFIG.ADAPTATIVO.TABELA_DEGRAUS;
    var perfil = this._analisarPerfilPorExclusao(opReal);

    var degrauAlvo = this.degrauAtual;

    // Se ainda não está em sequência alta, 30% das vezes atua cirurgicamente no gargalo
    if (this.degrauAtual > 0 && this.acertosSeguidosPartida < 6 && Math.random() < 0.30) {
      degrauAlvo = this.degrauAtual - 1;
    }

    // Exclusão: se o aluno já dominou a faixa baixa (<=10) ou está em streak >= 5, nunca cai nos degraus 0-1
    if ((perfil.dominouBaixa || this.acertosSeguidosPartida >= 5) && degrauAlvo < 2 && this.degrauAtual >= 2) {
      degrauAlvo = 2;
    }

    var base = tabela[degrauAlvo] || tabela[0];

    // Clona configuração da faixa para ajustar cirurgicamente se houver gargalo detectado
    var faixaAjustada = {
      degrau: base.degrau,
      somaMin: base.somaMin || 2,
      somaSubMax: base.somaSubMax,
      difMax: base.difMax,
      modoReserva: base.modoReserva || 'opcional',
      multTabuadas: base.multTabuadas,
      multFatorMin: base.multFatorMin || 1,
      multFatorMax: base.multFatorMax,
      divDivisores: base.divDivisores,
      divQuocienteMax: base.divQuocienteMax
    };

    // REGRA DE EXCLUSÃO 1: Problema é Número Alto -> Mantém números baixos/médios e sobe +2 por acerto
    if (perfil.gargaloNumeroAlto && faixaAjustada.somaSubMax > 28) {
      var acrescimoGradual = Math.min(25, this.acertosSeguidosPartida * 3);
      faixaAjustada.somaSubMax = Math.min(faixaAjustada.somaSubMax, 24 + acrescimoGradual);
      faixaAjustada.somaMin = Math.min(faixaAjustada.somaMin, faixaAjustada.somaSubMax - 8);
    }

    // REGRA DE EXCLUSÃO 2: Problema é o Reagrupamento (e não número alto) -> Isola reserva em números amigáveis
    if (perfil.gargaloReserva && !perfil.gargaloNumeroAlto && faixaAjustada.degrau >= 3) {
      faixaAjustada.modoReserva = 'obrigatorio';
      faixaAjustada.somaSubMax = Math.min(faixaAjustada.somaSubMax, 36);
      faixaAjustada.somaMin = Math.min(faixaAjustada.somaMin, 18);
    }

    return faixaAjustada;
  },

  // 1. Gerador de ADIÇÃO com respeito estrito aos marcos (Ponte do 10, Regra do 19, Sem/Com Reserva)
  _gerarAdicao: function (faixa) {
    var teto = Math.min(99, faixa.somaSubMax);
    var piso = Math.max(2, Math.min(faixa.somaMin || 2, teto - 2));
    var modo = faixa.modoReserva;

    var numA = 2, numB = 3, resultado = 5;
    var gerou = false;

    // Caso Especial Degrau 2: Ponte do 10 (duas parcelas de 1 dígito que somam > 10, ex: 7 + 5 = 12)
    if (modo === 'ponte10') {
      numA = this._intAleatorio(4, 9);
      var minB = Math.max(2, 11 - numA);
      numB = this._intAleatorio(minB, 9);
      resultado = numA + numB;
      gerou = true;
    }

    // Caso Com Reagrupamento Obrigatório (uA + uB >= 10)
    if (!gerou && (modo === 'obrigatorio' || (modo === 'opcional' && Math.random() < 0.6))) {
      for (var t = 0; t < 20; t++) {
        var uA = this._intAleatorio(3, 9);
        var uB = this._intAleatorio(10 - uA, 9);
        var somaUnidades = uA + uB; // Entre 10 e 18
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

    // Caso Sem Reagrupamento ('proibido' — inclui a Regra do 19 no Degrau 3)
    if (!gerou && modo === 'proibido') {
      for (var s = 0; s < 20; s++) {
        if (faixa.degrau === 3) {
          // Regra do 19: 10..17 + 2..8 sem passar de 19
          numA = this._intAleatorio(10, 17);
          numB = this._intAleatorio(2, 19 - numA);
          resultado = numA + numB;
          gerou = true;
          break;
        } else {
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
    }

    // Fallback seguro respeitando piso e teto
    if (!gerou) {
      resultado = this._intAleatorio(piso, teto);
      numA = this._intAleatorio(1, resultado - 1);
      numB = resultado - numA;
    }

    // Alterna ordem das parcelas em 50% das vezes (ex: 12 + 5 ou 5 + 12)
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
      formatoVertical: true,
      temReagrupamento: temReagrupamento,
      texto: numA + ' + ' + numB + ' ='
    };
  },

  // 2. Gerador de SUBTRAÇÃO com respeito à Regra do 19 (sem empréstimo) e Marcos com Empréstimo
  _gerarSubtracao: function (faixa) {
    var teto = Math.min(99, faixa.somaSubMax);
    var piso = Math.max(3, Math.min(faixa.somaMin || 3, teto - 2));
    var limiteDif = Math.min(faixa.difMax || 30, 35);
    var modo = faixa.modoReserva;

    var numA = 6, numB = 2, resposta = 4;
    var gerou = false;

    // Caso Degrau 2: Ponte do 10 inversa (ex: 13 - 5 = 8, 15 - 7 = 8)
    if (modo === 'ponte10') {
      numA = this._intAleatorio(11, 18);
      var minSub = (numA % 10) + 1;
      numB = this._intAleatorio(minSub, 9);
      resposta = numA - numB;
      gerou = true;
    }

    // Caso Com Empréstimo Obrigatório (numA >= 20 e uA < uB)
    if (!gerou && teto >= 20 && (modo === 'obrigatorio' || (modo === 'opcional' && Math.random() < 0.6))) {
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

    // Caso Sem Empréstimo ('proibido' — inclui Regra do 19 no Degrau 3: ex 18 - 5 = 13)
    if (!gerou && modo === 'proibido') {
      for (var s = 0; s < 20; s++) {
        var uA2 = this._intAleatorio(2, 9);
        var uB2 = this._intAleatorio(1, uA2);
        var maxDezA = Math.floor((teto - uA2) / 10);
        var minDezA = faixa.degrau >= 3 ? 1 : 0;
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
      formatoVertical: true,
      temReagrupamento: temReagrupamento,
      texto: numA + ' − ' + numB + ' ='
    };
  },

  // 3. Gerador de MULTIPLICAÇÃO (Com piso mínimo de fator nos degraus altos para evitar ×1 trivial)
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
      formatoVertical: false,
      temReagrupamento: false,
      texto: numA + ' × ' + numB + ' ='
    };
  },

  // 4. Gerador de DIVISÃO (Sempre exata, evitando quociente 1 nos degraus avançados)
  _gerarDivisao: function (faixa) {
    var divisor = this._escolherItem(faixa.divDivisores);
    var minQuociente = faixa.degrau >= 3 ? 2 : 1;
    var maxQuociente = Math.max(minQuociente, faixa.divQuocienteMax || 4);
    var quociente = this._intAleatorio(minQuociente, maxQuociente);
    var dividendo = divisor * quociente;

    return {
      numA: dividendo,
      numB: divisor,
      operacao: 'divisao',
      simbolo: '÷',
      resposta: quociente,
      formatoVertical: false,
      temReagrupamento: false,
      texto: dividendo + ' ÷ ' + divisor + ' ='
    };
  },

  // Sorteia a próxima conta usando o diagnóstico por exclusão
  sortearConta: function () {
    var operacoesPossiveis = ['adicao', 'subtracao', 'multiplicacao', 'divisao'];
    var conta = null;
    var tentativas = 0;

    do {
      var opReal = this.operacaoEscolhida === 'mestre'
        ? this._escolherItem(operacoesPossiveis)
        : this.operacaoEscolhida;

      var faixa = this._obterFaixaAdaptada(opReal);

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

  // Atualiza os contadores de diagnóstico em RAM para a conta atual
  _registrarDiagnosticoEmRAM: function (conta, acertou) {
    if (!conta || !this.diagSessao || !this.deltasSessao) return;
    var op = conta.operacao || 'adicao';
    if (!this.diagSessao[op]) return;

    // Determina a magnitude numérica da conta (Baixa <= 10, Média 11..25, Alta > 25)
    var magnitude = Math.max(Number(conta.numA) || 0, Number(conta.numB) || 0, Number(conta.resposta) || 0);
    var idxAcerto = 0;
    if (magnitude <= 10) {
      idxAcerto = 0; // Posições 0 (acerto) e 1 (erro)
    } else if (magnitude <= 25) {
      idxAcerto = 2; // Posições 2 (acerto) e 3 (erro)
    } else {
      idxAcerto = 4; // Posições 4 (acerto) e 5 (erro)
    }

    var posFaixa = acertou ? idxAcerto : (idxAcerto + 1);
    this.diagSessao[op][posFaixa] = Math.min(99, (this.diagSessao[op][posFaixa] || 0) + 1);
    this.deltasSessao[op][posFaixa] += 1;

    // Se errou, classifica se o erro foi em conta SEM reserva (pos 6) ou COM reserva (pos 7)
    if (!acertou) {
      var posReserva = conta.temReagrupamento ? 7 : 6;
      this.diagSessao[op][posReserva] = Math.min(99, (this.diagSessao[op][posReserva] || 0) + 1);
      this.deltasSessao[op][posReserva] += 1;
    }
  },

  // Processa acerto ou erro no motor adaptativo (100% em RAM; consolidado no fim da partida)
  registrarResposta: function (acertou) {
    var cfg = window.CONFIG.ADAPTATIVO;
    var mudouDegrau = false;

    // 1. Atualiza o mapa de erros/acertos por exclusão em RAM
    this._registrarDiagnosticoEmRAM(this.contaAtual, acertou);

    // 2. Atualiza progressão dinâmica de degrau
    if (acertou) {
      this.acertosSeguidosDegrau++;
      this.acertosSeguidosPartida++;
      this.errosSeguidosDegrau = 0;

      var ciclo = cfg.CICLO_SUBIDA || [2, 3, 3, 4];
      var metaAcertos = ciclo[Math.min(this.indiceCicloSubida, ciclo.length - 1)];

      var maxSubida = cfg.MAX_SUBIDA_POR_PARTIDA || 5;
      var tetoPartida = Math.min(cfg.DEGRAU_MAX, this.degrauInicialPartida + maxSubida);

      if (this.acertosSeguidosDegrau >= metaAcertos) {
        this.acertosSeguidosDegrau = 0;
        if (this.indiceCicloSubida < ciclo.length - 1) {
          this.indiceCicloSubida++;
        }

        // Salto de Fluência: se o aluno está em chama alta (>= 9 seguidas) e ainda nos degraus iniciais, avança +2
        var salto = (this.acertosSeguidosPartida >= 9 && this.degrauAtual <= 4) ? 2 : 1;
        var novo = Math.min(tetoPartida, this.degrauAtual + salto);

        if (novo > this.degrauAtual) {
          this.degrauAtual = novo;
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

      if (this.errosSeguidosDegrau >= (cfg.ERROS_PARA_DESCER || 2)) {
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

  // Exporta os dados da sessão para o Dados.js salvar em lote único no final da partida
  exportarResumoSessao: function () {
    return {
      degrauFinal: this.degrauAtual,
      atingiuTopo11: this.atingiuTopo11NestaPartida,
      deltasPorOperacao: this.deltasSessao
    };
  }
};