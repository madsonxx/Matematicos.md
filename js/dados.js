/* ==========================================================================
   2. js/dados.js — Persistência Local Ultra-Compacta por Aluno (window.Dados)
   - Diagnóstico por Exclusão salvo em Micro-Arrays fixos de 8 inteiros:
     [baixaAcerto, baixaErro, mediaAcerto, mediaErro, altaAcerto, altaErro, erroSemReserva, erroComReserva]
   - Escrita única no final da partida (Zero sobrecarga no localStorage).
   ========================================================================== */

window.Dados = {
  _criarEstadoInicial: function () {
    return {
      alunoAtual: '',
      somAtivo: true,
      alunos: {}
    };
  },

  // Cria o vetor fixo de 8 posições (ocupa ~25 bytes em JSON)
  _criarVetorDiag: function () {
    return [0, 0, 0, 0, 0, 0, 0, 0];
  },

  _criarPerfilAluno: function (nomeExibicao) {
    return {
      nomeExibicao: nomeExibicao,
      degrauPorOperacao: {
        adicao: 0,
        subtracao: 0,
        multiplicacao: 0,
        divisao: 0,
        mestre: 0
      },
      // Micro-arrays de diagnóstico por operação (tamanho fixo, nunca cresce)
      diag: {
        adicao: this._criarVetorDiag(),
        subtracao: this._criarVetorDiag(),
        multiplicacao: this._criarVetorDiag(),
        divisao: this._criarVetorDiag()
      },
      recordesPorOperacao: {
        adicao: 0,
        subtracao: 0,
        multiplicacao: 0,
        divisao: 0,
        mestre: 0
      },
      rankingEnviadoPorOperacao: {
        adicao: 0,
        subtracao: 0,
        multiplicacao: 0,
        divisao: 0,
        mestre: 0
      },
      vezesNoDegrau11: 0,
      recordePontos: 0,
      melhorSequencia: 0,
      estatisticas: {
        acertosTotais: 0,
        partidasJogadas: 0,
        partidasPerfeitas: 0,
        vezesCombo4x: 0,
        acertosTreino: 0,
        diasAtivos: []
      }
    };
  },

  carregarBanco: function () {
    try {
      var bruto = localStorage.getItem(window.CONFIG.CHAVE_STORAGE);
      if (!bruto) {
        return this._criarEstadoInicial();
      }
      return JSON.parse(bruto);
    } catch (erro) {
      console.warn('Aviso: localStorage indisponível ou corrompido.', erro);
      return this._criarEstadoInicial();
    }
  },

  salvarBanco: function (banco) {
    try {
      localStorage.setItem(window.CONFIG.CHAVE_STORAGE, JSON.stringify(banco));
    } catch (erro) {
      console.warn('Aviso: Não foi possível gravar no localStorage.', erro);
    }
  },

  formatarNomeAluno: function (texto) {
    if (!texto) return '';
    return texto
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(function (palavra) {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
      })
      .join(' ');
  },

  separarNomeESobrenome: function (nomeExibicao) {
    var formatado = this.formatarNomeAluno(nomeExibicao);
    var partes = formatado.split(' ');
    var nome = partes[0] || '';
    var sobrenome = partes.slice(1).join(' ') || '';
    return { nome: nome, sobrenome: sobrenome };
  },

  validarNomeESobrenome: function (texto) {
    var limpo = this.formatarNomeAluno(texto);
    var partes = limpo.split(' ');
    return partes.length >= 2 && partes[0].length >= 2 && partes[1].length >= 2;
  },

  definirAlunoAtual: function (nomeCompleto) {
    var nomeFormatado = this.formatarNomeAluno(nomeCompleto);
    var chave = nomeFormatado.toLowerCase();
    var banco = this.carregarBanco();

    if (!banco.alunos[chave]) {
      banco.alunos[chave] = this._criarPerfilAluno(nomeFormatado);
    } else if (!banco.alunos[chave].diag) {
      // Migração transparente para alunos antigos já salvos no navegador
      banco.alunos[chave].diag = {
        adicao: this._criarVetorDiag(),
        subtracao: this._criarVetorDiag(),
        multiplicacao: this._criarVetorDiag(),
        divisao: this._criarVetorDiag()
      };
    }

    banco.alunoAtual = chave;
    this.salvarBanco(banco);
    return banco.alunos[chave];
  },

  obterAlunoAtual: function () {
    var banco = this.carregarBanco();
    if (!banco.alunoAtual || !banco.alunos[banco.alunoAtual]) {
      return null;
    }
    return banco.alunos[banco.alunoAtual];
  },

  listarAlunosRecentes: function () {
    var banco = this.carregarBanco();
    var chaves = Object.keys(banco.alunos);
    return chaves.map(function (k) {
      return banco.alunos[k].nomeExibicao;
    });
  },

  obterDegrauOperacao: function (operacao) {
    var aluno = this.obterAlunoAtual();
    if (!aluno) return 0;

    var op = operacao || 'adicao';
    var degrauSalvo = (aluno.degrauPorOperacao && typeof aluno.degrauPorOperacao[op] === 'number')
      ? aluno.degrauPorOperacao[op]
      : 0;

    var minVeterano = window.CONFIG.ADAPTATIVO.DEGRAU_INICIAL_VETERANO || 3;
    if ((aluno.vezesNoDegrau11 || 0) >= 2 && degrauSalvo < minVeterano) {
      degrauSalvo = minVeterano;
    }

    return degrauSalvo;
  },

  // Retorna cópia do micro-array de 8 posições da operação para uso em RAM pelo Motor
  obterDiagnosticoOperacao: function (operacao) {
    var aluno = this.obterAlunoAtual();
    if (!aluno || !aluno.diag) return this._criarVetorDiag();
    var op = (operacao === 'mestre') ? 'adicao' : (operacao || 'adicao');
    var vetor = aluno.diag[op];
    if (!Array.isArray(vetor) || vetor.length < 8) {
      return this._criarVetorDiag();
    }
    return vetor.slice(0, 8);
  },

  // Soma o delta da partida no vetor do aluno aplicando teto de 99 (janela móvel leve)
  _mesclarVetorDiag: function (vetorSalvo, deltaPartida) {
    var base = (Array.isArray(vetorSalvo) && vetorSalvo.length === 8) ? vetorSalvo : this._criarVetorDiag();
    for (var i = 0; i < 8; i++) {
      base[i] = Math.min(99, (base[i] || 0) + (deltaPartida[i] || 0));
      // Se acertos + erros daquela faixa passarem de 60, reduz ambos pela metade para manter proporção recente
      if (i % 2 === 1 && (base[i - 1] + base[i]) > 60) {
        base[i - 1] = Math.floor(base[i - 1] / 2);
        base[i] = Math.floor(base[i] / 2);
      }
    }
    return base;
  },

  // Mantido para compatibilidade caso chamado isoladamente
  salvarDegrauOperacao: function (operacao, novoDegrau, atingiuTopoNestaSubida) {
    var banco = this.carregarBanco();
    var chave = banco.alunoAtual;
    if (!chave || !banco.alunos[chave]) return;

    var aluno = banco.alunos[chave];
    if (!aluno.degrauPorOperacao) {
      aluno.degrauPorOperacao = { adicao: 0, subtracao: 0, multiplicacao: 0, divisao: 0, mestre: 0 };
    }

    var minVeterano = window.CONFIG.ADAPTATIVO.DEGRAU_INICIAL_VETERANO || 3;
    if ((aluno.vezesNoDegrau11 || 0) >= 2 && novoDegrau < minVeterano) {
      novoDegrau = minVeterano;
    }

    aluno.degrauPorOperacao[operacao] = novoDegrau;

    if (atingiuTopoNestaSubida) {
      aluno.vezesNoDegrau11 = (aluno.vezesNoDegrau11 || 0) + 1;
    }

    this.salvarBanco(banco);
  },

  atualizarRankingEnviado: function (operacao, pontos) {
    var banco = this.carregarBanco();
    var chave = banco.alunoAtual;
    if (!chave || !banco.alunos[chave]) return;

    var aluno = banco.alunos[chave];
    if (!aluno.rankingEnviadoPorOperacao) {
      aluno.rankingEnviadoPorOperacao = { adicao: 0, subtracao: 0, multiplicacao: 0, divisao: 0, mestre: 0 };
    }

    aluno.rankingEnviadoPorOperacao[operacao] = pontos;
    this.salvarBanco(banco);
  },

  obterRankingEnviado: function (operacao) {
    var aluno = this.obterAlunoAtual();
    if (!aluno || !aluno.rankingEnviadoPorOperacao) return 0;
    return aluno.rankingEnviadoPorOperacao[operacao] || 0;
  },

  // Grava TUDO (Pontos + Recorde + Novo Degrau + Diagnóstico em Lote) numa única operação de localStorage
  registrarFimDePartida: function (dadosPartida) {
    var banco = this.carregarBanco();
    var chave = banco.alunoAtual;
    if (!chave || !banco.alunos[chave]) {
      return { bateuRecorde: false, recordeAtual: dadosPartida.pontos || 0 };
    }

    var aluno = banco.alunos[chave];
    var pontos = dadosPartida.pontos || 0;
    var acertos = dadosPartida.acertos || 0;
    var erros = dadosPartida.erros || 0;
    var melhorSeq = dadosPartida.melhorSequencia || 0;
    var alcancou4x = !!dadosPartida.alcancou4x;
    var modo = dadosPartida.modo || 'desafio';
    var operacao = dadosPartida.operacao || 'adicao';

    // 1. Consolida o Degrau e Diagnóstico em Lote vindos da memória RAM do Motor
    if (window.Motor && typeof window.Motor.exportarResumoSessao === 'function') {
      var resumoMotor = window.Motor.exportarResumoSessao();
      if (!aluno.degrauPorOperacao) {
        aluno.degrauPorOperacao = { adicao: 0, subtracao: 0, multiplicacao: 0, divisao: 0, mestre: 0 };
      }
      var minVet = window.CONFIG.ADAPTATIVO.DEGRAU_INICIAL_VETERANO || 3;
      var degFinal = resumoMotor.degrauFinal;
      if ((aluno.vezesNoDegrau11 || 0) >= 2 && degFinal < minVet) {
        degFinal = minVet;
      }
      aluno.degrauPorOperacao[operacao] = degFinal;
      if (resumoMotor.atingiuTopo11) {
        aluno.vezesNoDegrau11 = (aluno.vezesNoDegrau11 || 0) + 1;
      }

      if (!aluno.diag) {
        aluno.diag = {
          adicao: this._criarVetorDiag(),
          subtracao: this._criarVetorDiag(),
          multiplicacao: this._criarVetorDiag(),
          divisao: this._criarVetorDiag()
        };
      }
      var deltas = resumoMotor.deltasPorOperacao || {};
      var ops = ['adicao', 'subtracao', 'multiplicacao', 'divisao'];
      for (var i = 0; i < ops.length; i++) {
        var kOp = ops[i];
        if (deltas[kOp]) {
          aluno.diag[kOp] = this._mesclarVetorDiag(aluno.diag[kOp], deltas[kOp]);
        }
      }
    }

    // 2. Atualiza Recordes
    var bateuRecorde = false;
    if (modo === 'desafio') {
      if (pontos > (aluno.recordePontos || 0)) {
        aluno.recordePontos = pontos;
        bateuRecorde = true;
      }

      if (!aluno.recordesPorOperacao) {
        aluno.recordesPorOperacao = { adicao: 0, subtracao: 0, multiplicacao: 0, divisao: 0, mestre: 0 };
      }
      if (pontos > (aluno.recordesPorOperacao[operacao] || 0)) {
        aluno.recordesPorOperacao[operacao] = pontos;
      }
    }

    if (melhorSeq > (aluno.melhorSequencia || 0)) {
      aluno.melhorSequencia = melhorSeq;
    }

    // 3. Atualiza Estatísticas Gerais (Mantendo conquistas intactas)
    if (!aluno.estatisticas) {
      aluno.estatisticas = {
        acertosTotais: 0,
        partidasJogadas: 0,
        partidasPerfeitas: 0,
        vezesCombo4x: 0,
        acertosTreino: 0,
        diasAtivos: []
      };
    }

    aluno.estatisticas.acertosTotais += acertos;
    aluno.estatisticas.partidasJogadas += 1;

    if (acertos > 0 && erros === 0) {
      aluno.estatisticas.partidasPerfeitas += 1;
    }
    if (alcancou4x) {
      aluno.estatisticas.vezesCombo4x += 1;
    }
    if (modo === 'treino') {
      aluno.estatisticas.acertosTreino += acertos;
    }

    var hoje = new Date().toISOString().slice(0, 10);
    if (aluno.estatisticas.diasAtivos.indexOf(hoje) === -1) {
      aluno.estatisticas.diasAtivos.push(hoje);
    }

    // Limita diasAtivos aos últimos 15 dias para nunca inflar o localStorage
    if (aluno.estatisticas.diasAtivos.length > 15) {
      aluno.estatisticas.diasAtivos = aluno.estatisticas.diasAtivos.slice(-15);
    }

    // ÚNICA GRAVAÇÃO NO LOCALSTORAGE AO FINAL DA PARTIDA
    this.salvarBanco(banco);

    return {
      bateuRecorde: bateuRecorde,
      recordeAtual: aluno.recordePontos
    };
  },

  obterSomAtivo: function () {
    var banco = this.carregarBanco();
    return banco.somAtivo !== false;
  },

  alternarSom: function () {
    var banco = this.carregarBanco();
    banco.somAtivo = !banco.somAtivo;
    this.salvarBanco(banco);
    return banco.somAtivo;
  }
};