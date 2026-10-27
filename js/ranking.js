/**
 * ==========================================================================
 * js/ranking.js — Módulo de Ranking da Turma (window.Ranking)
 * ==========================================================================
 */
(function () {
    'use strict';

    var ultimoEnvioTimestamp = 0;
    var COOLDOWN_MS = 3000;

    var Ranking = {
        verificarESubmeter: function (dadosPartida) {
            try {
                var aluno = window.Dados && window.Dados.obterAlunoAtual();
                if (!aluno) return;

                var pontosAtuais = Number(dadosPartida.pontos) || 0;
                var operacao = dadosPartida.operacao || 'adicao';
                var ultimaPontuacaoEnviada = window.Dados.obterRankingEnviado(operacao);

                if (pontosAtuais <= ultimaPontuacaoEnviada) return;

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
            var elLoading = document.getElementById('ranking-loading');
            var elErro = document.getElementById('ranking-erro');
            var elTabela = document.getElementById('tabela-ranking');
            var tbody = document.getElementById('corpo-tabela-ranking');

            if (elLoading) elLoading.classList.remove('oculto');
            if (elErro) elErro.classList.add('oculto');
            if (elTabela) elTabela.classList.add('oculto');
            if (tbody) tbody.innerHTML = '';

            var urlEndpoint = (window.CONFIG && (window.CONFIG.RANKING_URL || window.CONFIG.URL_PLANILHA_RANKING)) || '';
            if (!urlEndpoint) {
                if (elLoading) elLoading.classList.add('oculto');
                if (elErro) {
                    elErro.textContent = 'URL do Ranking não configurada.';
                    elErro.classList.remove('oculto');
                }
                return;
            }

            // Tratamento preventivo para CORS do Google Apps Script em GET
            fetch(urlEndpoint, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Accept': 'application/json' }
            })
                .then(function (resposta) {
                    if (!resposta.ok) throw new Error('Servidor indisponível');
                    return resposta.json();
                })
                .then(function (dados) {
                    if (elLoading) elLoading.classList.add('oculto');
                    var lista = Array.isArray(dados) ? dados : (dados.ranking || []);

                    if (lista.length === 0) {
                        if (elErro) {
                            elErro.textContent = 'Nenhum recorde registrado na turma ainda!';
                            elErro.classList.remove('oculto');
                        }
                        return;
                    }

                    lista.sort(function (a, b) { return Number(b.pontos) - Number(a.pontos); });
                    var top10 = lista.slice(0, 10);

                    top10.forEach(function (item, index) {
                        var tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
                        var posClass = index === 0 ? 'color: #FBBF24; font-weight: bold;' : (index === 1 ? 'color: #94A3B8; font-weight: bold;' : (index === 2 ? 'color: #B45309; font-weight: bold;' : ''));

                        tr.innerHTML = `
                        <td style="padding: 10px; ${posClass}">#${index + 1}</td>
                        <td style="padding: 10px;">${escapeHtml(item.nome || '')} ${escapeHtml(item.sobrenome || '')}</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold; color: var(--neon-azul);">${Number(item.pontos || 0)} pts</td>
                        <td style="padding: 10px; text-align: center; font-size: 0.85rem; opacity: 0.8;">${escapeHtml(item.operacao || 'geral')}</td>
                    `;
                        tbody.appendChild(tr);
                    });

                    if (elTabela) elTabela.classList.remove('oculto');
                })
                .catch(function (erro) {
                    console.warn('Bloqueio CORS ou falha no GET do ranking:', erro);
                    if (elLoading) elLoading.classList.add('oculto');
                    if (elErro) {
                        elErro.innerHTML = '⚠️ A leitura direta do ranking foi bloqueada pelo navegador (CORS do Google).<br><small style="opacity:0.8;">Os teus pontos continuam a ser enviados com sucesso para a planilha!</small>';
                        elErro.classList.remove('oculto');
                    }
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