/* ==========================================================================
   8. js/teclado.js — Teclado Virtual (3×4) e Físico com Sublinhados (_ / __)
   - Substitui o '?' por sublinhados sincronizados em tempo real
   - Suporta tanto a conta direta quanto o Passo a Passo por coluna (U -> D)
   ========================================================================== */

(function () {
  'use strict';

  window.Teclado = {
    entradaAtual: '',
    tamanhoAlvo: 1,
    modoPassoColuna: false,
    bloqueado: false,
    aoCompletarCallback: null,
    aoDigitarParcialCallback: null,
    _eventosRegistrados: false,

    // Inicializa o teclado e conecta os callbacks de verificação e atualização em tempo real
    inicializar: function (callbackVerificacao, callbackParcial) {
      this.aoCompletarCallback = callbackVerificacao;
      this.aoDigitarParcialCallback = callbackParcial || null;
      this.entradaAtual = '';
      this.bloqueado = false;

      if (!this._eventosRegistrados) {
        this._registrarEventosDOM();
        this._eventosRegistrados = true;
      }

      this._atualizarDisplay();
    },

    // Prepara o display e define quantos dígitos a resposta (ou a coluna atual) possui
    prepararParaNovaConta: function (respostaCorreta, ehModoPassoColuna) {
      this.entradaAtual = '';
      this.tamanhoAlvo = String(respostaCorreta).length;
      this.modoPassoColuna = Boolean(ehModoPassoColuna);
      this.bloqueado = false;

      var elDisplay = document.getElementById('display-resposta');
      if (elDisplay) {
        elDisplay.classList.remove('display-erro', 'tremer');
      }

      this._atualizarDisplay();
    },

    _registrarEventosDOM: function () {
      var self = this;

      var botoes = document.querySelectorAll('.tecla-num');
      for (var i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener('click', function (e) {
          var tecla = e.currentTarget.getAttribute('data-tecla');
          self._processarTecla(tecla);
        });
      }

      document.addEventListener('keydown', function (e) {
        var telaJogo = document.getElementById('tela-jogo');
        if (!telaJogo || telaJogo.classList.contains('oculto')) return;
        if (!window.Modos || !window.Modos.partidaAtiva) return;

        var elTeclado = document.getElementById('container-teclado');
        if (elTeclado && elTeclado.classList.contains('oculto')) return;

        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          self._processarTecla(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          self._processarTecla('apagar');
        }
      });
    },

    _processarTecla: function (tecla) {
      if (this.bloqueado || !tecla) return;

      if (tecla === 'apagar') {
        if (this.entradaAtual.length > 0) {
          this.entradaAtual = this.entradaAtual.slice(0, -1);
          this._atualizarDisplay();
        }
        return;
      }

      if (this.entradaAtual.length < this.tamanhoAlvo) {
        this.entradaAtual += String(tecla);
        this._atualizarDisplay();

        if (this.entradaAtual.length === this.tamanhoAlvo) {
          var valorFinal = this.entradaAtual;
          if (typeof this.aoCompletarCallback === 'function') {
            this.aoCompletarCallback(valorFinal);
          }
        }
      }
    },

    _atualizarDisplay: function () {
      if (typeof this.aoDigitarParcialCallback === 'function') {
        this.aoDigitarParcialCallback(this.entradaAtual);
        return;
      }

      var elDisplay = document.getElementById('display-resposta');
      if (!elDisplay) return;

      if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
        window.Visual.atualizarVisorSublinhado(elDisplay, this.entradaAtual, this.tamanhoAlvo, undefined, null);
      } else {
        var sublinhados = [];
        for (var i = 0; i < this.tamanhoAlvo; i++) {
          sublinhados.push(i < this.entradaAtual.length ? this.entradaAtual.charAt(i) : '_');
        }
        elDisplay.textContent = sublinhados.join(' ');
      }
    },

    mostrarErroTemporario: function (respostaCerta, duracaoMs, callbackFim) {
      var self = this;
      this.bloqueado = true;

      var elDisplay = document.getElementById('display-resposta');
      if (elDisplay) {
        if (window.Visual && typeof window.Visual.atualizarVisorSublinhado === 'function') {
          window.Visual.atualizarVisorSublinhado(elDisplay, String(respostaCerta), String(respostaCerta).length, undefined, null);
        } else {
          elDisplay.textContent = String(respostaCerta);
        }
        elDisplay.classList.add('display-erro', 'tremer');
      }

      setTimeout(function () {
        if (elDisplay) {
          elDisplay.classList.remove('display-erro', 'tremer');
        }
        self.bloqueado = false;
        if (typeof callbackFim === 'function') {
          callbackFim();
        }
      }, duracaoMs || 300);
    }
  };
})();