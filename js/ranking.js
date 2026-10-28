/**
 * ==========================================================================
 * js/ranking.js — Módulo de Ranking Híbrido (window.Ranking)
 * 1. Top 10 Oficial da Planilha Google (No topo)
 * 2. Recordes Locais do Aluno Atual + Botão Manual "📤 Submeter" (Abaixo)
 * ==========================================================================
 */
(function () {
    'use strict';

    var ultimoEnvioTimestamp = 0;
    var COOLDOWN_MS = 3000;

    var MAPA_OPERACOES = {
        adicao: '➕ Adição',
        subtracao: '➖ Subtração',
        multiplicacao: '✖️ Multiplicação',
        divisao: '➗ Divisão',
        mestre: '👑 Modo Mestre'
    };

    var ORDEM_OPERACOES = ['adicao', 'subtracao', 'multiplicacao', 'divisao', 'mestre'];

    var Ranking = {
        // Submete uma operação específica manualmente (ou via console)
        verificarESubmeter: function (dadosPartida, callbackUI) {
            try {
                var aluno = window.Dados && window.Dados.obterAlunoAtual();
                if (!aluno) {
                    if (callbackUI) callbackUI(false, 'Nenhum aluno selecionado.');
                    return;
                }

                var pontosAtuais = Number(dadosPartida.pontos) || 0;
                var operacao = dadosPartida.operacao || 'adicao';
                var ultimaPontuacaoEnviada = window.Dados.obterRankingEnviado(operacao);

                if (pontosAtuais <= 0) {
                    if (callbackUI) callbackUI(false, 'Jogue o Modo Desafio para fazer pontos primeiro!');
                    return;
                }

                // Regra "Só Melhora"
                if (pontosAtuais <= ultimaPontuacaoEnviada && !dadosPartida.forcarReenvio) {
                    if (callbackUI) callbackUI(false, 'Esse recorde já foi enviado!');
                    return;
                }

                // Cooldown de 3s
                var agora = Date.now();
                if (agora - ultimoEnvioTimestamp < COOLDOWN_MS) {
                    if (callbackUI) callbackUI(false, 'Aguarde 3 segundos entre um envio e outro...');
                    return;
                }

                var urlEndpoint = (window.CONFIG && (window.CONFIG.RANKING_URL || window.CONFIG.URL_PLANILHA_RANKING)) || '';
                if (!urlEndpoint) {
                    if (callbackUI) callbackUI(false, 'URL da planilha não configurada.');
                    return;
                }

                var nomes = window.Dados.separarNomeESobrenome(aluno.nomeExibicao);
                var payload = {
                    nome: nomes.nome,
                    sobrenome: nomes.sobrenome,
                    pontos: pontosAtuais,
                    operacao: operacao,
                    data: new Date().toISOString().slice(0, 10)
                };

                ultimoEnvioTimestamp = agora;

                fetch(urlEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                }).then(function () {
                    window.Dados.atualizarRankingEnviado(operacao, pontosAtuais);
                    if (callbackUI) callbackUI(true, '✅ Enviado para a planilha! O professor irá conferir.');
                }).catch(function (erro) {
                    console.error('Erro ao enviar ranking:', erro);
                    if (callbackUI) callbackUI(false, '❌ Falha de conexão ao enviar.');
                });

            } catch (e) {
                console.error('Erro em Ranking.verificarESubmeter:', e);
                if (callbackUI) callbackUI(false, 'Erro inesperado ao enviar.');
            }
        },

        // Carrega tanto o Top 10 da Planilha quanto os Recordes Locais do Aluno
        carregarRanking: function () {
            this.renderizarRecordesLocais();
            this._buscarTop10Planilha();
        },

        _buscarTop10Planilha: function () {
            var self = this;
            var elLoading = document.getElementById('ranking-loading');
            var elErro = document.getElementById('ranking-erro');
            var elTabela = document.getElementById('tabela-ranking');
            var tbody = document.getElementById('corpo-tabela-ranking');

            if (elLoading) {
                elLoading.textContent = 'Carregando Top 10 da planilha... ⏳';
                elLoading.classList.remove('oculto');
            }
            if (elErro) elErro.classList.add('oculto');
            if (elTabela) elTabela.classList.add('oculto');
            if (tbody) tbody.innerHTML = '';

            var urlEndpoint = (window.CONFIG && (window.CONFIG.RANKING_URL || window.CONFIG.URL_PLANILHA_RANKING)) || '';
            if (!urlEndpoint) {
                if (elLoading) elLoading.classList.add('oculto');
                if (elErro) {
                    elErro.textContent = 'URL do Ranking não configurada em js/config.js.';
                    elErro.classList.remove('oculto');
                }
                return;
            }

            var urlSemCache = urlEndpoint + (urlEndpoint.indexOf('?') === -1 ? '?t=' : '&t=') + Date.now();

            fetch(urlSemCache, {
                method: 'GET',
                redirect: 'follow'
            })
                .then(function (resposta) {
                    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
                    return resposta.text();
                })
                .then(function (textoBruto) {
                    var dados = JSON.parse(textoBruto);
                    if (elLoading) elLoading.classList.add('oculto');

                    var lista = Array.isArray(dados) ? dados : (dados.ranking || []);

                    lista = lista.filter(function (item) {
                        return item && item.nome && Number(item.pontos) > 0;
                    });

                    if (lista.length === 0) {
                        if (elErro) {
                            elErro.textContent = 'A planilha oficial ainda está vazia! Submeta seu recorde abaixo para estrear.';
                            elErro.classList.remove('oculto');
                        }
                        return;
                    }

                    self._renderizarLinhasTop10(lista, tbody, elTabela);
                })
                .catch(function (erro) {
                    console.warn('Não foi possível ler a planilha online:', erro);
                    if (elLoading) elLoading.classList.add('oculto');
                    if (elErro) {
                        elErro.innerHTML = '⚠️ Sem conexão com a planilha online no momento. Você ainda pode ver seus recordes locais abaixo.';
                        elErro.classList.remove('oculto');
                    }
                });
        },

        _renderizarLinhasTop10: function (lista, tbody, elTabela) {
            if (!tbody) return;
            tbody.innerHTML = '';

            lista.sort(function (a, b) {
                return Number(b.pontos) - Number(a.pontos);
            });
            var top10 = lista.slice(0, 10);

            top10.forEach(function (item, index) {
                var tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

                var medalha = '#' + (index + 1);
                var posStyle = 'color: var(--cor-texto);';
                if (index === 0) { medalha = '🥇 1º'; posStyle = 'color: #FBBF24; font-weight: bold;'; }
                else if (index === 1) { medalha = '🥈 2º'; posStyle = 'color: #E2E8F0; font-weight: bold;'; }
                else if (index === 2) { medalha = '🥉 3º'; posStyle = 'color: #D97706; font-weight: bold;'; }

                var opKey = String(item.operacao || 'geral').toLowerCase();
                var opFormatada = MAPA_OPERACOES[opKey] || escapeHtml(item.operacao || 'Geral');

                tr.innerHTML =
                    '<td style="padding: 8px 6px; ' + posStyle + '">' + medalha + '</td>' +
                    '<td style="padding: 8px 6px; font-weight: 600;">' + escapeHtml(item.nome || '') + ' ' + escapeHtml(item.sobrenome || '') + '</td>' +
                    '<td style="padding: 8px 6px; text-align: right; font-weight: 800; color: var(--neon-azul);">' + Number(item.pontos || 0) + '</td>' +
                    '<td style="padding: 8px 6px; text-align: center; font-size: 0.8rem; opacity: 0.9;">' + opFormatada + '</td>';

                tbody.appendChild(tr);
            });

            if (elTabela) elTabela.classList.remove('oculto');
        },

        // Renderiza o Bloco 2: Recordes Locais do Aluno + Botões individuais de Submeter
        renderizarRecordesLocais: function () {
            var self = this;
            var container = document.getElementById('lista-recordes-locais');
            var elNomeAluno = document.getElementById('ranking-nome-aluno-local');
            var elFeedback = document.getElementById('feedback-envio-ranking');

            if (elFeedback) elFeedback.classList.add('oculto');
            if (!container) return;
            container.innerHTML = '';

            var aluno = window.Dados && window.Dados.obterAlunoAtual();
            if (!aluno) {
                container.innerHTML = '<p class="texto-pequeno">Identifique-se no menu para ver seus recordes.</p>';
                return;
            }

            if (elNomeAluno) {
                elNomeAluno.textContent = aluno.nomeExibicao;
            }

            var recPorOp = aluno.recordesPorOperacao || {};
            var envPorOp = aluno.rankingEnviadoPorOperacao || {};

            ORDEM_OPERACOES.forEach(function (opKey) {
                var pontosRecorde = Number(recPorOp[opKey] || 0);
                var pontosEnviados = Number(envPorOp[opKey] || 0);
                var jaEnviadoIgual = (pontosRecorde > 0) && (pontosEnviados >= pontosRecorde);

                var linha = document.createElement('div');
                linha.className = 'item-recorde-local';

                var infoEsq = document.createElement('div');
                infoEsq.className = 'recorde-local-info';
                infoEsq.innerHTML =
                    '<span class="recorde-local-op">' + (MAPA_OPERACOES[opKey] || opKey) + '</span>' +
                    '<strong class="recorde-local-pts">' + pontosRecorde + ' pts</strong>';

                var btnSubmeter = document.createElement('button');
                btnSubmeter.type = 'button';
                btnSubmeter.className = 'btn-submeter-recorde';

                if (pontosRecorde <= 0) {
                    btnSubmeter.textContent = 'Sem recorde';
                    btnSubmeter.disabled = true;
                    btnSubmeter.classList.add('btn-submeter-desativado');
                } else if (jaEnviadoIgual) {
                    btnSubmeter.textContent = '✅ Enviado';
                    btnSubmeter.disabled = true;
                    btnSubmeter.classList.add('btn-submeter-enviado');
                } else {
                    btnSubmeter.textContent = '📤 Submeter';
                    btnSubmeter.addEventListener('click', function () {
                        btnSubmeter.disabled = true;
                        btnSubmeter.textContent = 'Enviando...';

                        self.verificarESubmeter({
                            operacao: opKey,
                            pontos: pontosRecorde
                        }, function (sucesso, msg) {
                            if (elFeedback) {
                                elFeedback.textContent = msg;
                                elFeedback.classList.remove('oculto');
                                elFeedback.style.color = sucesso ? 'var(--cor-acerto)' : 'var(--mult-4x)';
                            }
                            if (sucesso) {
                                btnSubmeter.textContent = '✅ Enviado';
                                btnSubmeter.classList.add('btn-submeter-enviado');
                                // Atualiza a tabela do Top 10 após 1.2s para refletir caso tenha entrado direto
                                setTimeout(function () {
                                    self._buscarTop10Planilha();
                                }, 1200);
                            } else {
                                btnSubmeter.disabled = false;
                                btnSubmeter.textContent = '📤 Submeter';
                            }
                        });
                    });
                }

                linha.appendChild(infoEsq);
                linha.appendChild(btnSubmeter);
                container.appendChild(linha);
            });
        }
    };

    function escapeHtml(texto) {
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.Ranking = Ranking;
})();