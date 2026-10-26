/**
 * ==========================================================================
 * 9. js/modos.js — Fluxo do Modo Desafio (30s) e Modo Treino (window.Modos)
 * Atualizado com cores e brilho dinâmico para o Placar e Multiplicador centralizados
 * ==========================================================================
 */
(function() {
    'use strict';

    let timerId = null;
    let tempoRestanteMs = 30000;
    let tempoTotalMs = 30000;
    let partidaAtiva = false;

    let estadoPartida = {
        modoAtual: 'desafio',
        operacaoAtual: 'adicao',
        pontos: 0,
        acertos: 0,
        erros: 0,
        sequenciaAtual: 0,
        melhorSequencia: 0,
        maxMult: 1,
        contaAtual: null
    };

    function dispararConfetes() {
        try {
            const container = document.body;
            const qtd = 25;
            const cores = ['#38BDF8', '#A78BFA', '#FBBF24', '#22C55E', '#EF4444'];

            for (let i = 0; i < qtd; i++) {
                const confete = document.createElement('div');
                confete.className = 'confete';
                confete.style.left = Math.random() * 100 + 'vw';
                confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
                confete.style.animationDuration = (Math.random() * 0.8 + 0.5) + 's';
                confete.style.opacity = Math.random();
                container.appendChild(confete);

                setTimeout(() => confete.remove(), 1200);
            }
        } catch (e) {
            console.error('Erro ao disparar confetes:', e);
        }
    }

    const Modos = {
        modoAtual: 'desafio',
        operacaoAtual: 'adicao',
        partidaAtiva: false,

        iniciarPartida: function (modo, operacao) {
            try {
                var self = this;
                this.pararPartida();

                this.modoAtual = modo || 'desafio';
                this.operacaoAtual = operacao || 'adicao';
                this.partidaAtiva = partidaAtiva = true;

                estadoPartida = {
                    modoAtual: this.modoAtual,
                    operacaoAtual: this.operacaoAtual,
                    pontos: 0,
                    acertos: 0,
                    erros: 0,
                    sequenciaAtual: 0,
                    melhorSequencia: 0,
                    maxMult: 1,
                    contaAtual: null
                };

                // 1. Inicializa Motor Adaptativo
                if (window.Motor && typeof window.Motor.iniciarPartida === 'function') {
                    window.Motor.iniciarPartida(this.operacaoAtual);
                }

                // 2. Sorteia Mascote
                if (window.Mascotes && typeof window.Mascotes.sortearMascote === 'function') {
                    window.Mascotes.sortearMascote();
                }

                // 3. Inicializa Teclado
                if (window.Teclado && typeof window.Teclado.inicializar === 'function') {
                    window.Teclado.inicializar(function (valorDigitado) {
                        self.verificarRespostaDesafio(valorDigitado);
                    });
                }

                // 4. Atualiza cabeçalho de contexto estilo Quiz App
                var nomeModo = this.modoAtual === 'desafio' ? '⚡ Desafio' : '🎯 Treino';
                var infoOp = (window.CONFIG && window.CONFIG.OPERACOES && window.CONFIG.OPERACOES[this.operacaoAtual]) || { icone: '➕', nome: 'Adição' };
                var elInfo = document.getElementById('info-modo-operacao');
                if (elInfo) {
                    elInfo.textContent = nomeModo + ' • ' + infoOp.icone + ' ' + infoOp.nome;
                }

                // 5. Exibe/Oculta containers de acordo com o modo
                var elTimer = document.getElementById('container-timer');
                var elTeclado = document.getElementById('container-teclado');
                var elTreino = document.getElementById('container-treino');
                var elPlacar = document.getElementById('container-placar-central') || document.querySelector('.placar-topo');

                if (elTimer) elTimer.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elTeclado) elTeclado.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elTreino) elTreino.classList.toggle('oculto', this.modoAtual !== 'treino');
                if (elPlacar) elPlacar.classList.toggle('oculto', this.modoAtual === 'treino');

                // Reseta ajuda visual
                var chkAjuda = document.getElementById('chk-ajuda');
                var containerAjuda = document.getElementById('container-ajuda-visual');
                if (chkAjuda) chkAjuda.checked = false;
                if (containerAjuda) containerAjuda.classList.add('oculto');

                this._atualizarPlacarUI();
                this.proximaQuestao();

                // Renderiza mascote
                if (window.Mascotes && typeof window.Mascotes.renderizar === 'function') {
                    window.Mascotes.renderizar('mascote-area-jogo');
                }

                // Inicia cronômetro se for desafio
                if (this.modoAtual === 'desafio') {
                    this._iniciarCronometroDesafio();
                }
            } catch (e) {
                console.error('Erro crítico em Modos.iniciarPartida:', e);
            }
        },

        pararPartida: function () {
            this.partidaAtiva = partidaAtiva = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
        },

        _iniciarCronometroDesafio: function () {
            var self = this;
            var segs = (window.CONFIG && window.CONFIG.JOGO && window.CONFIG.JOGO.TEMPO_DESAFIO_SEGUNDOS) || 30;
            tempoTotalMs = segs * 1000;
            tempoRestanteMs = tempoTotalMs;
            this._atualizarBarraTempoUI(100);

            var ultimoTick = Date.now();
            timerId = setInterval(function () {
                if (!partidaAtiva) return;

                var agora = Date.now();
                var delta = agora - ultimoTick;
                ultimoTick = agora;

                tempoRestanteMs = Math.max(0, tempoRestanteMs - delta);
                var percentual = (tempoRestanteMs / tempoTotalMs) * 100;
                self._atualizarBarraTempoUI(percentual);

                if (tempoRestanteMs <= 0) {
                    clearInterval(timerId);
                    self.encerrarPartida();
                }
            }, 100);
        },

        _atualizarBarraTempoUI: function (percentual) {
            var barra = document.getElementById('barra-tempo-preenchimento') || document.querySelector('.barra-tempo-interna');
            if (!barra) return;

            barra.style.width = percentual.toFixed(1) + '%';
            if (percentual > 50) {
                barra.style.backgroundColor = 'var(--cor-acerto)';
            } else if (percentual > 20) {
                barra.style.backgroundColor = 'var(--mult-4x)';
            } else {
                barra.style.backgroundColor = 'var(--cor-erro)';
            }
        },

        _obterFaixaCombo: function (acertosSeguidos) {
            if (acertosSeguidos >= 14) return { multiplicador: 4, rotulo: '×4', cor: '#FBBF24', classe: 'mult-4x' };
            if (acertosSeguidos >= 7)  return { multiplicador: 3, rotulo: '×3', cor: '#38BDF8', classe: 'mult-3x' };
            if (acertosSeguidos >= 3)  return { multiplicador: 2, rotulo: '×2', cor: '#22C55E', classe: 'mult-2x' };
            return { multiplicador: 1, rotulo: '×1', cor: '#E2E8F0', classe: 'mult-1x' };
        },

        // Atualiza pontos, badge e aplica brilho neon dinâmico conforme o multiplicador (×1 a ×4)
        _atualizarPlacarUI: function () {
            var elContainer = document.getElementById('container-placar-central') || document.querySelector('.placar-central');
            var elPontos = document.getElementById('jogo-pontos');
            var elMult = document.getElementById('jogo-multiplicador');
            var faixa = this._obterFaixaCombo(estadoPartida.sequenciaAtual);

            if (elContainer) {
                elContainer.classList.remove('mult-1x', 'mult-2x', 'mult-3x', 'mult-4x');
                elContainer.classList.add(faixa.classe);
            }

            if (elPontos) {
                elPontos.textContent = estadoPartida.pontos + ' pts';
                elPontos.style.color = faixa.cor;
            }

            if (elMult) {
                elMult.textContent = faixa.rotulo;
                elMult.style.color = faixa.cor;
                elMult.style.borderColor = faixa.cor;
            }
        },

        proximaQuestao: function () {
            if (!partidaAtiva) return;

            if (window.Motor && typeof window.Motor.sortearConta === 'function') {
                estadoPartida.contaAtual = window.Motor.sortearConta();
            } else if (window.Motor && typeof window.Motor.gerarQuestao === 'function') {
                estadoPartida.contaAtual = window.Motor.gerarQuestao(this.operacaoAtual);
            } else {
                estadoPartida.contaAtual = { texto: '2 + 3 =', resposta: 5, numA: 2, numB: 3, operacao: 'adicao' };
            }

            var elConta = document.getElementById('texto-conta');
            if (elConta) {
                elConta.textContent = estadoPartida.contaAtual.texto || (estadoPartida.contaAtual.a + ' + ' + estadoPartida.contaAtual.b + ' =');
            }

            if (window.Teclado && typeof window.Teclado.prepararParaNovaConta === 'function') {
                window.Teclado.prepararParaNovaConta(estadoPartida.contaAtual.resposta);
            }

            var chkAjuda = document.getElementById('chk-ajuda');
            if (chkAjuda && chkAjuda.checked) {
                this.alternarAjudaVisual(true);
            }
        },

        verificarRespostaDesafio: function (entradaTexto) {
            if (!partidaAtiva || !estadoPartida.contaAtual) return;

            var valorDigitado = Number(entradaTexto);
            var respostaCerta = estadoPartida.contaAtual.resposta;
            var acertou = (valorDigitado === respostaCerta);

            if (window.Motor && typeof window.Motor.registrarResposta === 'function') {
                window.Motor.registrarResposta(acertou);
            }

            if (acertou) {
                estadoPartida.acertos++;
                estadoPartida.sequenciaAtual++;
                if (estadoPartida.sequenciaAtual > estadoPartida.melhorSequencia) {
                    estadoPartida.melhorSequencia = estadoPartida.sequenciaAtual;
                }

                var faixaCombo = this._obterFaixaCombo(estadoPartida.sequenciaAtual);
                if (faixaCombo.multiplicador > estadoPartida.maxMult) {
                    estadoPartida.maxMult = faixaCombo.multiplicador;
                }

                var pontosGanhos = 100 * faixaCombo.multiplicador;
                estadoPartida.pontos += pontosGanhos;

                this._atualizarPlacarUI();

                if (window.Som) {
                    if ([3, 7, 14, 20, 25, 30].includes(estadoPartida.sequenciaAtual)) {
                        window.Som.tocarArpejo();
                        dispararConfetes();
                    } else {
                        window.Som.tocarAcerto();
                    }
                }

                if (window.Mascotes && typeof window.Mascotes.atualizarFala === 'function') {
                    if (estadoPartida.sequenciaAtual >= 3) {
                        window.Mascotes.atualizarFala('combo', { multiplicador: faixaCombo.multiplicador });
                    } else {
                        window.Mascotes.atualizarFala('acerto');
                    }
                }

                this.proximaQuestao();
            } else {
                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                this._atualizarPlacarUI();

                if (window.Som) window.Som.tocarErro();
                if (window.Mascotes && typeof window.Mascotes.atualizarFala === 'function') {
                    window.Mascotes.atualizarFala('erro');
                }

                var self = this;
                if (window.Teclado && typeof window.Teclado.mostrarErroTemporario === 'function') {
                    window.Teclado.mostrarErroTemporario(respostaCerta, 300, function () {
                        if (partidaAtiva) self.proximaQuestao();
                    });
                } else {
                    setTimeout(function() {
                        if (partidaAtiva) self.proximaQuestao();
                    }, 300);
                }
            }
        },

        alternarAjudaVisual: function (ativo) {
            var containerAjuda = document.getElementById('container-ajuda-visual');
            if (!containerAjuda) return;

            if (!ativo || !estadoPartida.contaAtual) {
                containerAjuda.classList.add('oculto');
                if (window.Visual && typeof window.Visual.limpar === 'function') {
                    window.Visual.limpar(containerAjuda);
                } else {
                    containerAjuda.innerHTML = '';
                }
                return;
            }

            containerAjuda.classList.remove('oculto');
            var c = estadoPartida.contaAtual;
            var op = c.operacao || this.operacaoAtual;

            if (window.Visual) {
                if (op === 'adicao' && typeof window.Visual.ajudaAdicao === 'function') {
                    window.Visual.ajudaAdicao(c.numA || c.a, c.numB || c.b, this.modoAtual, containerAjuda);
                } else if (op === 'subtracao' && typeof window.Visual.ajudaSubtracao === 'function') {
                    window.Visual.ajudaSubtracao(c.numA || c.a, c.numB || c.b, this.modoAtual, containerAjuda);
                } else if (op === 'multiplicacao' && typeof window.Visual.ajudaMultiplicacao === 'function') {
                    window.Visual.ajudaMultiplicacao(c.numA || c.a, c.numB || c.b, this.modoAtual, containerAjuda);
                } else if (op === 'divisao' && typeof window.Visual.ajudaDivisao === 'function') {
                    window.Visual.ajudaDivisao(c.numA || c.a, c.numB || c.b, this.modoAtual, containerAjuda);
                }
            }
        },

        encerrarPartida: function () {
            this.pararPartida();

            if (window.Som && typeof window.Som.tocarArpejo === 'function' && estadoPartida.pontos > 0) {
                window.Som.tocarArpejo();
                dispararConfetes();
            }

            var registro = { recordeAtual: estadoPartida.pontos, bateuRecorde: false };
            if (window.Dados && typeof window.Dados.registrarFimDePartida === 'function') {
                registro = window.Dados.registrarFimDePartida({
                    modo: this.modoAtual,
                    operacao: this.operacaoAtual,
                    pontos: estadoPartida.pontos,
                    acertos: estadoPartida.acertos,
                    erros: estadoPartida.erros,
                    melhorSequencia: estadoPartida.melhorSequencia,
                    alcancou4x: estadoPartida.maxMult >= 4
                });
            }

            if (window.Conquistas && typeof window.Conquistas.verificarEAtualizar === 'function') {
                window.Conquistas.verificarEAtualizar({
                    acertosTotais: estadoPartida.acertos,
                    melhorSequencia: estadoPartida.melhorSequencia,
                    partidaPerfeita: estadoPartida.erros === 0 && estadoPartida.acertos >= 5,
                    maxMult: estadoPartida.maxMult,
                    treinoAcertos: 0
                });
            }

            var elPontos = document.getElementById('fim-pontos');
            var elRecorde = document.getElementById('fim-recorde');
            var elAcertos = document.getElementById('fim-acertos');
            var elSequencia = document.getElementById('fim-sequencia');

            if (elPontos) elPontos.textContent = estadoPartida.pontos + ' pts';
            if (elRecorde && registro) elRecorde.textContent = (registro.recordeAtual || estadoPartida.pontos) + ' pts';
            if (elAcertos) elAcertos.textContent = estadoPartida.acertos;
            if (elSequencia) elSequencia.textContent = estadoPartida.melhorSequencia + ' seguidos';

            var badgeRecorde = document.getElementById('badge-novo-recorde');
            if (badgeRecorde && registro) {
                badgeRecorde.classList.toggle('oculto', !registro.bateuRecorde);
            }

            if (window.Main && typeof window.Main.mostrarTela === 'function') {
                window.Main.mostrarTela('tela-fim');
            }
        }
    };

    window.Modos = Modos;
})();