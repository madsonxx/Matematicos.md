/**
 * ==========================================================================
 * 9. js/modos.js — Fluxo do Modo Desafio (30s), Modo Treino e Passo a Passo Real (M6)
 * Implementa:
 * - Mascote aparece apenas em momentos-chave (combos, erros, passo a passo) deslizando na lateral
 * - Clicar em "Ajuda Visual" no Desafio ativa automaticamente o modo de 5 Opções
 * - Visor com sublinhado (_ / __) e preenchimento imediato a cada botão clicado
 * - Fluxo Passo a Passo Interativo Real (Unidade -> Dezena)
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
        tipoEntradaAtual: 'teclado',
        pontos: 0,
        acertos: 0,
        erros: 0,
        treinoAcertos: 0,
        sequenciaAtual: 0,
        melhorSequencia: 0,
        maxMult: 1,
        contaAtual: null,
        bloqueadoOpcoes: false,
        timeoutTransicao: null,
        passoAPasso: {
            ativo: false,
            etapa: 'uni',
            alvoUni: 0,
            alvoDez: 0,
            digitoUni: null,
            digitoDez: null,
            falaUni: '',
            falaDez: '',
            vaiUm: false,
            emprestimo: false,
            dezRestante: 0,
            uniNova: 0
        }
    };

    var NOMES_OPERACOES = {
        adicao: { icone: '➕', nome: 'Adição' },
        subtracao: { icone: '➖', nome: 'Subtração' },
        multiplicacao: { icone: '✖️', nome: 'Multiplicação' },
        divisao: { icone: '➗', nome: 'Divisão' },
        mestre: { icone: '👑', nome: 'Modo Mestre' }
    };

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

    // Gera alternativas inteligentes (3 para Treino, 5 para Desafio)
    function gerarAlternativasInteligentes(respostaCorreta, quantidade, maxValorPermitido) {
        var certa = Number(respostaCorreta);
        var opcoes = [certa];
        var qtdDesejada = quantidade || 3;
        var limiteMax = maxValorPermitido !== undefined ? maxValorPermitido : 999;

        var deltas = [-3, -2, -1, 1, 2, 3, -4, 4, -5, 5, 10, -10];
        for (var i = deltas.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = deltas[i];
            deltas[i] = deltas[j];
            deltas[j] = temp;
        }

        for (var k = 0; k < deltas.length && opcoes.length < qtdDesejada; k++) {
            var cand = certa + deltas[k];
            if (cand >= 0 && cand <= limiteMax && opcoes.indexOf(cand) === -1) {
                opcoes.push(cand);
            }
        }

        var inc = 1;
        while (opcoes.length < qtdDesejada) {
            var extraPos = certa + inc;
            var extraNeg = certa - inc;
            if (extraPos >= 0 && extraPos <= limiteMax && opcoes.indexOf(extraPos) === -1) {
                opcoes.push(extraPos);
            } else if (extraNeg >= 0 && extraNeg <= limiteMax && opcoes.indexOf(extraNeg) === -1) {
                opcoes.push(extraNeg);
            }
            inc++;
            if (inc > 30) break;
        }

        for (var m = opcoes.length - 1; m > 0; m--) {
            var n = Math.floor(Math.random() * (m + 1));
            var aux = opcoes[m];
            opcoes[m] = opcoes[n];
            opcoes[n] = aux;
        }

        return opcoes;
    }

    /**
     * Constrói os dados do Passo a Passo Interativo Real (Unidade -> Dezena)
     */
    function prepararDadosPassoAPasso(conta, ajudaMarcada) {
        var op = String(conta.operacao || '').toLowerCase();
        var ehSoma = (op === 'adicao' || op === '+');
        var ehSub = (op === 'subtracao' || op === '-' || op === '−');
        var numA = conta.numA;
        var numB = conta.numB;
        var resp = conta.resposta;

        var elegivelDuasColunas = Boolean(
            ajudaMarcada &&
            resp >= 10 &&
            ((ehSoma && (numA >= 10 || numB >= 10)) || (ehSub && numA >= 20))
        );

        if (!elegivelDuasColunas) {
            var falaSimples = '';
            if (ajudaMarcada) {
                if (ehSoma) {
                    falaSimples = 'Quanto é <strong>' + numA + ' + ' + numB + '</strong>?';
                } else if (ehSub) {
                    falaSimples = 'Quanto é <strong>' + numA + ' − ' + numB + '</strong>?';
                }
            }
            return {
                ativo: false,
                falaSimples: falaSimples
            };
        }

        var dezA = Math.floor(numA / 10);
        var uniA = numA % 10;
        var dezB = Math.floor(numB / 10);
        var uniB = numB % 10;

        if (ehSoma) {
            var somaUni = uniA + uniB;
            var vaiUm = somaUni >= 10;
            var digitoUni = somaUni % 10;
            var digitoDez = dezA + dezB + (vaiUm ? 1 : 0);

            var falaUniSoma = vaiUm
                ? 'Unidades: <strong>' + uniA + ' + ' + uniB + '</strong> passa de 9! Qual fica na unidade?'
                : 'Comece pelas unidades: quanto é <strong>' + uniA + ' + ' + uniB + '</strong>?';

            var falaDezSoma = vaiUm
                ? 'Subiu <strong>+1</strong>! Dezenas: quanto é <strong>1 + ' + dezA + ' + ' + dezB + '</strong>?'
                : 'Agora as dezenas: quanto é <strong>' + dezA + ' + ' + dezB + '</strong>?';

            return {
                ativo: true,
                etapa: 'uni',
                alvoUni: digitoUni,
                alvoDez: digitoDez,
                digitoUni: null,
                digitoDez: null,
                falaUni: falaUniSoma,
                falaDez: falaDezSoma,
                vaiUm: vaiUm,
                emprestimo: false,
                dezRestante: dezA,
                uniNova: uniA
            };
        } else {
            var precisaEmp = uniA < uniB;
            var uniEfetiva = precisaEmp ? (uniA + 10) : uniA;
            var dezEfetiva = precisaEmp ? (dezA - 1) : dezA;
            var difUni = uniEfetiva - uniB;
            var difDez = dezEfetiva - dezB;

            var falaUniSub = precisaEmp
                ? 'Unidades: <strong>' + uniA + '</strong> virou <strong>' + uniEfetiva + '</strong>! Quanto é <strong>' + uniEfetiva + ' − ' + uniB + '</strong>?'
                : 'Comece pelas unidades: quanto é <strong>' + uniA + ' − ' + uniB + '</strong>?';

            var falaDezSub = precisaEmp
                ? 'Agora as dezenas: quanto é <strong>' + dezEfetiva + ' − ' + dezB + '</strong>?'
                : 'Agora as dezenas: quanto é <strong>' + dezA + ' − ' + dezB + '</strong>?';

            return {
                ativo: true,
                etapa: 'uni',
                alvoUni: difUni,
                alvoDez: difDez,
                digitoUni: null,
                digitoDez: null,
                falaUni: falaUniSub,
                falaDez: falaDezSub,
                vaiUm: false,
                emprestimo: precisaEmp,
                dezRestante: dezEfetiva,
                uniNova: uniEfetiva
            };
        }
    }

    function gerarExplicacaoDidatica(conta) {
        var a = conta.numA;
        var b = conta.numB;
        var r = conta.resposta;
        var op = conta.operacao;

        if (op === 'adicao' || op === '+') {
            return '💡 Olhe só: <strong>' + a + ' + ' + b + ' = ' + r + '</strong>!';
        }
        if (op === 'subtracao' || op === '-') {
            return '💡 Tirando <strong>' + b + '</strong> de <strong>' + a + '</strong>, sobram <strong>' + r + '</strong>!';
        }
        if (op === 'multiplicacao' || op === '×') {
            return '💡 Lembre: <strong>' + a + ' × ' + b + ' = ' + r + '</strong>!';
        }
        if (op === 'divisao' || op === '÷') {
            return '💡 Pois <strong>' + b + ' × ' + r + ' = ' + a + '</strong>. Dá <strong>' + r + '</strong>!';
        }
        return '💡 A resposta correta é <strong>' + r + '</strong>!';
    }

    function definirFalaMascoteDireta(texto, destacarDuolingo, duracaoMs) {
        if (window.Mascotes && typeof window.Mascotes.falarTextoDireto === 'function') {
            window.Mascotes.falarTextoDireto(texto, Boolean(destacarDuolingo), duracaoMs || 3600);
        }
    }

    var Modos = {
        modoAtual: 'desafio',
        operacaoAtual: 'adicao',
        preferenciaEntradaDesafio: 'teclado',
        preferenciaEntradaTreino: 'opcoes',
        partidaAtiva: false,

        // Alterna no Desafio entre Teclado e 5 Opções
        alternarMetodoEntradaNoJogo: function () {
            if (!partidaAtiva) return;

            var novoTipo = (estadoPartida.tipoEntradaAtual === 'teclado') ? 'opcoes' : 'teclado';
            estadoPartida.tipoEntradaAtual = novoTipo;

            if (this.modoAtual === 'desafio') {
                this.preferenciaEntradaDesafio = novoTipo;
            } else {
                this.preferenciaEntradaTreino = novoTipo;
            }

            this._sincronizarInterfaceEntrada();
            this._configurarEntradaParaEstadoAtual();
        },

        _sincronizarInterfaceEntrada: function () {
            var usarOpcoes = (estadoPartida.tipoEntradaAtual === 'opcoes');
            var elTeclado = document.getElementById('container-teclado');
            var elTreino = document.getElementById('container-treino');
            var btnTroca = document.getElementById('btn-alternar-entrada-jogo');

            if (elTeclado) elTeclado.classList.toggle('oculto', usarOpcoes);
            if (elTreino) {
                elTreino.classList.toggle('oculto', !usarOpcoes);
                elTreino.classList.toggle('grade-opcoes-3', this.modoAtual === 'treino');
                elTreino.classList.toggle('grade-opcoes-5', this.modoAtual === 'desafio');
            }

            if (btnTroca) {
                btnTroca.classList.toggle('oculto', this.modoAtual === 'treino');
                btnTroca.innerHTML = usarOpcoes ? '⌨️ Teclado' : '🎯 5 Opções';
                btnTroca.classList.toggle('modo-opcoes-ativo', usarOpcoes);
            }
        },

        iniciarPartida: function (modo, operacao) {
            try {
                var self = this;
                this.pararPartida();

                this.modoAtual = (modo === 'treino') ? 'treino' : 'desafio';
                this.operacaoAtual = operacao || 'adicao';
                this.partidaAtiva = partidaAtiva = true;

                var entradaInicial = (this.modoAtual === 'treino') ? 'opcoes' : this.preferenciaEntradaDesafio;

                estadoPartida = {
                    modoAtual: this.modoAtual,
                    operacaoAtual: this.operacaoAtual,
                    tipoEntradaAtual: entradaInicial,
                    pontos: 0,
                    acertos: 0,
                    erros: 0,
                    treinoAcertos: 0,
                    sequenciaAtual: 0,
                    melhorSequencia: 0,
                    maxMult: 1,
                    contaAtual: null,
                    bloqueadoOpcoes: false,
                    timeoutTransicao: null,
                    passoAPasso: { ativo: false, etapa: 'uni' }
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
                    window.Teclado.inicializar(
                        function (valorFinal) {
                            self.verificarRespostaTeclado(valorFinal);
                        },
                        function (parcialAtual) {
                            self._aoDigitarNoTecladoParcial(parcialAtual);
                        }
                    );
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

                if (elTimer) elTimer.classList.toggle('oculto', this.modoAtual === 'treino');
                if (elPlacar) elPlacar.classList.toggle('oculto', this.modoAtual === 'treino');

                this._sincronizarInterfaceEntrada();
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
            if (window.Mascotes && typeof window.Mascotes.esconder === 'function') {
                window.Mascotes.esconder();
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
                if (window.Mascotes && typeof window.Mascotes.esconder === 'function') {
                    window.Mascotes.esconder();
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
            estadoPartida.bloqueadoOpcoes = false;

            var elConta = document.getElementById('texto-conta');
            var elDisplay = document.getElementById('display-resposta');

            if (elDisplay) {
                elDisplay.classList.remove('display-erro', 'display-correto', 'tremer');
            }

            if (window.Visual && typeof window.Visual.renderizarContaNoPalco === 'function') {
                window.Visual.renderizarContaNoPalco(estadoPartida.contaAtual, elConta, elDisplay);
            } else if (elConta) {
                elConta.textContent = estadoPartida.contaAtual.texto;
            }

            var chkAjuda = document.getElementById('chk-ajuda');
            var ajudaAtiva = Boolean(chkAjuda && chkAjuda.checked);

            this._aplicarEstadoAjudaEPassoAPasso(ajudaAtiva);
        },

        /**
         * Configura o Passo a Passo Interativo Real (Unidade -> Dezena) ou a ajuda visual normal
         */
        _aplicarEstadoAjudaEPassoAPasso: function (ajudaAtiva) {
            var conta = estadoPartida.contaAtual;
            if (!conta) return;

            var containerAjuda = document.getElementById('container-ajuda-visual');
            var dadosPasso = prepararDadosPassoAPasso(conta, ajudaAtiva);
            estadoPartida.passoAPasso = dadosPasso;

            if (dadosPasso.ativo) {
                if (containerAjuda) {
                    containerAjuda.classList.add('oculto');
                    containerAjuda.innerHTML = '';
                }
                this._atualizarUIEtapaPassoAPasso();
            } else {
                if (window.Visual && typeof window.Visual.limparDestaquesArminha === 'function') {
                    window.Visual.limparDestaquesArminha();
                }

                if (ajudaAtiva) {
                    var op = String(conta.operacao || '').toLowerCase();
                    var ehArminhaSimples = (op === 'adicao' || op === '+' || op === 'subtracao' || op === '-' || op === '−');
                    if (ehArminhaSimples && window.Visual && typeof window.Visual.destacarColunaArminha === 'function') {
                        window.Visual.destacarColunaArminha('uni', {});
                    }
                    if (dadosPasso.falaSimples) {
                        definirFalaMascoteDireta(dadosPasso.falaSimples, true, 3200);
                    }
                    if (containerAjuda && window.Visual && typeof window.Visual.renderizarAjuda === 'function') {
                        containerAjuda.classList.remove('oculto');
                        window.Visual.renderizarAjuda(conta, this.modoAtual, containerAjuda);
                    }
                } else if (containerAjuda) {
                    containerAjuda.classList.add('oculto');
                    containerAjuda.innerHTML = '';
                }

                this._configurarEntradaParaEstadoAtual();
            }
        },

        /**
         * Atualiza a cápsula neon (Unidade ou Dezena), o sublinhado em foco e o balão lateral da coruja
         */
        _atualizarUIEtapaPassoAPasso: function () {
            var p = estadoPartida.passoAPasso;
            var conta = estadoPartida.contaAtual;
            var elDisplay = document.getElementById('display-resposta');
            if (!p || !p.ativo || !conta) return;

            if (p.etapa === 'uni') {
                if (window.Visual && typeof window.Visual.destacarColunaArminha === 'function') {
                    window.Visual.destacarColunaArminha('uni', {
                        vaiUm: false,
                        emprestimo: p.emprestimo,
                        dezRestante: p.dezRestante,
                        uniNova: p.uniNova
                    });
                }
                definirFalaMascoteDireta(p.falaUni, true, 4000);
            } else {
                if (window.Visual && typeof window.Visual.destacarColunaArminha === 'function') {
                    window.Visual.destacarColunaArminha('dez', {
                        vaiUm: p.vaiUm,
                        emprestimo: p.emprestimo,
                        dezRestante: p.dezRestante,
                        uniNova: p.uniNova
                    });
                }
                definirFalaMascoteDireta(p.falaDez, true, 4000);
            }

            if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                window.Visual.atualizarVisorSublinhado(elDisplay, '', String(conta.resposta).length, true, p);
            }

            this._configurarEntradaParaEstadoAtual();
        },

        _configurarEntradaParaEstadoAtual: function () {
            var conta = estadoPartida.contaAtual;
            if (!conta) return;

            var p = estadoPartida.passoAPasso;
            var alvoAtual = (p && p.ativo)
                ? (p.etapa === 'uni' ? p.alvoUni : p.alvoDez)
                : conta.resposta;

            if (estadoPartida.tipoEntradaAtual === 'opcoes') {
                this._renderizarBotoesOpcoes(alvoAtual, Boolean(p && p.ativo));
            } else if (window.Teclado && typeof window.Teclado.prepararParaNovaConta === 'function') {
                window.Teclado.prepararParaNovaConta(alvoAtual, Boolean(p && p.ativo));
            }
        },

        _aoDigitarNoTecladoParcial: function (parcialTexto) {
            var conta = estadoPartida.contaAtual;
            if (!conta) return;

            var elDisplay = document.getElementById('display-resposta');
            var p = estadoPartida.passoAPasso;

            if (p && p.ativo) {
                var copiaPasso = {
                    ativo: true,
                    etapa: p.etapa,
                    digitoUni: p.etapa === 'uni' ? (parcialTexto.length > 0 ? parcialTexto : null) : p.digitoUni,
                    digitoDez: p.etapa === 'dez' ? (parcialTexto.length > 0 ? parcialTexto : null) : p.digitoDez
                };
                if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                    window.Visual.atualizarVisorSublinhado(elDisplay, parcialTexto, String(conta.resposta).length, true, copiaPasso);
                }
            } else if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                window.Visual.atualizarVisorSublinhado(elDisplay, parcialTexto, String(conta.resposta).length, undefined, null);
            }
        },

        _renderizarBotoesOpcoes: function (valorCorretoAlvo, ehColunaUnica) {
            var self = this;
            var containerTreino = document.getElementById('container-treino');
            if (!containerTreino) return;

            containerTreino.innerHTML = '';
            var qtdBotoes = (this.modoAtual === 'desafio') ? 5 : 3;
            var limiteMax = ehColunaUnica ? 9 : 999;
            var opcoes = gerarAlternativasInteligentes(valorCorretoAlvo, qtdBotoes, limiteMax);

            containerTreino.classList.toggle('grade-opcoes-3', qtdBotoes === 3);
            containerTreino.classList.toggle('grade-opcoes-5', qtdBotoes === 5);

            opcoes.forEach(function (valorOpcao) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-alternativa';
                btn.textContent = valorOpcao;
                btn.setAttribute('data-valor', String(valorOpcao));

                btn.addEventListener('click', function () {
                    self._processarCliqueBotaoOpcao(btn, valorOpcao, containerTreino);
                });

                containerTreino.appendChild(btn);
            });
        },

        _processarCliqueBotaoOpcao: function (botaoClicado, valorEscolhido, container) {
            if (!partidaAtiva || estadoPartida.bloqueadoOpcoes || !estadoPartida.contaAtual) return;

            var self = this;
            var conta = estadoPartida.contaAtual;
            var p = estadoPartida.passoAPasso;
            var elDisplay = document.getElementById('display-resposta');

            // CASO 1: Passo a Passo Interativo por Coluna (Unidade -> Dezena)
            if (p && p.ativo) {
                var alvoColuna = (p.etapa === 'uni') ? p.alvoUni : p.alvoDez;
                var acertouColuna = (Number(valorEscolhido) === Number(alvoColuna));

                if (p.etapa === 'uni') {
                    p.digitoUni = valorEscolhido;
                    if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                        window.Visual.atualizarVisorSublinhado(elDisplay, '', String(conta.resposta).length, true, p);
                    }

                    if (acertouColuna) {
                        botaoClicado.classList.add('alternativa-correta');
                        if (window.Som && typeof window.Som.tocarAcerto === 'function') window.Som.tocarAcerto();

                        estadoPartida.bloqueadoOpcoes = true;
                        setTimeout(function () {
                            if (!partidaAtiva) return;
                            estadoPartida.bloqueadoOpcoes = false;
                            p.etapa = 'dez';
                            self._atualizarUIEtapaPassoAPasso();
                        }, 240);
                    } else {
                        botaoClicado.classList.add('alternativa-errada');
                        botaoClicado.disabled = true;
                        if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();

                        setTimeout(function () {
                            if (!partidaAtiva) return;
                            p.digitoUni = null;
                            if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                                window.Visual.atualizarVisorSublinhado(elDisplay, '', String(conta.resposta).length, true, p);
                            }
                        }, 320);
                    }
                    return;
                }

                // Etapa 2: Coluna das Dezenas ('dez')
                p.digitoDez = valorEscolhido;
                if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                    window.Visual.atualizarVisorSublinhado(elDisplay, '', String(conta.resposta).length, true, p);
                }

                if (acertouColuna) {
                    if (this.modoAtual === 'desafio') {
                        this._finalizarTentativaOpcaoDesafio(botaoClicado, conta.resposta, conta, container);
                    } else {
                        this._finalizarTentativaTreino(botaoClicado, conta.resposta, conta, container);
                    }
                } else {
                    botaoClicado.classList.add('alternativa-errada');
                    botaoClicado.disabled = true;
                    if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();

                    setTimeout(function () {
                        if (!partidaAtiva) return;
                        p.digitoDez = null;
                        if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                            window.Visual.atualizarVisorSublinhado(elDisplay, '', String(conta.resposta).length, true, p);
                        }
                    }, 320);
                }
                return;
            }

            // CASO 2: Conta direta
            if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                window.Visual.atualizarVisorSublinhado(elDisplay, String(valorEscolhido), String(conta.resposta).length, undefined, null);
            }

            if (this.modoAtual === 'desafio') {
                this._finalizarTentativaOpcaoDesafio(botaoClicado, valorEscolhido, conta, container);
            } else {
                this._finalizarTentativaTreino(botaoClicado, valorEscolhido, conta, container);
            }
        },

        _finalizarTentativaOpcaoDesafio: function (botaoClicado, valorEscolhido, conta, container) {
            if (!partidaAtiva || estadoPartida.bloqueadoOpcoes) return;
            estadoPartida.bloqueadoOpcoes = true;

            var self = this;
            var acertou = (Number(valorEscolhido) === Number(conta.resposta));
            var elDisplay = document.getElementById('display-resposta');
            var botoes = container.querySelectorAll('.btn-alternativa');

            for (var i = 0; i < botoes.length; i++) {
                botoes[i].disabled = true;
            }

            if (window.Motor && typeof window.Motor.registrarResposta === 'function') {
                window.Motor.registrarResposta(acertou);
            }

            if (acertou) {
                botaoClicado.classList.add('alternativa-correta');
                if (elDisplay) elDisplay.classList.add('display-correto');

                estadoPartida.acertos++;
                estadoPartida.sequenciaAtual++;
                if (estadoPartida.sequenciaAtual > estadoPartida.melhorSequencia) {
                    estadoPartida.melhorSequencia = estadoPartida.sequenciaAtual;
                }

                var faixaCombo = this._obterFaixaCombo(estadoPartida.sequenciaAtual);
                if (faixaCombo.multiplicador > estadoPartida.maxMult) {
                    estadoPartida.maxMult = faixaCombo.multiplicador;
                }

                estadoPartida.pontos += (100 * faixaCombo.multiplicador);
                this._atualizarPlacarUI();

                var marcosFogo = (window.CONFIG && window.CONFIG.COMBO && window.CONFIG.COMBO.MARCOS_FOGO) || [3, 7, 10, 14, 18, 22, 26, 30];
                if (marcosFogo.indexOf(estadoPartida.sequenciaAtual) !== -1) {
                    if (window.Som && typeof window.Som.tocarArpejo === 'function') window.Som.tocarArpejo();
                    dispararChamaNeon(faixaCombo.multiplicador);
                    // Mascote desliza na lateral APENAS nos marcos de combo!
                    if (window.Mascotes && typeof window.Mascotes.atualizarFala === 'function') {
                        window.Mascotes.atualizarFala('combo', { multiplicador: faixaCombo.multiplicador });
                    }
                } else if (window.Som && typeof window.Som.tocarAcerto === 'function') {
                    window.Som.tocarAcerto();
                }

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 160);
            } else {
                botaoClicado.classList.add('alternativa-errada');
                if (elDisplay) {
                    if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                        window.Visual.atualizarVisorSublinhado(elDisplay, String(conta.resposta), String(conta.resposta).length, undefined, null);
                    }
                    elDisplay.classList.add('display-erro');
                }

                for (var j = 0; j < botoes.length; j++) {
                    if (Number(botoes[j].getAttribute('data-valor')) === Number(conta.resposta)) {
                        botoes[j].classList.add('alternativa-correta');
                    }
                }

                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                this._atualizarPlacarUI();

                if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();
                // Mascote desliza na lateral para dar dica de erro!
                definirFalaMascoteDireta(gerarExplicacaoDidatica(conta), false, 2800);

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 360);
            }
        },

        _finalizarTentativaTreino: function (botaoClicado, valorEscolhido, conta, container) {
            if (!partidaAtiva || estadoPartida.bloqueadoOpcoes) return;
            estadoPartida.bloqueadoOpcoes = true;

            var self = this;
            var acertou = (Number(valorEscolhido) === Number(conta.resposta));
            var elDisplay = document.getElementById('display-resposta');
            var botoes = container.querySelectorAll('.btn-alternativa');

            for (var i = 0; i < botoes.length; i++) {
                botoes[i].disabled = true;
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
                    definirFalaMascoteDireta('🔥 ' + estadoPartida.sequenciaAtual + ' seguidos! Mandou muito bem!', false, 2400);
                }

                if (window.Som && typeof window.Som.tocarAcerto === 'function') {
                    window.Som.tocarAcerto();
                }

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 750);
            } else {
                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                botaoClicado.classList.add('alternativa-errada');
                if (elDisplay) {
                    if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                        window.Visual.atualizarVisorSublinhado(elDisplay, String(conta.resposta), String(conta.resposta).length, undefined, null);
                    }
                    elDisplay.classList.add('display-erro');
                }

                for (var j = 0; j < botoes.length; j++) {
                    if (Number(botoes[j].getAttribute('data-valor')) === Number(conta.resposta)) {
                        botoes[j].classList.add('alternativa-correta');
                    }
                }

                if (window.Som && typeof window.Som.tocarErro === 'function') {
                    window.Som.tocarErro();
                }

                // Mascote desliza na lateral explicando o erro!
                definirFalaMascoteDireta(gerarExplicacaoDidatica(conta), false, 3200);

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 1450);
            }
        },

        verificarRespostaTeclado: function (entradaTexto) {
            if (!partidaAtiva || !estadoPartida.contaAtual) return;

            var self = this;
            var conta = estadoPartida.contaAtual;
            var p = estadoPartida.passoAPasso;
            var elDisplay = document.getElementById('display-resposta');

            if (p && p.ativo) {
                var digito = Number(entradaTexto);
                if (p.etapa === 'uni') {
                    if (digito === Number(p.alvoUni)) {
                        p.digitoUni = String(digito);
                        if (window.Som && typeof window.Som.tocarAcerto === 'function') window.Som.tocarAcerto();
                        p.etapa = 'dez';
                        this._atualizarUIEtapaPassoAPasso();
                    } else {
                        if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();
                        if (elDisplay) elDisplay.classList.add('tremer');
                        setTimeout(function () {
                            if (elDisplay) elDisplay.classList.remove('tremer');
                            p.digitoUni = null;
                            self._atualizarUIEtapaPassoAPasso();
                        }, 280);
                    }
                    return;
                } else {
                    if (digito === Number(p.alvoDez)) {
                        p.digitoDez = String(digito);
                        if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                            window.Visual.atualizarVisorSublinhado(elDisplay, String(conta.resposta), String(conta.resposta).length, true, p);
                        }
                        this.verificarRespostaDesafio(String(conta.resposta));
                    } else {
                        if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();
                        if (elDisplay) elDisplay.classList.add('tremer');
                        setTimeout(function () {
                            if (elDisplay) elDisplay.classList.remove('tremer');
                            p.digitoDez = null;
                            self._atualizarUIEtapaPassoAPasso();
                        }, 280);
                    }
                    return;
                }
            }

            if (this.modoAtual === 'treino') {
                this._verificarTecladoNoTreino(entradaTexto);
            } else {
                this.verificarRespostaDesafio(entradaTexto);
            }
        },

        _verificarTecladoNoTreino: function (entradaTexto) {
            if (estadoPartida.bloqueadoOpcoes) return;
            estadoPartida.bloqueadoOpcoes = true;

            var self = this;
            var conta = estadoPartida.contaAtual;
            var acertou = (Number(entradaTexto) === Number(conta.resposta));
            var elDisplay = document.getElementById('display-resposta');

            if (window.Motor && typeof window.Motor.registrarResposta === 'function') {
                window.Motor.registrarResposta(acertou);
            }

            if (acertou) {
                estadoPartida.treinoAcertos++;
                estadoPartida.sequenciaAtual++;
                if (elDisplay) elDisplay.classList.add('display-correto');
                if (estadoPartida.sequenciaAtual % 5 === 0) {
                    dispararChamaNeon(3);
                    definirFalaMascoteDireta('🔥 ' + estadoPartida.sequenciaAtual + ' seguidos! Mandou bem!', false, 2400);
                }
                if (window.Som && typeof window.Som.tocarAcerto === 'function') window.Som.tocarAcerto();

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 750);
            } else {
                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                if (elDisplay) {
                    if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
                        window.Visual.atualizarVisorSublinhado(elDisplay, String(conta.resposta), String(conta.resposta).length, undefined, null);
                    }
                    elDisplay.classList.add('display-erro');
                }
                if (window.Som && typeof window.Som.tocarErro === 'function') window.Som.tocarErro();
                definirFalaMascoteDireta(gerarExplicacaoDidatica(conta), false, 3200);

                estadoPartida.timeoutTransicao = setTimeout(function () {
                    if (partidaAtiva) self.proximaQuestao();
                }, 1450);
            }
        },

        verificarRespostaDesafio: function (entradaTexto) {
            if (!partidaAtiva || !estadoPartida.contaAtual) return;

            var conta = estadoPartida.contaAtual;
            var valorDigitado = Number(entradaTexto);
            var respostaCerta = Number(conta.resposta);
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

                estadoPartida.pontos += (100 * faixaCombo.multiplicador);
                this._atualizarPlacarUI();

                var marcosFogo = (window.CONFIG && window.CONFIG.COMBO && window.CONFIG.COMBO.MARCOS_FOGO) || [3, 7, 10, 14, 18, 22, 26, 30];
                if (marcosFogo.indexOf(estadoPartida.sequenciaAtual) !== -1) {
                    if (window.Som && typeof window.Som.tocarArpejo === 'function') {
                        window.Som.tocarArpejo();
                    }
                    dispararChamaNeon(faixaCombo.multiplicador);
                    // Mascote desliza na lateral apenas nos marcos de combo!
                    if (window.Mascotes && typeof window.Mascotes.atualizarFala === 'function') {
                        window.Mascotes.atualizarFala('combo', { multiplicador: faixaCombo.multiplicador });
                    }
                } else if (window.Som && typeof window.Som.tocarAcerto === 'function') {
                    window.Som.tocarAcerto();
                }

                this.proximaQuestao();
            } else {
                estadoPartida.erros++;
                estadoPartida.sequenciaAtual = 0;
                this._atualizarPlacarUI();

                if (window.Som) window.Som.tocarErro();
                // Mascote desliza na lateral dando a dica do erro!
                definirFalaMascoteDireta(gerarExplicacaoDidatica(conta), false, 2800);

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

        /**
         * Ao ligar a Ajuda Visual:
         * - Se estiver no Desafio usando o Teclado, muda automaticamente para o modo de 5 Opções!
         *   Assim libera espaço vertical imediato e oferece as 5 opções de apoio ao aluno.
         */
        alternarAjudaVisual: function (ativo) {
            var ligar = Boolean(ativo);

            if (ligar && this.modoAtual === 'desafio' && estadoPartida.tipoEntradaAtual !== 'opcoes') {
                estadoPartida.tipoEntradaAtual = 'opcoes';
                this.preferenciaEntradaDesafio = 'opcoes';
                this._sincronizarInterfaceEntrada();
            }

            this._sincronizarBotaoAjuda(ligar);
            if (!estadoPartida.contaAtual) return;
            this._aplicarEstadoAjudaEPassoAPasso(ligar);
        },

        encerrarPartida: function () {
            this.partidaAtiva = partidaAtiva = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            if (estadoPartida.timeoutTransicao) {
                clearTimeout(estadoPartida.timeoutTransicao);
                estadoPartida.timeoutTransicao = null;
            }
            if (window.Mascotes && typeof window.Mascotes.esconder === 'function') {
                window.Mascotes.esconder();
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