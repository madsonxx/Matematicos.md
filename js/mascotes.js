/**
 * js/mascotes.js — Mascote Lateral Flutuante com Deslize (Slide-In / Slide-Out)
 * - Permanece oculto fora da tela por padrão (não ocupa espaço no centro).
 * - Desliza pela lateral apenas em momentos-chave (combos, dicas de erro, ajuda passo a passo)
 *   e recolhe sozinho após alguns segundos.
 */
(function () {
    'use strict';

    let mascoteAtual = null;
    let timerEsconder = null;

    const MASCOTES_DEFAULT = {
        coruja: {
            icone: '🦉',
            nome: 'Coruja',
            frases: {
                inicio: ["Vamos começar! Olho vivo!", "Estudando com atenção!"],
                acerto: ["Muito bem! Excelente!", "Isso aí!"],
                erro: ["Quase lá! Quer tentar a 💡 Ajuda?", "Respire fundo e olhe com calma!"],
                combo: ["Incrível! Multiplicador {mult}×! 🔥", "Voando alto! Combo {mult}×!"]
            }
        },
        raposa: {
            icone: '🦊',
            nome: 'Raposa',
            frases: {
                inicio: ["Velocidade e foco!", "Hora de acelerar os cálculos!"],
                acerto: ["Mandou bem demais!", "Ritmo excelente!"],
                erro: ["Opa! Ajustando a mira na próxima!", "Se precisar, ative a 💡 Ajuda!"],
                combo: ["Uau! Combo de {mult}× ativado! 🔥", "Ninguém segura! {mult}×!"]
            }
        },
        tartaruga: {
            icone: '🐢',
            nome: 'Tartaruga',
            frases: {
                inicio: ["Devagar e sempre.", "Com calma a gente chega lá."],
                acerto: ["Passo a passo, com firmeza!", "Boa resposta!"],
                erro: ["Sem pressa, tente na próxima!", "Use a 💡 Ajuda se quiser ver os passos."],
                combo: ["Olha só que ritmo firme! {mult}×! 🔥"]
            }
        }
    };

    function limparTimer() {
        if (timerEsconder) {
            clearTimeout(timerEsconder);
            timerEsconder = null;
        }
    }

    const Mascotes = {
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

        falar(evento, dados = {}) {
            const m = this.getMascoteAtual();
            const fallbackCat = MASCOTES_DEFAULT.coruja.frases;
            const frasesObj = m.frases || fallbackCat;

            let listaFrases = frasesObj[evento];
            if (!listaFrases) {
                if (evento === 'erro' && m.falasErro) listaFrases = m.falasErro;
                else if (evento === 'acerto' && m.falasAcerto) listaFrases = m.falasAcerto;
                else listaFrases = fallbackCat[evento] || ["Vamos lá!"];
            }

            let fraseSorteada = listaFrases[Math.floor(Math.random() * listaFrases.length)];

            if (dados.multiplicador) {
                fraseSorteada = fraseSorteada.replace('{mult}', dados.multiplicador);
            }

            return {
                icone: m.icone || m.emoji || '🦉',
                nome: m.nome || 'Mascote',
                texto: fraseSorteada
            };
        },

        // Renderiza inicialmente OCULTO fora da tela (não atrapalha a visão da conta)
        renderizar(containerId) {
            limparTimer();
            const container = document.getElementById(containerId);
            if (!container) return;

            const m = this.getMascoteAtual();
            const icone = m.icone || m.emoji || '🦉';
            const nome = m.nome || 'Mascote';

            container.innerHTML = `
                <div class="mascote-container oculto-mascote" id="mascote-box-elem">
                    <div class="mascote-avatar" id="mascote-avatar-elem" title="${nome}">${icone}</div>
                    <div class="mascote-balao" id="mascote-balao-elem"></div>
                </div>
            `;
        },

        // Desliza o mascote para dentro da tela e agenda a saída automática
        mostrarTemporariamente(duracaoMs = 2600) {
            limparTimer();
            const boxElem = document.getElementById('mascote-box-elem');
            if (!boxElem) return;

            boxElem.classList.remove('oculto-mascote');
            boxElem.classList.add('mostrar-mascote');

            timerEsconder = setTimeout(() => {
                this.esconder();
            }, duracaoMs);
        },

        // Recolhe o mascote de volta para fora da tela
        esconder() {
            limparTimer();
            const boxElem = document.getElementById('mascote-box-elem');
            if (!boxElem) return;
            boxElem.classList.remove('mostrar-mascote');
            boxElem.classList.add('oculto-mascote');
        },

        // Aciona o mascote em eventos específicos (combo, erro, etc.)
        atualizarFala(evento, dados = {}) {
            const balaoElem = document.getElementById('mascote-balao-elem');
            const avatarElem = document.getElementById('mascote-avatar-elem');
            const boxElem = document.getElementById('mascote-box-elem');
            if (!balaoElem) return;

            const res = this.falar(evento, dados);
            if (avatarElem) avatarElem.textContent = res.icone;
            if (boxElem) {
                boxElem.classList.remove('mascote-modo-duolingo');
            }

            balaoElem.innerHTML = res.texto;
            const tempoExibicao = (evento === 'erro') ? 3200 : 2500;
            this.mostrarTemporariamente(tempoExibicao);
        },

        // Exibe uma fala curta (ex: dica passo a passo) deslizando da lateral e saindo depois
        falarTextoDireto(htmlTexto, modoDuolingo = false, duracaoMs = 3800) {
            const balaoElem = document.getElementById('mascote-balao-elem');
            const boxElem = document.getElementById('mascote-box-elem');
            if (!balaoElem) return;

            if (boxElem) {
                boxElem.classList.toggle('mascote-modo-duolingo', Boolean(modoDuolingo));
            }

            balaoElem.innerHTML = htmlTexto;
            this.mostrarTemporariamente(duracaoMs);
        }
    };

    window.Mascotes = Mascotes;
})();