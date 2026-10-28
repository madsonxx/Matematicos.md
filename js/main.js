/**
 * ==========================================================================
 * 10. js/main.js — Controle de Telas e Inicialização (window.Main)
 * Conecta o botão de alternar Teclado/5 Opções dentro do jogo e o novo Ranking.
 * ==========================================================================
 */
(function () {
    'use strict';

    window.Main = {
        modoSelecionado: 'desafio',

        inicializar: function () {
            this._configurarEventos();
            this._atualizarBotaoSom();

            var aluno = window.Dados.obterAlunoAtual();
            if (aluno) {
                this.irParaMenu();
            } else {
                this.abrirTelaIdentificacao();
            }
        },

        mostrarTela: function (idTela) {
            var telas = document.querySelectorAll('.tela');
            for (var i = 0; i < telas.length; i++) {
                telas[i].classList.add('oculto');
            }

            var alvo = document.getElementById(idTela);
            if (alvo) {
                alvo.classList.remove('oculto');
            }

            if (idTela === 'tela-conquistas' && window.Conquistas) {
                window.Conquistas.renderizarTela('container-conquistas');
            }

            if (idTela === 'tela-ranking' && window.Ranking) {
                window.Ranking.carregarRanking();
            }
        },

        abrirTelaIdentificacao: function () {
            if (window.Modos && typeof window.Modos.pararPartida === 'function') {
                window.Modos.pararPartida();
            }

            var input = document.getElementById('input-nome-aluno');
            var erro = document.getElementById('erro-identificacao');
            if (input) input.value = '';
            if (erro) erro.classList.add('oculto');

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

        abrirEscolhaOperacao: function (modo) {
            this.modoSelecionado = modo;
            var badge = document.getElementById('badge-modo-escolhido');
            if (badge) {
                badge.textContent = modo === 'desafio' ? '⚡ Modo Desafio' : '🎯 Modo Treino';
            }
            this.mostrarTela('tela-operacao');
        },

        _atualizarBotaoSom: function () {
            var somAtivo = window.Dados.obterSomAtivo();
            var btnSom = document.getElementById('btn-alternar-som');
            if (btnSom) {
                btnSom.textContent = somAtivo ? '🔊 Som: Ligado' : '🔇 Som: Desligado';
            }
        },

        _configurarEventos: function () {
            var self = this;

            // 1. Identificação
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

            // 2. Menu Principal
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

            // 3. Escolha da Operação
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

                    if (window.Modos && typeof window.Modos.iniciarPartida === 'function') {
                        window.Modos.iniciarPartida(self.modoSelecionado, operacao);
                    }
                });
            }

            // 4. Tela de Jogo (Sair, Ajuda Visual e Alternar Teclado ⇄ 5 Opções ao vivo)
            var btnSairJogo = document.getElementById('btn-sair-jogo');
            if (btnSairJogo) btnSairJogo.addEventListener('click', function () {
                if (window.Modos && typeof window.Modos.pararPartida === 'function') {
                    window.Modos.pararPartida();
                }
                self.irParaMenu();
            });

            var chkAjuda = document.getElementById('chk-ajuda');
            if (chkAjuda) chkAjuda.addEventListener('change', function (e) {
                if (window.Modos && typeof window.Modos.alternarAjudaVisual === 'function') {
                    window.Modos.alternarAjudaVisual(e.target.checked);
                }
            });

            var btnAlternarEntrada = document.getElementById('btn-alternar-entrada-jogo');
            if (btnAlternarEntrada) {
                btnAlternarEntrada.addEventListener('click', function () {
                    if (window.Modos && typeof window.Modos.alternarMetodoEntradaNoJogo === 'function') {
                        window.Modos.alternarMetodoEntradaNoJogo();
                    }
                });
            }

            // 5. Tela de Fim de Partida
            var btnJogarNovamente = document.getElementById('btn-jogar-novamente');
            if (btnJogarNovamente) btnJogarNovamente.addEventListener('click', function () {
                self.mostrarTela('tela-jogo');
                if (window.Modos && window.Modos.modoAtual && window.Modos.operacaoAtual) {
                    window.Modos.iniciarPartida(window.Modos.modoAtual, window.Modos.operacaoAtual);
                }
            });

            var btnFimRanking = document.getElementById('btn-fim-ir-ranking');
            if (btnFimRanking) btnFimRanking.addEventListener('click', function () {
                self.mostrarTela('tela-ranking');
            });

            var btnFimMenu = document.getElementById('btn-fim-menu');
            if (btnFimMenu) btnFimMenu.addEventListener('click', function () {
                self.irParaMenu();
            });

            // 6. Conquistas e Ranking
            var btnFecharConq = document.getElementById('btn-fechar-conquistas');
            if (btnFecharConq) btnFecharConq.addEventListener('click', function () {
                self.irParaMenu();
            });

            var btnFecharRank = document.getElementById('btn-fechar-ranking');
            if (btnFecharRank) btnFecharRank.addEventListener('click', function () {
                self.irParaMenu();
            });

            var btnAtualizarRank = document.getElementById('btn-atualizar-ranking');
            if (btnAtualizarRank) btnAtualizarRank.addEventListener('click', function () {
                if (window.Ranking && typeof window.Ranking.carregarRanking === 'function') {
                    window.Ranking.carregarRanking();
                }
            });
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        window.Main.inicializar();
    });
})();