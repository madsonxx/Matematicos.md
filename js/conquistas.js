/**
 * ==========================================================================
 * js/conquistas.js — Sistema de Conquistas de 3 Estrelas (window.Conquistas)
 * Compatível com window.CONFIG.CONQUISTAS (Array) e window.Dados
 * ==========================================================================
 */
(function () {
    'use strict';

    var ICONES_CONQUISTAS = {
        acertos_totais: '🧙‍♂️',
        sequencia_max: '⚡',
        partidas_jog: '🎮',
        dias_ativos: '📅',
        partidas_perf: '💎',
        combo_4x: '🔥',
        acertos_treino: '🐢',
        pontos_adicao: '➕',
        pontos_subtracao: '➖',
        pontos_multiplicacao: '✖️',
        pontos_divisao: '➗',
        pontos_mestre: '👑'
    };

    function obterListaConfigConquistas() {
        if (!window.CONFIG) return [];
        // Suporta tanto CONQUISTAS (Array no config.js atual) quanto conquistas (Objeto)
        if (Array.isArray(window.CONFIG.CONQUISTAS)) {
            return window.CONFIG.CONQUISTAS;
        }
        if (window.CONFIG.conquistas && typeof window.CONFIG.conquistas === 'object') {
            return Object.keys(window.CONFIG.conquistas).map(function (k) {
                var item = window.CONFIG.conquistas[k];
                return {
                    id: k,
                    titulo: item.titulo || k,
                    descricao: item.desc || item.descricao || '',
                    icone: item.icone,
                    metas: item.limites || item.metas || [1, 5, 10]
                };
            });
        }
        return [];
    }

    function obterValorEstatisticaAluno(idConquista, aluno) {
        if (!aluno) return 0;
        var est = aluno.estatisticas || {};
        var recOp = aluno.recordesPorOperacao || aluno.rankingEnviadoPorOperacao || {};
        var recordeGeral = Number(aluno.recordePontos) || 0;

        switch (idConquista) {
            case 'acertos_totais':
            case 'acertos':
                return Number(est.acertosTotais) || 0;
            case 'sequencia_max':
            case 'sequencia':
                return Number(aluno.melhorSequencia) || 0;
            case 'partidas_jog':
            case 'partidas':
                return Number(est.partidasJogadas) || 0;
            case 'dias_ativos':
            case 'dias':
                return Array.isArray(est.diasAtivos) ? est.diasAtivos.length : 0;
            case 'partidas_perf':
            case 'perfeitas':
                return Number(est.partidasPerfeitas) || 0;
            case 'combo_4x':
            case 'mult4':
                return Number(est.vezesCombo4x) || 0;
            case 'acertos_treino':
            case 'treino':
                return Number(est.acertosTreino) || 0;
            case 'pontos_adicao':
                return Math.max(Number(recOp.adicao) || 0, recordeGeral);
            case 'pontos_subtracao':
                return Number(recOp.subtracao) || 0;
            case 'pontos_multiplicacao':
                return Number(recOp.multiplicacao) || 0;
            case 'pontos_divisao':
                return Number(recOp.divisao) || 0;
            case 'pontos_mestre':
                return Number(recOp.mestre) || 0;
            default:
                return 0;
        }
    }

    function calcularEstrelas(valorAtual, metas) {
        if (!Array.isArray(metas) || metas.length < 3) return 0;
        if (valorAtual >= metas[2]) return 3;
        if (valorAtual >= metas[1]) return 2;
        if (valorAtual >= metas[0]) return 1;
        return 0;
    }

    var Conquistas = {
        verificarEAtualizar: function () {
            var aluno = (window.Dados && typeof window.Dados.obterAlunoAtual === 'function')
                ? window.Dados.obterAlunoAtual()
                : null;
            if (!aluno) return [];

            var listaConfigs = obterListaConfigConquistas();
            var desbloqueadas = [];

            listaConfigs.forEach(function (conf) {
                var valor = obterValorEstatisticaAluno(conf.id, aluno);
                var estrelas = calcularEstrelas(valor, conf.metas);
                if (estrelas > 0) {
                    desbloqueadas.push({ id: conf.id, titulo: conf.titulo, estrelas: estrelas });
                }
            });

            return desbloqueadas;
        },

        renderizarTela: function (containerId) {
            var container = document.getElementById(containerId);
            if (!container) return;

            var listaConfigs = obterListaConfigConquistas();
            var aluno = (window.Dados && typeof window.Dados.obterAlunoAtual === 'function')
                ? window.Dados.obterAlunoAtual()
                : null;

            var html = '';
            html += '<div class="conquistas-header" style="text-align: center; margin-bottom: 1rem;">';
            html += '<h2 style="color: var(--neon-azul); margin-bottom: 4px;">🏆 Galeria de Conquistas</h2>';
            html += '<p style="color: var(--cor-texto); opacity: 0.8; font-size: 0.9rem;">Jogue e vença desafios para iluminar as 3 estrelas!</p>';
            html += '</div>';
            html += '<div class="conquistas-grid" style="display: flex; flex-direction: column; gap: 10px; max-height: 58vh; overflow-y: auto; padding-right: 6px;">';

            if (listaConfigs.length === 0) {
                html += '<p style="text-align:center; color: var(--cor-texto);">Nenhuma conquista configurada no momento.</p>';
            }

            listaConfigs.forEach(function (conf) {
                var metas = conf.metas || [1, 5, 10];
                var valorAtual = obterValorEstatisticaAluno(conf.id, aluno);
                var estrelas = calcularEstrelas(valorAtual, metas);
                var icone = conf.icone || ICONES_CONQUISTAS[conf.id] || '🏆';

                var bordaCard = estrelas === 3
                    ? 'border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.08);'
                    : (estrelas > 0
                        ? 'border: 1px solid rgba(56, 189, 248, 0.35); background: rgba(255, 255, 255, 0.07);'
                        : 'border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.03); opacity: 0.75;');

                var proxMeta = metas[0];
                if (estrelas === 1) proxMeta = metas[1];
                else if (estrelas >= 2) proxMeta = metas[2];

                html += '<div class="conquista-card" style="display: flex; align-items: center; padding: 12px; border-radius: 12px; ' + bordaCard + '">';
                html += '<div style="font-size: 2rem; margin-right: 14px; min-width: 44px; text-align: center;">' + icone + '</div>';
                html += '<div style="flex: 1;">';
                html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
                html += '<h3 style="font-size: 0.98rem; color: var(--cor-texto); margin: 0;">' + conf.titulo + '</h3>';
                html += '<span style="font-size: 0.8rem; color: var(--neon-azul); font-weight: bold;">' + valorAtual + ' / ' + proxMeta + '</span>';
                html += '</div>';
                html += '<p style="font-size: 0.8rem; color: var(--cor-texto); opacity: 0.75; margin: 3px 0 6px 0;">' + (conf.descricao || '') + ' (' + metas.join(' • ') + ')</p>';

                var e1 = estrelas >= 1 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';
                var e2 = estrelas >= 2 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';
                var e3 = estrelas >= 3 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';

                html += '<div style="font-size: 1.15rem; letter-spacing: 4px;">';
                html += '<span style="' + e1 + '">★</span>';
                html += '<span style="' + e2 + '">★</span>';
                html += '<span style="' + e3 + '">★</span>';
                html += '</div></div></div>';
            });

            html += '</div>';
            container.innerHTML = html;
        }
    };

    window.Conquistas = Conquistas;
})();