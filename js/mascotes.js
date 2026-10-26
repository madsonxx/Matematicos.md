/**
 * js/mascotes.js — Rodízio de Mascotes e Balões de Fala
 * Exposto globalmente em window.Mascotes (Com fallback seguro de configuração)
 */
(function() {
    'use strict';

    let mascoteAtual = null;

    // Fallback interno caso window.CONFIG.mascotes ainda não exista
    const MASCOTES_DEFAULT = {
        coruja: {
            icone: '🦉',
            nome: 'Coruja',
            frases: {
                inicio: ["Vamos começar! Olho vivo!", "Estudando com atenção!"],
                acerto: ["Muito bem! Excelente!", "Isso aí!"],
                erro: ["Quase lá! Vamos revisar?", "Não desanime, tente de novo!"],
                combo: ["Impressionante! Multiplicador {mult}×!"]
            }
        },
        raposa: {
            icone: '🦊',
            nome: 'Raposa',
            frases: {
                inicio: ["Velocidade e foco!", "Hora de acelerar os cálculos!"],
                acerto: ["Mandou bem demais!", "Ritmo excelente!"],
                erro: ["Errar faz parte, vamos na próxima!", "Ajustando a mira!"],
                combo: ["Uau! Combo de {mult}× ativado!"]
            }
        },
        tartaruga: {
            icone: '🐢',
            nome: 'Tartaruga',
            frases: {
                inicio: ["Devagar e sempre.", "Com calma a gente chega lá."],
                acerto: ["Passo a passo, com firmeza!", "Boa resposta!"],
                erro: ["Sem pressa, respire fundo.", "Vamos com calma na próxima."],
                combo: ["Olha só que ritmo firme! {mult}×!"]
            }
        }
    };

    const Mascotes = {
        // Sorteia aleatoriamente 1 mascote para a partida
        sortearMascote() {
            let configMascotes = null;
            if (window.CONFIG && (window.CONFIG.mascotes || window.CONFIG.MASCOTES)) {
                configMascotes = window.CONFIG.mascotes || window.CONFIG.MASCOTES;
            } else {
                configMascotes = MASCOTES_DEFAULT;
            }

            const chaves = Object.keys(configMascotes);
            const sorteada = chaves[Math.floor(Math.random() * chaves.length)];
            mascoteAtual = configMascotes[sorteada];
            return mascoteAtual;
        },

        getMascoteAtual() {
            if (mascoteAtual) return mascoteAtual;
            const configMascotes = (window.CONFIG && (window.CONFIG.mascotes || window.CONFIG.MASCOTES)) || MASCOTES_DEFAULT;
            return configMascotes.coruja || Object.values(configMascotes)[0];
        },

        // Retorna mensagem formatada para o evento ocorrido
        falar(evento, dados = {}) {
            const m = this.getMascoteAtual();
            const frasesObj = m.frases || { inicio: ["Vamos lá!"] };
            let frases = frasesObj[evento] || frasesObj.inicio || ["Vamos lá!"];
            
            let fraseSorteada = frases[Math.floor(Math.random() * frases.length)];

            // Substitui variáveis dinâmicas se houver
            if (dados.multiplicador) {
                fraseSorteada = fraseSorteada.replace('{mult}', dados.multiplicador);
            }

            return {
                icone: m.icone || '🦉',
                nome: m.nome || 'Mascote',
                texto: fraseSorteada
            };
        },

        // Renderiza o componente visual do mascote e balão no container indicado
        renderizar(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const dados = this.falar('inicio');

            container.innerHTML = `
                <div class="mascote-container">
                    <div class="mascote-avatar" id="mascote-avatar-elem" title="${dados.nome}">${dados.icone}</div>
                    <div class="mascote-balao" id="mascote-balao-elem">
                        ${dados.texto}
                    </div>
                </div>
            `;
        },

        // Atualiza a fala dinamicamente durante o jogo
        atualizarFala(evento, dados = {}) {
            const balaoElem = document.getElementById('mascote-balao-elem');
            const avatarElem = document.getElementById('mascote-avatar-elem');
            if (!balaoElem) return;

            const res = this.falar(evento, dados);
            if (avatarElem) avatarElem.textContent = res.icone;
            balaoElem.textContent = res.texto;

            // Efeito visual sutil de pulso ao falar
            balaoElem.classList.remove('balao-animar');
            void balaoElem.offsetWidth; // reflow
            balaoElem.classList.add('balao-animar');
        }
    };

    window.Mascotes = Mascotes;
})();