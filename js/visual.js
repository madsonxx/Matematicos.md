/* ==========================================================================
   5. js/visual.js — Modo Assistido ("💡 Ajuda") (window.Visual)
   REGRA DE OURO: 4 funções independentes recebendo (numA, numB, modo, containerHTML).
   Casca pronta no M0. Os desenhos das bolinhas entram no Marco 3.
   ========================================================================== */

window.Visual = {
  limpar: function (containerHTML) {
    if (containerHTML) {
      containerHTML.innerHTML = '';
    }
  },

  ajudaAdicao: function (numA, numB, modo, containerHTML) {
    if (!containerHTML) return;
    containerHTML.innerHTML = '<p class="texto-pequeno">💡 [M3] Ajuda de Adição (' + numA + ' + ' + numB + ')</p>';
  },

  ajudaSubtracao: function (numA, numB, modo, containerHTML) {
    if (!containerHTML) return;
    containerHTML.innerHTML = '<p class="texto-pequeno">💡 [M3] Ajuda de Subtração (' + numA + ' − ' + numB + ')</p>';
  },

  ajudaMultiplicacao: function (numA, numB, modo, containerHTML) {
    if (!containerHTML) return;
    containerHTML.innerHTML = '<p class="texto-pequeno">💡 [M3] Ajuda de Multiplicação (' + numA + ' × ' + numB + ')</p>';
  },

  ajudaDivisao: function (numA, numB, modo, containerHTML) {
    if (!containerHTML) return;
    containerHTML.innerHTML = '<p class="texto-pequeno">💡 [M3] Ajuda de Divisão (' + numA + ' ÷ ' + numB + ')</p>';
  }
};