/**
 * ==========================================================================
 * js/ranking.js — Módulo de Ranking da Turma (window.Ranking)
 * ==========================================================================
 */
(function () {
    'use strict';

    var ultimoEnvioTimestamp = 0;
    var COOLDOWN_MS = 3000;

    var MAPA_OPERACOES = {
        adicao: '➕ Adição',
        subtracao: '➖ Subtração',
        multiplicacao: '✖️ Multip.',
        divisao: '➗ Divisão',
        mestre: '👑 Mestre'
    };

    var Ranking = {
        verificarESubmeter: function (dadosPartida) {
            try {
                var aluno = window.Dados && window.Dados.obterAlunoAtual();
                if (!aluno) return;

                var pontosAtuais = Number(dadosPartida.pontos) || 0;
                var operacao = dadosPartida.operacao || 'adicao';
                var ultimaPontuacaoEnviada = window.Dados.obterRankingEnviado(operacao);

                // Regra "Só Melhora"
                if (pontosAtuais <= ultimaPontuacaoEnviada) return;

                // Cooldown de 3s
                var agora = Date.now();
                if (agora - ultimoEnvioTimestamp < COOLDOWN_MS) return;

                var urlEndpoint = (window.CONFIG && (window.CONFIG.RANKING_URL || window.CONFIG.URL_PLANILHA_RANKING)) || '';
                if (!urlEndpoint) return;

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
                }).catch(function (erro) {
                    console.error('Erro ao enviar ranking:', erro);
                });

            } catch (e) {
                console.error('Erro em Ranking.verificarESubmeter:', e);
            }
        },

        carregarRanking: function () {
            var self = this;
            var elLoading = document.getElementById('ranking-loading');
            var elErro = document.getElementById('ranking-erro');
            var elTabela = document.getElementById('tabela-ranking');
            var tbody = document.getElementById('corpo-tabela-ranking');

            if (elLoading) {
                elLoading.textContent = 'Carregando ranking da turma... ⏳';
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

            // Adicionamos um parâmetro de tempo (?t=...) para evitar cache do navegador
            // e fazemos um GET simples SEM headers customizados para o redirect do Google funcionar!
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

                    // Filtra linhas vazias que possam existir na planilha
                    lista = lista.filter(function (item) {
                        return item && item.nome && Number(item.pontos) > 0;
                    });

                    if (lista.length === 0) {
                        if (elErro) {
                            elErro.textContent = 'Nenhum recorde registrado na planilha ainda! Jogue o Modo Desafio para estrear.';
                            elErro.classList.remove('oculto');
                        }
                        return;
                    }

                    self._renderizarLinhas(lista, tbody, elTabela);
                })
                .catch(function (erro) {
                    console.warn('Falha ao buscar planilha online, exibindo dados locais:', erro);
                    if (elLoading) elLoading.classList.add('oculto');

                    // Fallback: se estiver rodando via file:// ou se a implantação do Google faltar doGet,
                    // monta o ranking com os alunos salvos no aparelho para a tela nunca ficar vazia
                    var listaLocal = self._obterRankingLocalFallback();
                    if (listaLocal.length > 0) {
                        if (elErro) {
                            elErro.innerHTML = '⚠️ Exibindo recordes salvos neste aparelho <br><small style="opacity:0.8;">(Para ver a planilha online, verifique se a implantação do Apps Script foi atualizada como "Nova versão").</small>';
                            elErro.classList.remove('oculto');
                        }
                        self._renderizarLinhas(listaLocal, tbody, elTabela);
                    } else if (elErro) {
                        elErro.innerHTML = '⚠️ Não foi possível conectar à planilha do Ranking.<br><small style="opacity:0.8;">Verifique no Apps Script se você implantou uma "Nova versão" contendo a função doGet(e).</small>';
                        elErro.classList.remove('oculto');
                    }
                });
        },

        _renderizarLinhas: function (lista, tbody, elTabela) {
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
                    '<td style="padding: 10px 8px; ' + posStyle + '">' + medalha + '</td>' +
                    '<td style="padding: 10px 8px; font-weight: 500;">' + escapeHtml(item.nome || '') + ' ' + escapeHtml(item.sobrenome || '') + '</td>' +
                    '<td style="padding: 10px 8px; text-align: right; font-weight: bold; color: var(--neon-azul);">' + Number(item.pontos || 0) + ' pts</td>' +
                    '<td style="padding: 10px 8px; text-align: center; font-size: 0.85rem; opacity: 0.9;">' + opFormatada + '</td>';

                tbody.appendChild(tr);
            });

            if (elTabela) elTabela.classList.remove('oculto');
        },

        _obterRankingLocalFallback: function () {
            var lista = [];
            if (!window.Dados || typeof window.Dados.carregarBanco !== 'function') return lista;
            var banco = window.Dados.carregarBanco();
            var alunos = (banco && banco.alunos) || {};

            Object.keys(alunos).forEach(function (chave) {
                var al = alunos[chave];
                var nomes = window.Dados.separarNomeESobrenome(al.nomeExibicao);
                var recOp = al.recordesPorOperacao || al.rankingEnviadoPorOperacao || {};
                var adicionouPorOp = false;

                Object.keys(recOp).forEach(function (op) {
                    if (Number(recOp[op]) > 0) {
                        lista.push({
                            nome: nomes.nome,
                            sobrenome: nomes.sobrenome,
                            pontos: Number(recOp[op]),
                            operacao: op
                        });
                        adicionouPorOp = true;
                    }
                });

                if (!adicionouPorOp && Number(al.recordePontos) > 0) {
                    lista.push({
                        nome: nomes.nome,
                        sobrenome: nomes.sobrenome,
                        pontos: Number(al.recordePontos),
                        operacao: 'desafio'
                    });
                }
            });

            return lista;
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