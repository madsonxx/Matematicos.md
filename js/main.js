/**
 * ==========================================================================
 * 10. js/main.js — Controle de Telas e Inicialização (window.Main)
 * Conecta os botões do HTML e coordena a navegação entre todas as telas.
 * Atualizado para o Marco 3 (Modo Treino + Modo Assistido).
 * ==========================================================================
 */
(function () {
    'use strict';

    window.Main = {
        modoSelecionado: 'desafio',

        // Ponto de entrada chamado assim que o DOM carrega
        inicializar: function () {
            this._configurarEventos();
            this._atualizarBotaoSom();

            // Verifica se já existe um aluno identificado no aparelho
            var aluno = window.Dados.obterAlunoAtual();
            if (aluno) {
                this.irParaMenu();
            } else {
                this.abrirTelaIdentificacao();
            }
        },

        // Esconde todas as seções `.tela` e exibe apenas a solicitada pelo ID
        mostrarTela: function (idTela) {
            var telas = document.querySelectorAll('.tela');
            for (var i = 0; i < telas.length; i++) {
                telas[i].classList.add('oculto');
            }

            var alvo = document.getElementById(idTela);
            if (alvo) {
                alvo.classList.remove('oculto');
            }

            // Renderiza a tela de conquistas se for aberta
            if (idTela === 'tela-conquistas' && window.Conquistas) {
                window.Conquistas.renderizarTela('container-conquistas');
            }
        },

        // Abre a tela para digitar Nome e Sobrenome ou escolher um aluno recente
        abrirTelaIdentificacao: function () {
            if (window.Modos && typeof window.Modos.pararPartida === 'function') {
                window.Modos.pararPartida();
            }

            var input = document.getElementById('input-nome-aluno');
            var erro = document.getElementById('erro-identificacao');
            if (input) input.value = '';
            if (erro) erro.classList.add('oculto');

            // Renderiza chips de alunos que já jogaram neste aparelho
            var recentes = window.Dados.listarAlunosRecentes();
            var containerRecentes = document.getElementById('container-alunos-recentes');
            var listaRecentes = document.getElementById('lista-alunos-recentes');

            if (recentes.length > 0 && containerRecentes && listaRecentes) {
                containerRecentes.classList.remove('oculto');
                listaRecentes.innerHTML = '';

                recentes.forEach(function (nome) {
                    var btnChip = document.createElement('button');
                    btnChip.type = 'button';
                    btnChip.className = 'chip-aluno';
                    btnChip.textContent = nome;
                    btnChip.addEventListener('click', function () {
                        window.Dados.definirAlunoAtual(nome);
                        window.Main.irParaMenu();
                    });
                    listaRecentes.appendChild(btnChip);
                });
            } else if (containerRecentes) {
                containerRecentes.classList.add('oculto');
            }

            this.mostrarTela('tela-identificacao');
        },

        // Confirma a digitação de Nome e Sobrenome
        confirmarIdentificacao: function () {
            var input = document.getElementById('input-nome-aluno');
            var erro = document.getElementById('erro-identificacao');
            var textoDigitado = input ? input.value : '';

            if (!window.Dados.validarNomeESobrenome(textoDigitado)) {
                if (erro) erro.classList.remove('oculto');
                if (input) input.focus();
                return;
            }

            if (erro) erro.classList.add('oculto');
            window.Dados.definirAlunoAtual(textoDigitado);
            this.irParaMenu();
        },

        // Atualiza o cabeçalho do aluno e mostra o Menu Principal
        irParaMenu: function () {
            if (window.Modos && typeof window.Modos.pararPartida === 'function') {
                window.Modos.pararPartida();
            }

            var aluno = window.Dados.obterAlunoAtual();
            if (!aluno) {
                this.abrirTelaIdentificacao();
                return;
            }

            var elNome = document.getElementById('nome-aluno-menu');
            if (elNome) {
                elNome.textContent = aluno.nomeExibicao || aluno.nome;
            }

            this.mostrarTela('tela-menu');
        },

        // Abre a tela de escolha das 4 operações + Modo Mestre
        abrirEscolhaOperacao: function (modo) {
            this.modoSelecionado = modo;
            var badge = document.getElementById('badge-modo-escolhido');
            if (badge) {
                badge.textContent = modo === 'desafio' ? '⚡ Modo Desafio' : '🎯 Modo Treino';
            }
            this.mostrarTela('tela-operacao');
        },

        // Atualiza o texto do botão de Som (🔊/🔇) no Menu
        _atualizarBotaoSom: function () {
            var somAtivo = window.Dados.obterSomAtivo();
            var btnSom = document.getElementById('btn-alternar-som');
            if (btnSom) {
                btnSom.textContent = somAtivo ? '🔊 Som: Ligado' : '🔇 Som: Desligado';
            }
        },

        // Registra todos os cliques de botões da interface
        _configurarEventos: function () {
            var self = this;

            // 1. Eventos da Tela de Identificação
            var btnConfirmarAluno = document.getElementById('btn-confirmar-aluno');
            var inputNome = document.getElementById('input-nome-aluno');
            if (btnConfirmarAluno) {
                btnConfirmarAluno.addEventListener('click', function () {
                    self.confirmarIdentificacao();
                });
            }
            if (inputNome) {
                inputNome.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') self.confirmarIdentificacao();
                });
            }

            // 2. Eventos do Menu Principal
            var btnTrocar = document.getElementById('btn-trocar-aluno');
            if (btnTrocar) btnTrocar.addEventListener('click', function () {
                self.abrirTelaIdentificacao();
            });

            var btnDesafio = document.getElementById('btn-modo-desafio');
            if (btnDesafio) btnDesafio.addEventListener('click', function () {
                self.abrirEscolhaOperacao('desafio');
            });

            var btnTreino = document.getElementById('btn-modo-treino');
            if (btnTreino) btnTreino.addEventListener('click', function () {
                self.abrirEscolhaOperacao('treino');
            });

            var btnConq = document.getElementById('btn-abrir-conquistas');
            if (btnConq) btnConq.addEventListener('click', function () {
                self.mostrarTela('tela-conquistas');
            });

            var btnRank = document.getElementById('btn-abrir-ranking');
            if (btnRank) btnRank.addEventListener('click', function () {
                self.mostrarTela('tela-ranking');
            });

            var btnSom = document.getElementById('btn-alternar-som');
            if (btnSom) btnSom.addEventListener('click', function () {
                window.Dados.alternarSom();
                self._atualizarBotaoSom();
            });

            // 3. Eventos da Tela de Escolha da Operação
            var btnVoltarOp = document.getElementById('btn-voltar-menu');
            if (btnVoltarOp) btnVoltarOp.addEventListener('click', function () {
                self.irParaMenu();
            });

            var botoesOperacao = document.querySelectorAll('.btn-operacao');
            for (var i = 0; i < botoesOperacao.length; i++) {
                botoesOperacao[i].addEventListener('click', function (evento) {
                    var botao = evento.currentTarget;
                    var operacao = botao.getAttribute('data-operacao');
                    self.mostrarTela('tela-jogo');

                    // Inicializa o teclado virtual se estiver no modo desafio
                    if (window.Teclado && typeof window.Teclado.inicializar === 'function') {
                        window.Teclado.inicializar(function (valorDigitado) {
                            if (window.Modos && typeof window.Modos.verificarRespostaDesafio === 'function') {
                                window.Modos.verificarRespostaDesafio(valorDigitado);
                            }
                        });
                    }

                    if (window.Modos && typeof window.Modos.iniciarPartida === 'function') {
                        window.Modos.iniciarPartida(self.modoSelecionado, operacao);
                    }
                });
            }

            // 4. Eventos da Tela de Jogo
            var btnSairJogo = document.getElementById('btn-sair-jogo');
            if (btnSairJogo) btnSairJogo.addEventListener('click', function () {
                if (window.Modos && typeof window.Modos.pararPartida === 'function') {
                    window.Modos.pararPartida();
                }
                self.irParaMenu();
            });

            // Conexão do checkbox/toggle "💡 Ajuda" com o gerenciador de Modos
            var chkAjuda = document.getElementById('chk-ajuda');
            if (chkAjuda) chkAjuda.addEventListener('change', function (e) {
                if (window.Modos && typeof window.Modos.alternarAjudaVisual === 'function') {
                    window.Modos.alternarAjudaVisual(e.target.checked);
                }
            });

            // 5. Eventos da Tela de Fim de Partida
            var btnJogarNovamente = document.getElementById('btn-jogar-novamente');
            if (btnJogarNovamente) btnJogarNovamente.addEventListener('click', function () {
                self.mostrarTela('tela-jogo');
                if (window.Modos && window.Modos.modoAtual && window.Modos.operacaoAtual) {
                    window.Modos.iniciarPartida(window.Modos.modoAtual, window.Modos.operacaoAtual);
                }
            });

            var btnFimMenu = document.getElementById('btn-fim-menu');
            if (btnFimMenu) btnFimMenu.addEventListener('click', function () {
                self.irParaMenu();
            });

            // 6. Fechar telas secundárias (Conquistas e Ranking)
            var btnFecharConq = document.getElementById('btn-fechar-conquistas');
            if (btnFecharConq) btnFecharConq.addEventListener('click', function () {
                self.irParaMenu();
            });

            var btnFecharRank = document.getElementById('btn-fechar-ranking');
            if (btnFecharRank) btnFecharRank.addEventListener('click', function () {
                self.irParaMenu();
            });
        }
    };

    // Dispara a inicialização quando o HTML terminar de carregar
    document.addEventListener('DOMContentLoaded', function () {
        window.Main.inicializar();
    });
})();