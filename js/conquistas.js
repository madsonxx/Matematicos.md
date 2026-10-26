/**
 * js/conquistas.js — Sistema de Conquistas de 3 Estrelas com persistência por aluno
 * Exposto globalmente em window.Conquistas
 */
(function() {
    'use strict';

    const CHAVE_CONQUISTAS = 'matematicos_conquistas_v1';

    function getStorageKey() {
        if (window.Dados && typeof window.Dados.getAlunoAtual === 'function') {
            const aluno = window.Dados.getAlunoAtual();
            if ( aluno && aluno.nome ) {
                return `${CHAVE_CONQUISTAS}_${aluno.nome.trim().toLowerCase()}`;
            }
        }
        return `${CHAVE_CONQUISTAS}_geral`;
    }

    const Conquistas = {
        // Carrega o progresso de conquistas do aluno atual
        carregarProgresso() {
            try {
                const dados = localStorage.getItem(getStorageKey());
                return dados ? JSON.parse(dados) : {};
            } catch (e) {
                console.error('Erro ao carregar conquistas:', e);
                return {};
            }
        },

        salvarProgresso(prog) {
            try {
                localStorage.setItem(getStorageKey(), JSON.stringify(prog));
            } catch (e) {
                console.error('Erro ao salvar conquistas:', e);
            }
        },

        // Verifica e atualiza estatísticas após uma partida ou ação
        verificarEAtualizar(statsPartida) {
            // statsPartida espera: { acertosTotais, melhorSequencia, partidaPerfeita, maxMult, treinoAcertos, isTreino }
            const configs = window.CONFIG.conquistas;
            if (!configs) return [];

            let prog = this.carregarProgresso();
            let salvouNovo = false;
            let desbloqueadasAgora = [];

            // Acumula totais globais do aluno se necessário, ou lê do Dados
            const dadosAluno = window.Dados ? window.Dados.getDadosAluno() : {};

            const estatisticas = {
                acertosTotais: (dadosAluno.totalAcertosGeral || 0) + (statsPartida.acertosTotais || 0),
                melhorSequencia: Math.max(dadosAluno.melhorSequenciaGeral || 0, statsPartida.melhorSequencia || 0),
                partidasJogadas: (dadosAluno.totalPartidas || 0) + 1,
                diasDiferentes: dadosAluno.diasDiferentes || 1,
                partidasPerfeitas: (dadosAluno.partidasPerfeitas || 0) + (statsPartida.partidaPerfeita ? 1 : 0),
                multMaxAlcancado: Math.max(dadosAluno.multMaxAlcancado || 1, statsPartida.maxMult || 1),
                treinoAcertos: (dadosAluno.treinoAcertos || 0) + (statsPartida.treinoAcertos || 0)
            };

            // Avalia cada conquista
            Object.keys(configs).forEach(id => {
                const conf = configs[id];
                let valorAtual = 0;

                switch(id) {
                    case 'acertos': valorAtual = estatisticas.acertosTotais; break;
                    case 'sequencia': valorAtual = estatisticas.melhorSequencia; break;
                    case 'partidas': valorAtual = estatisticas.partidasJogadas; break;
                    case 'dias': valorAtual = estatisticas.diasDiferentes; break;
                    case 'perfeitas': valorAtual = estatisticas.partidasPerfeitas; break;
                    case 'mult4': valorAtual = estatisticas.multMaxAlcancado >= 4 ? (estatisticas.partidasJogadas || 1) : 0; break; // simplificado ou adaptado
                    case 'treino': valorAtual = estatisticas.treinoAcertos; break;
                }

                // Calcula estrelas atuais (0 a 3)
                let estrelas = 0;
                if (valorAtual >= conf.limites[2]) estrelas = 3;
                else if (valorAtual >= conf.limites[1]) estrelas = 2;
                else if (valorAtual >= conf.limites[0]) estrelas = 1;

                if (!prog[id]) prog[id] = { estrelas: 0 };

                if (estrelas > prog[id].estrelas) {
                    const ganho = estrelas - prog[id].estrelas;
                    prog[id].estrelas = estrelas;
                    salvouNovo = true;
                    desbloqueadasAgora.push({ id, titulo: conf.titulo, estrelas });
                }
            });

            if (salvouNovo) {
                this.salvarProgresso(prog);
            }

            return desbloqueadasAgora;
        },

        // Renderiza a Tela de Conquistas
        renderizarTela(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const configs = window.CONFIG.conquistas;
            const prog = this.carregarProgresso();

            let html = `
                <div class="conquistas-header">
                    <h2>🏆 Galeria de Conquistas</h2>
                    <p>Jogue e vença desafios para desbloquear estrelas!</p>
                </div>
                <div class="conquistas-grid">
            `;

            Object.keys(configs).forEach(id => {
                const conf = configs[id];
                const dadosProg = prog[id] || { estrelas: 0 };
                const estrelas = dadosProg.estrelas;

                html += `
                    <div class="conquista-card ${estrelas > 0 ? 'desbloqueada' : 'bloqueada'}">
                        <div class="conquista-icone">${conf.icone}</div>
                        <div class="conquista-info">
                            <h3>${conf.titulo}</h3>
                            <p>${conf.desc}</p>
                            <div class="conquista-estrelas">
                                <span class="${estrelas >= 1 ? 'ativa' : ''}">★</span>
                                <span class="${estrelas >= 2 ? 'ativa' : ''}">★</span>
                                <span class="${estrelas >= 3 ? 'ativa' : ''}">★</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                </div>
                <div class="conquistas-footer">
                    <button class="btn-primario" onclick="window.Main.mostrarTela('menu')">Voltar ao Menu</button>
                </div>
            `;

            container.innerHTML = html;
        }
    };

    window.Conquistas = Conquistas;
})();