/**
 * js/mascotes.js — Rodízio de Mascotes e Balões de Fala (M6: Suporte a Guia Estilo Duolingo)
 * Exposto globalmente em window.Mascotes (Com fallback seguro de configuração)
 */
(function () {
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
                combo: ["Impressionante! Multiplicador {mult}×!"],
                passoUnidades: ["Vamos começar pelas unidades (coluna U)!", "Olhe primeiro para a coluna das unidades!"],
                passoVaiUm: ["Passou de 9! Fica a unidade e sobe 1 para a dezena!", "Subiu 1 lá para o topo das dezenas!"],
                passoEmprestimo: ["Pedimos 1 dezena emprestada ao vizinho da frente!", "O vizinho emprestou 10 unidades para ajudar!"],
                passoDezenas: ["Agora vamos resolver a coluna das dezenas (D)!", "Unidades prontas! Agora some as dezenas!"]
            }
        },
        raposa: {
            icone: '🦊',
            nome: 'Raposa',
            frases: {
                inicio: ["Velocidade e foco!", "Hora de acelerar os cálculos!"],
                acerto: ["Mandou bem demais!", "Ritmo excelente!"],
                erro: ["Errar faz parte, vamos na próxima!", "Ajustando a mira!"],
                combo: ["Uau! Combo de {mult}× ativado!"],
                passoUnidades: ["Foco na direita: vamos começar pelas unidades!", "Primeiro a coluna U, bem rápido!"],
                passoVaiUm: ["Deu 10 ou mais! Sobe o 1 para a coluna D!", "Olha o 1 subindo para as dezenas!"],
                passoEmprestimo: ["Pede emprestado ao vizinho da esquerda e continua!", "Com +10 emprestado fica fácil resolver!"],
                passoDezenas: ["Agora feche a conta na coluna das dezenas!", "Por último, calcule a coluna D!"]
            }
        },
        tartaruga: {
            icone: '🐢',
            nome: 'Tartaruga',
            frases: {
                inicio: ["Devagar e sempre.", "Com calma a gente chega lá."],
                acerto: ["Passo a passo, com firmeza!", "Boa resposta!"],
                erro: ["Sem pressa, respire fundo.", "Vamos com calma na próxima."],
                combo: ["Olha só que ritmo firme! {mult}×!"],
                passoUnidades: ["Sem pressa: vamos começar pelas unidades!", "Passo 1: olhe com calma a coluna U."],
                passoVaiUm: ["Juntou uma dezena nova! Subimos o 1 com cuidado.", "O 1 vai lá para cima da dezena."],
                passoEmprestimo: ["Vamos pedir 1 dezena emprestada ao vizinho da frente.", "O vizinho ajuda emprestando 10 unidades!"],
                passoDezenas: ["Passo final: vamos calcular a coluna das dezenas!", "Agora só falta a coluna D."]
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
            const fallbackCat = MASCOTES_DEFAULT.coruja.frases;
            const frasesObj = m.frases || fallbackCat;
            let frases = frasesObj[evento] || fallbackCat[evento] || frasesObj.inicio || ["Vamos lá!"];

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
                <div class="mascote-container" id="mascote-box-elem">
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
            const boxElem = document.getElementById('mascote-box-elem');
            if (!balaoElem) return;

            const res = this.falar(evento, dados);
            if (avatarElem) avatarElem.textContent = res.icone;
            if (boxElem && !dados.manterModoDuolingo) {
                boxElem.classList.remove('mascote-modo-duolingo');
            }

            balaoElem.innerHTML = res.texto;

            // Efeito visual sutil de pulso ao falar
            balaoElem.classList.remove('balao-animar');
            void balaoElem.offsetWidth; // reflow
            balaoElem.classList.add('balao-animar');
        },

        // M6: Define uma fala pedagógica direta no balão (com estilo Duolingo opcional)
        falarTextoDireto(htmlTexto, modoDuolingo = false) {
            const balaoElem = document.getElementById('mascote-balao-elem');
            const boxElem = document.getElementById('mascote-box-elem');
            if (!balaoElem) return;

            if (boxElem) {
                boxElem.classList.toggle('mascote-modo-duolingo', Boolean(modoDuolingo));
            }

            balaoElem.innerHTML = htmlTexto;
            balaoElem.classList.remove('balao-animar');
            void balaoElem.offsetWidth;
            balaoElem.classList.add('balao-animar');
        }
    };

    window.Mascotes = Mascotes;
})();