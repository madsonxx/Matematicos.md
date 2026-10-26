/* ==========================================================================
   8. js/teclado.js — Teclado Virtual (3×4) e Físico com Auto-Avanço (window.Teclado)
   Redesign: Sem botão Confirmar (✓). Auto-avanço imediato ao atingir a
   quantidade de dígitos da resposta correta.
   ========================================================================== */

(function () {
  'use strict';

  window.Teclado = {
    entradaAtual: '',
    tamanhoAlvo: 1,
    bloqueado: false,
    aoCompletarCallback: null,
    _eventosRegistrados: false,

    // Inicializa o teclado e conecta o callback de verificação do Modo Desafio
    inicializar: function (callbackVerificacao) {
      this.aoCompletarCallback = callbackVerificacao;
      this.entradaAtual = '';
      this.bloqueado = false;

      if (!this._eventosRegistrados) {
        this._registrarEventosDOM();
        this._eventosRegistrados = true;
      }

      this._atualizarDisplay();
    },

    // Prepara o display e define quantos dígitos a nova resposta possui
    prepararParaNovaConta: function (respostaCorreta) {
      this.entradaAtual = '';
      this.tamanhoAlvo = String(respostaCorreta).length;
      this.bloqueado = false;

      var elDisplay = document.getElementById('display-resposta');
      if (elDisplay) {
        elDisplay.classList.remove('display-erro', 'tremer');
      }

      this._atualizarDisplay();
    },

    // Registra cliques nos botões numéricos virtuais e teclas físicas do computador
    _registrarEventosDOM: function () {
      var self = this;

      // Cliques no Teclado Virtual (0–9 e Apagar ⌫)
      var botoes = document.querySelectorAll('.tecla-num');
      for (var i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener('click', function (e) {
          var tecla = e.currentTarget.getAttribute('data-tecla');
          self._processarTecla(tecla);
        });
      }

      // Digitação no Teclado Físico (apenas números e Backspace)
      document.addEventListener('keydown', function (e) {
        var telaJogo = document.getElementById('tela-jogo');
        if (!telaJogo || telaJogo.classList.contains('oculto')) return;
        if (!window.Modos || !window.Modos.partidaAtiva || window.Modos.modoAtual !== 'desafio') return;

        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          self._processarTecla(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          self._processarTecla('apagar');
        }
      });
    },

    // Processa cada dígito ou comando de apagar e aciona o auto-avanço
    _processarTecla: function (tecla) {
      if (this.bloqueado || !tecla) return;

      if (tecla === 'apagar') {
        if (this.entradaAtual.length > 0) {
          this.entradaAtual = this.entradaAtual.slice(0, -1);
          this._atualizarDisplay();
        }
        return;
      }

      // Adiciona o dígito se ainda não atingiu o tamanho da resposta certa
      if (this.entradaAtual.length < this.tamanhoAlvo) {
        this.entradaAtual += String(tecla);
        this._atualizarDisplay();

        // AUTO-AVANÇO: Assim que igualar a quantidade de dígitos da resposta, confere!
        if (this.entradaAtual.length === this.tamanhoAlvo) {
          var valorFinal = this.entradaAtual;
          if (typeof this.aoCompletarCallback === 'function') {
            this.aoCompletarCallback(valorFinal);
          }
        }
      }
    },

    // Atualiza o texto do display da conta
    _atualizarDisplay: function () {
      var elDisplay = document.getElementById('display-resposta');
      if (!elDisplay) return;

      elDisplay.textContent = this.entradaAtual.length > 0 ? this.entradaAtual : '?';
    },

    // Mostra a resposta correta em vermelho por 0,3s quando o aluno erra e depois avança
    mostrarErroTemporario: function (respostaCerta, duracaoMs, callbackFim) {
      var self = this;
      this.bloqueado = true;

      var elDisplay = document.getElementById('display-resposta');
      if (elDisplay) {
        elDisplay.textContent = String(respostaCerta);
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