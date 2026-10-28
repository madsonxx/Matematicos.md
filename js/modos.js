/**
 * ==========================================================================
 * 9. js/modos.js — Fluxo do Modo Desafio (30s) e Modo Treino (window.Modos)
 * Inclui Sistema de Recompensa "Chama Arcade / Fogo Neon" (Substitui confetes)
 * e Gravação Única ao sair/encerrar partida.
 * ==========================================================================
 */
(function () {
    'use strict';

    var timerId = null;
    var tempoRestanteMs = 30000;
    var tempoTotalMs = 30000;
    var partidaAtiva = false;

    var estadoPartida = {
        modoAtual: 'desafio',
        operacaoAtual: 'adicao',
        pontos: 0,
        acertos: 0,
        erros: 0,
        treinoAcertos: 0,
        sequenciaAtual: 0,
        melhorSequencia: 0,
        maxMult: 1,
        contaAtual: null,
        bloqueadoTreino: false,
        timeoutTransicao: null
    };

    var NOMES_OPERACOES = {
        adicao: { icone: '➕', nome: 'Adição' },
        subtracao: { icone: '➖', nome: 'Subtração' },
        multiplicacao: { icone: '✖️', nome: 'Multiplicação' },
        divisao: { icone: '➗', nome: 'Divisão' },
        mestre: { icone: '👑', nome: 'Modo Mestre' }
    };

    /**
     * Dispara labaredas e fagulhas ascendentes de Fogo Neon (Estilo Arcade/Streak)
     * Escala a cor e intensidade conforme o multiplicador atual (2x Verde, 3x Azul Plasma, 4x Fogo Dourado/Rubi)
     */
    function dispararChamaNeon(multiplicador) {
        try {
            var container = document.body;
            var nivel = multiplicador || 2;
            var qtd = nivel >= 4 ? 22 : (nivel === 3 ? 16 : 12);

            var paletas = {
                2: ['#22C55E', '#4ADE80', '#A7F3D0'],
                3: ['#38BDF8', '#818CF8', '#E0F2FE'],
                4: ['#FBBF24', '#F97316', '#EF4444', '#FEF08A']
            };
            var cores = paletas[nivel] || paletas[4];

            // Pulso de ignição no placar central
            var elPlacar = document.getElementById('container-placar-central');
            if (elPlacar) {
                elPlacar.classList.remove('ignicao-combo');
                void elPlacar.offsetWidth;
                elPlacar.classList.add('ignicao-combo');
            }

            for (var i = 0; i < qtd; i++) {
                (function () {
                    var labareda = document.createElement('div');
                    labareda.className = 'chama-particula';
                    var tamanho = Math.floor(Math.random() * 12) + (nivel >= 4 ? 12 : 8);
                    var cor = cores[Math.floor(Math.random() * cores.length)];

                    labareda.style.width = tamanho + 'px';
                    labareda.style.height = (tamanho * 1.4) + 'px';
                    labareda.style.left = (12 + Math.random() * 76) + 'vw';
                    labareda.style.background = cor;
                    labareda.style.boxShadow = '0 0 14px ' + cor;
                    labareda.style.animationDuration = (Math.random() * 0.45 + 0.55) + 's';

                    container.appendChild(labareda);

                    setTimeout(function () {
                        if (labareda && labareda.parentNode) labareda.remove();
                    }, 1050);
                })();
            }
        } catch (e) {
            console.error('Erro ao disparar Chama Neon:', e);
        }
    }

    function normalizarConta(contaBruta, operacaoFallback) {
        if (!contaBruta) {
            return { numA: 2, numB: 3, operacao: operacaoFallback || 'adicao', texto: '2 + 3 =', resposta: 5 };
        }

        var numA = contaBruta.numA !== undefined ? contaBruta.numA : contaBruta.a;
        var numB = contaBruta.numB !== undefined ? contaBruta.numB : contaBruta.b;
        var op = contaBruta.operacao || operacaoFallback || 'adicao';
        var texto = contaBruta.texto;

        if ((numA === undefined || numB === undefined) && texto) {
            var match = String(texto).match(/(\d+)\s*([+\-−×*x÷/])\s*(\d+)/);
            if (match) {
                numA = Number(match[1]);
                numB = Number(match[3]);
                var simb = match[2];
                if (simb === '+') op = 'adicao';
                else if (simb === '-' || simb === '−') op = 'subtracao';
                else if (simb === '×' || simb === '*' || simb === 'x') op = 'multiplicacao';
                else if (simb === '÷' || simb === '/') op = 'divisao';
            }
        }

        if (!texto) {
            var mapaSimbolo = { adicao: '+', subtracao: '−', multiplicacao: '×', divisao: '÷' };
            var s = mapaSimbolo[op] || '+';
            texto = numA + ' ' + s + ' ' + numB + ' =';
        }

        return {
            numA: Number(numA),
            numB: Number(numB),
            a: Number(numA),
            b: Number(numB),
            operacao: op,
            formatoVertical: contaBruta.formatoVertical,
            temReagrupamento: Boolean(contaBruta.temReagrupamento),
            texto: texto,
            resposta: Number(contaBruta.resposta)
        };
    }

    function gerarAlternativasInteligentes(respostaCorreta) {
        var certa = Number(respostaCorreta);
        var opcoes = [certa];
        var deltasPossiveis = [-5, -4, -3, -2, 2, 3, 4, 5];

        for (var i = deltasPossiveis.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = deltasPossiveis[i];
            deltasPossiveis[i] = deltasPossiveis[j];
            deltasPossiveis[j] = temp;
        }

        for (var k = 0; k < deltasPossiveis.length && opcoes.length < 3; k++) {
            var candidato = certa + deltasPossiveis[k];
            if (candidato >= 0 && opcoes.indexOf(candidato) === -1 && (candidato % 10 !== certa % 10)) {
                opcoes.push(candidato);
            }
        }

        var inc = 2;
        while (opcoes.length < 3) {
            var extra = certa + inc;
            if (extra >= 0 && opcoes.indexOf(extra) === -1) {
                opcoes.push(extra);
            }
            inc++;
        }

        for (var m = opcoes.length - 1; m > 0; m--) {
            var n = Math.floor(Math.random() * (m + 1));
            var aux = opcoes[m];
            opcoes[m] = opcoes[n];
            opcoes[n] = aux;
        }

        return opcoes;
    }

    function gerarExplicacaoDidatica(conta) {
        var a = conta.numA;
        var b = conta.numB;
        var r = conta.resposta;
        var op = conta.operacao;

        if (op === 'adicao' || op === '+') {
            if ((a % 10) + (b % 10) >= 10) {
                return '💡 Nas unidades, ' + (a % 10) + ' + ' + (b % 10) + ' dá ' + ((a % 10) + (b % 10)) + ' (vai 1!). Total: ' + r + '!';
            }
            if (a < 10 && b > 0 && a + b > 10) {
                var falta = 10 - a;
                var sobra = b - falta;
                return '💡 Dica: ' + a + ' + ' + falta + ' forma 10, mais ' + sobra + ' dá ' + r + '!';
            }
            return '💡 Quase! ' + a + ' + ' + b + ' é igual a ' + r + '.';
        }
        if (op === 'subtracao' || op === '-') {
            if ((a % 10) < (b % 10)) {
                return '💡 Empréstimo: ' + ((a % 10) + 10) + ' − ' + (b % 10) + ' nas unidades! Total: ' + r + '!';
            }
            return '💡 Tirando ' + b + ' de ' + a + ', sobram ' + r + '!';
        }
        if (op === 'multiplicacao' || op === '×') {
            return '💡 Lembre: ' + a + ' vezes ' + b + ' é igual a ' + r + '!';
        }
        if (op === 'divisao' || op === '÷') {
            return '💡 Pois ' + b + ' × ' + r + ' = ' + a + '. Então dá ' + r + '!';
        }
        return '💡 A resposta correta é ' + r + '. Vamos para a próxima!';
    }

    function definirFalaMascoteDireta(texto) {
        if (window.Mascotes && typeof window.Mascotes.falarTextoDireto === 'function') {
            window.Mascotes.falarTextoDireto(texto, false);
            return;
        }
        var areaMascote = document.getElementById('mascote-area-jogo');
        if (!areaMascote) return;
        var balao = areaMascote.querySelector('.mascote-balao') || document.getElementById('mascote-balao');
        if (balao) {
            balao.textContent = texto;
            balao.classList.remove('balao-animar');
            void balao.offsetWidth;
            balao.classList.add('balao-animar');
        }
    }

    var Modos = {
        modoAtual: 'desafio',
        operacaoAtual: 'adicao',
        partidaAtiva: false,

        iniciarPartida: function (modo, operacao) {
            try {
                var self = this;
                this.pararPartida();

                this.modoAtual = (modo === 'treino') ? 'treino' : 'desafio';
                this.operacaoAtual = operacao || 'adicao';
                this.partidaAtiva = partidaAtiva = true;

                estadoPartida = {
                    modoAtual: this.modoAtual,
                    operacaoAtual: this.operacaoAtual,
                    pontos: 0,
                    acertos: 0,
                    erros: 0,
                    treinoAcertos: 0,
                    sequenciaAtual: 0,
                    melhorSequencia: 0,
                    maxMult: 1,
                    contaAtual: null,
                    bloqueadoTreino: false,
                    timeoutTransicao: null
                };

                if (window.Motor && typeof window.Motor.iniciarPartida === 'function') {
                    window.Motor.iniciarPartida(this.operacaoAtual);
                }

                if (window.Mascotes && typeof window.Mascotes.sortearMascote === 'function') {
                    window.Mascotes.sortearMascote();
                }
                if (window.Mascotes && typeof window.Mascotes.renderizar === 'function') {
                    window.Mascotes.renderizar('mascote-area-jogo');
                }

                if (window.Teclado && typeof window.Teclado.inicializar === 'function') {
                    window.Teclado.inicializar(function (valorDigitado) {
                        self.verificarRespostaDesafio(valorDigitado);
                    });
                }

                var nomeModo = this.modoAtual === 'treino' ? '🎯 Treino' : '⚡ Desafio';
                var infoOp = (window.CONFIG && window.CONFIG.OPERACOES && window.CONFIG.OPERACOES[this.operacaoAtual]) ||
                    NOMES_OPERACOES[this.operacaoAtual] ||
                    { icone: '➕', nome: 'Adição' };
                var elInfo = document.getElementById('info-modo-operacao');
                if (elInfo) {
                    elInfo.textContent = nomeModo + ' • ' + infoOp.icone + ' ' + infoOp.nome;
                }

                var elTimer = document.getElementById('container-timer');
                var elPlacar = document.getElementById('container-placar-central');
                var elTeclado = document.getElementById('container-teclado');
                var elTreino = document.getElementById('container-treino');

                if (elTimer) elTimer.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elPlacar) elPlacar.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elTeclado) elTeclado.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elTreino) elTreino.classList.toggle('oculto', this.modoAtual !== 'treino');

                this._sincronizarBotaoAjuda(false);

                this._atualizarPlacarUI();
                this.proximaQuestao();

                if (this.modoAtual === 'desafio') {
                    this._iniciarCronometroDesafio();
                }
            } catch (e) {
                console.error('Erro crítico em Modos.iniciarPartida:', e);
            }
        },

        pararPartida: function () {
            // Se o aluno respondeu contas no Treino (ou saiu antes dos 30s no Desafio), salva o progresso em lote único
            if (this.partidaAtiva && (estadoPartida.acertos > 0 || estadoPartida.erros > 0 || estadoPartida.treinoAcertos > 0)) {
                if (window.Dados && typeof window.Dados.registrarFimDePartida === 'function') {
                    window.Dados.registrarFimDePartida({
                        modo: this.modoAtual,
                        operacao: this.operacaoAtual,
                        pontos: 0,
                        acertos: this.modoAtual === 'treino' ? estadoPartida.treinoAcertos : estadoPartida.acertos,
                        erros: estadoPartida.erros,
                        melhorSequencia: estadoPartida.melhorSequencia,
                        alcancou4x: false
                    });
                }
            }

            this.partidaAtiva = partidaAtiva = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            if (estadoPartida.timeoutTransicao) {
                clearTimeout(estadoPartida.timeoutTransicao);
                estadoPartida.timeoutTransicao = null;
            }
            if (window.Visual && typeof window.Visual.limparDestaquesArminha === 'function') {
                window.Visual.limparDestaquesArminha();
            }
        },

        _sincronizarBotaoAjuda: function (ativo) {
            var chkAjuda = document.getElementById('chk-ajuda');
            var labelAjuda = document.querySelector('.toggle-ajuda-destaque');
            var textoBtn = document.getElementById('texto-btn-ajuda');
            var containerAjuda = document.getElementById('container-ajuda-visual');

            if (chkAjuda) chkAjuda.checked = Boolean(ativo);
            if (labelAjuda) labelAjuda.classList.toggle('ajuda-ativa', Boolean(ativo));
            if (textoBtn) {
                textoBtn.textContent = ativo ? 'Ajuda Passo a Passo Ativa' : 'Ver Ajuda Visual';
            }
            if (!ativo) {
                if (window.Visual && typeof window.Visual.limpar === 'function') {
                    window.Visual.limpar(containerAjuda);
                }
                if (containerAjuda) {
                    containerAjuda.classList.add('oculto');
                    containerAjuda.innerHTML = '';
                }
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
            if (acertosSeguidos >= 14) return { multiplicador: 4, rotulo: '×4 🔥', cor: '#FBBF24', classe: 'mult-4x' };
            if (acertosSeguidos >= 7) return { multiplicador: 3, rotulo: '×3 ⚡', cor: '#38BDF8', classe: 'mult-3x' };
            if (acertosSeguidos >= 3) return { multiplicador: 2, rotulo: '×2', cor: '#22C55E', classe: 'mult-2x' };
            return { multiplicador: 1, rotulo: '×1', cor: '#E2E8F0', classe: 'mult-1x' };
        },

        _atualizarPlacarUI: function () {
            var elContainer = document.getElementById('container-placar-central');
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

            var contaBruta = null;
            if (window.Motor && typeof window.Motor.sortearConta === 'function') {
                contaBruta = window.Motor.sortearConta();
            } else if (window.Motor && typeof window.Motor.gerarQuestao === 'function') {
                contaBruta = window.Motor.gerarQuestao(this.operacaoAtual);
            }

            estadoPartida.contaAtual = normalizarConta(contaBruta, this.operacaoAtual);
            estadoPartida.bloqueadoTreino = false;

            var elConta = document.getElementById('texto-conta');
            var elDisplay = document.getElementById('display-resposta');

            if (elDisplay) {
                elDisplay.textContent = '?';
                elDisplay.classList.remove('display-erro', 'display-correto');
            }

            if (window.Visual && typeof window.Visual.renderizarContaNoPalco === 'function') {
                window.Visual.renderizarContaNoPalco(estadoPartida.contaAtual, elConta, elDisplay);
            } else if (elConta) {
                elConta.textContent = estadoPartida.contaAtual.texto;
            }

            if (this.modoAtual === 'treino') {
                this._renderizarBotoesTreino(estadoPartida.contaAtual);
            } else {
                if (window.Teclado && typeof window.Teclado.prepararParaNovaConta === 'function') {
                    window.Teclado.prepararParaNovaConta(estadoPartida.contaAtual.resposta);
                }
            }

            var chkAjuda = document.getElementById('chk-ajuda');
            if (chkAjuda && chkAjuda.checked) {
                this.alternarAjudaVisual(true);
            }
        },

        _renderizarBotoesTreino: function (conta) {
            var self = this;
            var containerTreino = document.getElementById('container-treino');
            if (!containerTreino) return;

            containerTreino.innerHTML = '';
            var opcoes = gerarAlternativasInteligentes(conta.resposta);

            opcoes.forEach(function (valorOpcao) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-alternativa';
                btn.textContent = valorOpcao;
                btn.setAttribute('data-valor', String(valorOpcao));

                btn.addEventListener('click', function () {
                    self._verificarEscolhaTreino(btn, valorOpcao, conta, containerTreino);
                });

                containerTreino.appendChild(btn);
            });
        },

        _verificarEscolhaTreino: function (botaoClicado, valorEscolhido, conta, container) {
            if (!partidaAtiva || estadoPartida.bloqueadoTreino) return;
            estadoPartida.bloqueadoTreino = true;

            var self = this;
            var acertou = (Number(valorEscolhido) === Number(conta.resposta));
            var elDisplay = document.getElementById('display-resposta');
            var botoes = container.querySelectorAll('.btn-alternativa');

            for (var i = 0; i < botoes.length; i++) {
                botoes[i].disabled = true;
            }

            if (elDisplay) {
                elDisplay.textContent = conta.resposta;
            }

            if (window.Motor && typeof window.Motor.registrarResposta === 'function') {
                window.Motor.registrarResposta(acertou);
            }

            if (acertou) {
                estadoPartida.treinoAcertos++;
                estadoPartida.sequenciaAtual++;
                botaoClicado.classList.add('alternativa-correta');
                if (elDisplay) elDisplay.classList.add('display-correto');

                if (estadoPartida.sequenciaAtual % 5 === 0) {
                    dispararChamaNeon(3);
                }

                if (window.Som && typeof window.Som.tocarAcerto === 'function') {
                    window.Som.tocarAcerto();
                }

                definirFalaMascoteDireta('🔥 Mandou bem! ' + conta.texto + ' <strong>' + conta.resposta + '</strong>!');

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 800);
            } else {
                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                botaoClicado.classList.add('alternativa-errada');
                if (elDisplay) elDisplay.classList.add('display-erro');

                for (var j = 0; j < botoes.length; j++) {
                    if (Number(botoes[j].getAttribute('data-valor')) === Number(conta.resposta)) {
                        botoes[j].classList.add('alternativa-correta');
                    }
                }

                if (window.Som && typeof window.Som.tocarErro === 'function') {
                    window.Som.tocarErro();
                }

                var explicacao = gerarExplicacaoDidatica(conta);
                definirFalaMascoteDireta(explicacao);

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 1500);
            }
        },

        verificarRespostaDesafio: function (entradaTexto) {
            if (!partidaAtiva || !estadoPartida.contaAtual) return;

            var valorDigitado = Number(entradaTexto);
            var respostaCerta = Number(estadoPartida.contaAtual.resposta);
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

                var marcosFogo = (window.CONFIG && window.CONFIG.COMBO && window.CONFIG.COMBO.MARCOS_FOGO) || [3, 7, 10, 14, 18, 22, 26, 30];
                if (marcosFogo.indexOf(estadoPartida.sequenciaAtual) !== -1) {
                    if (window.Som && typeof window.Som.tocarArpejo === 'function') {
                        window.Som.tocarArpejo();
                    }
                    dispararChamaNeon(faixaCombo.multiplicador);
                } else if (window.Som && typeof window.Som.tocarAcerto === 'function') {
                    window.Som.tocarAcerto();
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
                    setTimeout(function () {
                        if (partidaAtiva) self.proximaQuestao();
                    }, 300);
                }
            }
        },

        alternarAjudaVisual: function (ativo) {
            var containerAjuda = document.getElementById('container-ajuda-visual');
            this._sincronizarBotaoAjuda(ativo);

            if (!containerAjuda || !ativo || !estadoPartida.contaAtual) {
                return;
            }

            containerAjuda.classList.remove('oculto');

            if (window.Visual && typeof window.Visual.renderizarAjuda === 'function') {
                window.Visual.renderizarAjuda(estadoPartida.contaAtual, this.modoAtual, containerAjuda);
            }
        },

        encerrarPartida: function () {
            // Desativa flag antes de chamar pararPartida para evitar gravação duplicada
            this.partidaAtiva = partidaAtiva = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            if (estadoPartida.timeoutTransicao) {
                clearTimeout(estadoPartida.timeoutTransicao);
                estadoPartida.timeoutTransicao = null;
            }

            if (window.Som && typeof window.Som.tocarArpejo === 'function' && estadoPartida.pontos > 0) {
                window.Som.tocarArpejo();
                dispararChamaNeon(4);
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
                    treinoAcertos: estadoPartida.treinoAcertos
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