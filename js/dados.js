/* ==========================================================================
   2. js/dados.js — Persistência Local por Aluno (window.Dados)
   Gerencia Nome e Sobrenome, troca de aluno, degrau adaptativo e recordes.
   ========================================================================== */

window.Dados = {
  // Estrutura padrão caso o localStorage ainda esteja vazio
  _criarEstadoInicial: function () {
    return {
      alunoAtual: '',
      somAtivo: true,
      alunos: {} // Dicionário indexado pelo "nome sobrenome" em minúsculas
    };
  },

  // Cria a ficha limpa para um novo aluno
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

  // Lê o banco completo salvo no navegador
  carregarBanco: function () {
    try {
      var bruto = localStorage.getItem(window.CONFIG.CHAVE_STORAGE);
      if (!bruto) {
        return this._criarEstadoInicial();
      }
      return JSON.parse(bruto);
    } catch (erro) {
      console.warn('Aviso: localStorage indisponível ou corrompido. Usando memória temporária.', erro);
      return this._criarEstadoInicial();
    }
  },

  // Salva o banco completo no navegador
  salvarBanco: function (banco) {
    try {
      localStorage.setItem(window.CONFIG.CHAVE_STORAGE, JSON.stringify(banco));
    } catch (erro) {
      console.warn('Aviso: Não foi possível gravar no localStorage.', erro);
    }
  },

  // Normaliza o texto removendo espaços extras e deixando com iniciais maiúsculas
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

  // Valida se o aluno digitou pelo menos Nome e Sobrenome (mínimo 2 palavras)
  validarNomeESobrenome: function (texto) {
    var limpo = this.formatarNomeAluno(texto);
    var partes = limpo.split(' ');
    return partes.length >= 2 && partes[0].length >= 2 && partes[1].length >= 2;
  },

  // Define o aluno ativo (criando seu perfil se for a primeira vez no aparelho)
  definirAlunoAtual: function (nomeCompleto) {
    var nomeFormatado = this.formatarNomeAluno(nomeCompleto);
    var chave = nomeFormatado.toLowerCase();
    var banco = this.carregarBanco();

    if (!banco.alunos[chave]) {
      banco.alunos[chave] = this._criarPerfilAluno(nomeFormatado);
    }

    banco.alunoAtual = chave;
    this.salvarBanco(banco);
    return banco.alunos[chave];
  },

  // Retorna o objeto do aluno logado no momento (ou null se ninguém estiver logado)
  obterAlunoAtual: function () {
    var banco = this.carregarBanco();
    if (!banco.alunoAtual || !banco.alunos[banco.alunoAtual]) {
      return null;
    }
    return banco.alunos[banco.alunoAtual];
  },

  // Retorna uma lista com os nomes de todos os alunos já cadastrados neste aparelho
  listarAlunosRecentes: function () {
    var banco = this.carregarBanco();
    var chaves = Object.keys(banco.alunos);
    return chaves.map(function (k) {
      return banco.alunos[k].nomeExibicao;
    });
  },

  // Obtém o degrau inicial respeitando a Regra de Veterano (quem atingiu degrau 11 >= 2x começa no mín. no 3)
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

  // Atualiza e persiste o degrau do aluno atual para a operação escolhida
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

  // Registra o resumo completo ao final de uma partida do Modo Desafio
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

    // Verifica se bateu o recorde pessoal de pontos no Modo Desafio
    var bateuRecorde = false;
    if (modo === 'desafio' && pontos > (aluno.recordePontos || 0)) {
      aluno.recordePontos = pontos;
      bateuRecorde = true;
    }

    // Atualiza melhor sequência histórica
    if (melhorSeq > (aluno.melhorSequencia || 0)) {
      aluno.melhorSequencia = melhorSeq;
    }

    // Atualiza estatísticas acumuladas (já preparando terreno para as Conquistas do M2)
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

    // Registra o dia atual (AAAA-MM-DD) para a conquista de dias ativos
    var hoje = new Date().toISOString().slice(0, 10);
    if (aluno.estatisticas.diasAtivos.indexOf(hoje) === -1) {
      aluno.estatisticas.diasAtivos.push(hoje);
    }

    this.salvarBanco(banco);

    return {
      bateuRecorde: bateuRecorde,
      recordeAtual: aluno.recordePontos
    };
  },

  // Lê e alterna a preferência de Som (🔊 / 🔇)
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