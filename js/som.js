/**
 * js/som.js — Gerenciamento de Efeitos Sonoros via Web Audio API
 * Exposto globalmente em window.Som
 */
(function () {
    'use strict';

    let audioCtx = null;
    let mudo = false;

    // Inicializa o AudioContext no primeiro gesto do usuário
    function initContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Carrega preferência de mudo do localStorage
    try {
        const salvo = localStorage.getItem('matematicos_mudo');
        if (salvo !== null) {
            mudo = JSON.parse(salvo);
        }
    } catch (e) {
        console.error('Erro ao ler estado de mudo:', e);
    }

    const Som = {
        estaMudo() {
            return mudo;
        },

        alternarMudo() {
            mudo = !mudo;
            try {
                localStorage.setItem('matematicos_mudo', JSON.stringify(mudo));
            } catch (e) {
                console.error('Erro ao salvar estado de mudo:', e);
            }
            return mudo;
        },

        // Bip ascendente curto para acerto
        tocarAcerto() {
            if (mudo) return;
            initContext();
            if (!audioCtx) return;

            try {
                const agora = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, agora); // Lá 4
                osc.frequency.exponentialRampToValueAtTime(880, agora + 0.12); // Lá 5

                gain.gain.setValueAtTime(0.15, agora);
                gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.15);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(agora);
                osc.stop(agora + 0.15);
            } catch (e) {
                console.error('Erro no som de acerto:', e);
            }
        },

        // Buzz grave para erro
        tocarErro() {
            if (mudo) return;
            initContext();
            if (!audioCtx) return;

            try {
                const agora = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, agora);
                osc.frequency.setValueAtTime(120, agora + 0.08);

                gain.gain.setValueAtTime(0.2, agora);
                gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.25);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(agora);
                osc.stop(agora + 0.25);
            } catch (e) {
                console.error('Erro no som de erro:', e);
            }
        },

        // Arpejo curto para marcos de combo e final de partida
        tocarArpejo() {
            if (mudo) return;
            initContext();
            if (!audioCtx) return;

            try {
                const agora = audioCtx.currentTime;
                // Acorde de C maior (C5, E5, G5, C6)
                const notas = [523.25, 659.25, 783.99, 1046.50];

                notas.forEach((freq, i) => {
                    const tempoNota = agora + (i * 0.07);
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, tempoNota);

                    gain.gain.setValueAtTime(0.12, tempoNota);
                    gain.gain.exponentialRampToValueAtTime(0.001, tempoNota + 0.15);

                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.start(tempoNota);
                    osc.stop(tempoNota + 0.15);
                });
            } catch (e) {
                console.error('Erro no som de arpejo:', e);
            }
        }
    };

    window.Som = Som;
})();