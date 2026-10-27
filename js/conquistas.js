/**
 * ==========================================================================
 * js/conquistas.js — Sistema de Conquistas de 3 Estrelas (window.Conquistas)
 * ==========================================================================
 */
(function () {
    'use strict';

    var CHAVE_CONQUISTAS = 'matematicos_conquistas_v1';

    function getStorageKey() {
        if (window.Dados && typeof window.Dados.obterAlunoAtual === 'function') {
            var aluno = window.Dados.obterAlunoAtual();
            if (aluno && aluno.nomeExibicao) {
                return CHAVE_CONQUISTAS + '_' + aluno.nomeExibicao.trim().toLowerCase().replace(/\s+/g, '_');
            }
        }
        return CHAVE_CONQUISTAS + '_geral';
    }

    var Conquistas = {
        carregarProgresso: function () {
            try {
                var dados = localStorage.getItem(getStorageKey());
                return dados ? JSON.parse(dados) : {};
            } catch (e) {
                console.error('Erro ao carregar conquistas:', e);
                return {};
            }
        },

        salvarProgresso: function (prog) {
            try {
                localStorage.setItem(getStorageKey(), JSON.stringify(prog));
            } catch (e) {
                console.error('Erro ao salvar conquistas:', e);
            }
        },

        verificarEAtualizar: function (statsPartida) {
            if (!window.CONFIG || !window.CONFIG.conquistas) return [];
            var configs = window.CONFIG.conquistas;

            var prog = this.carregarProgresso();
            var salvouNovo = false;
            var desbloqueadasAgora = [];

            var dadosAluno = (window.Dados && typeof window.Dados.obterAlunoAtual === 'function')
                ? window.Dados.obterAlunoAtual()
                : null;

            var estAluno = (dadosAluno && dadosAluno.estatisticas) ? dadosAluno.estatisticas : {};

            var estatisticas = {
                acertosTotais: (estatisticas.acertosTotais || estAluno.acertosTotais || 0) + (statsPartida.acertosTotais || 0),
                melhorSequencia: Math.max(estAluno.melhorSequencia || 0, statsPartida.melhorSequencia || 0),
                partidasJogadas: (estAluno.partidasJogadas || 0) + 1,
                diasDiferentes: (estAluno.diasAtivos ? estAluno.diasAtivos.length : 1),
                partidasPerfeitas: (estAluno.partidasPerfeitas || 0) + (statsPartida.partidaPerfeita ? 1 : 0),
                multMaxAlcancado: Math.max(estAluno.vezesCombo4x > 0 ? 4 : 1, statsPartida.maxMult || 1),
                treinoAcertos: (estAluno.acertosTreino || 0) + (statsPartida.treinoAcertos || 0)
            };

            Object.keys(configs).forEach(function (id) {
                var conf = configs[id];
                var valorAtual = 0;

                switch (id) {
                    case 'acertos': valorAtual = estatisticas.acertosTotais; break;
                    case 'sequencia': valorAtual = estatisticas.melhorSequencia; break;
                    case 'partidas': valorAtual = estatisticas.partidasJogadas; break;
                    case 'dias': valorAtual = estatisticas.diasDiferentes; break;
                    case 'perfeitas': valorAtual = estatisticas.partidasPerfeitas; break;
                    case 'mult4': valorAtual = estatisticas.multMaxAlcancado >= 4 ? estatisticas.partidasJogadas : 0; break;
                    case 'treino': valorAtual = estatisticas.treinoAcertos; break;
                }

                var limites = conf.limites || [1, 5, 10];
                var estrelas = 0;
                if (valorAtual >= limites[2]) estrelas = 3;
                else if (valorAtual >= limites[1]) estrelas = 2;
                else if (valorAtual >= limites[0]) estrelas = 1;

                if (!prog[id]) prog[id] = { estrelas: 0 };

                if (estrelas > prog[id].estrelas) {
                    prog[id].estrelas = estrelas;
                    salvouNovo = true;
                    desbloqueadasAgora.push({ id: id, titulo: conf.titulo, estrelas: estrelas });
                }
            });

            if (salvouNovo) {
                this.salvarProgresso(prog);
            }

            return desbloqueadasAgora;
        },

        renderizarTela: function (containerId) {
            var container = document.getElementById(containerId);
            if (!container) return;

            var configs = (window.CONFIG && window.CONFIG.conquistas) ? window.CONFIG.conquistas : {};
            var prog = this.carregarProgresso();

            var html = '';
            html += '<div class="conquistas-header" style="text-align: center; margin-bottom: 1.5rem;">';
            html += '<h2 style="color: var(--neon-azul);">🏆 Galeria de Conquistas</h2>';
            html += '<p style="color: var(--cor-texto); opacity: 0.8; font-size: 0.95rem;">Jogue e vença desafios para desbloquear estrelas!</p>';
            html += '</div>';
            html += '<div class="conquistas-grid" style="display: flex; flex-direction: column; gap: 10px; max-height: 52vh; overflow-y: auto; padding-right: 5px;">';

            var chaves = Object.keys(configs);
            if (chaves.length === 0) {
                html += '<p style="text-align:center; color: var(--cor-texto);">Nenhuma conquista configurada no momento.</p>';
            }

            chaves.forEach(function (id) {
                var conf = configs[id];
                var dadosProg = prog[id] || { estrelas: 0 };
                var estrelas = dadosProg.estrelas;
                var cardClass = estrelas > 0 ? 'desbloqueada' : 'bloqueada';

                html += '<div class="conquista-card ' + cardClass + '" style="display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">';
                html += '<div class="conquista-icone" style="font-size: 2rem; margin-right: 15px; min-width: 45px; text-align: center;">' + (conf.icone || '🏆') + '</div>';
                html += '<div class="conquista-info" style="flex: 1;">';
                html += '<h3 style="font-size: 1rem; color: var(--cor-texto); margin-bottom: 3px;">' + (conf.titulo || id) + '</h3>';
                html += '<p style="font-size: 0.8rem; color: var(--cor-texto); opacity: 0.7; margin-bottom: 5px;">' + (conf.desc || '') + '</p>';
                html += '<div class="conquista-estrelas" style="font-size: 1.1rem; letter-spacing: 3px;">';

                var e1 = estrelas >= 1 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';
                var e2 = estrelas >= 2 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';
                var e3 = estrelas >= 3 ? 'color: #FBBF24;' : 'color: rgba(255,255,255,0.2);';

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