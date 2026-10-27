/**
 * ==========================================================================
 * 5. js/visual.js — Módulo de Ajudas Visuais (Modo Assistido / window.Visual)
 * Implementa as 4 funções independentes que desenham dentro do container.
 * ==========================================================================
 */

(function () {
  'use strict';

  /**
   * Auxiliar para desenhar bolinhas agrupadas de 5 em 5 (estilo dominó / Quadro de 5)
   */
  function criarGrupoDominoCinco(quantidade, classeCor, qtdPonteDez) {
    var containerTermo = document.createElement('div');
    containerTermo.className = 'domino-termo';

    var restantes = Math.max(0, Math.min(Number(quantidade) || 0, 50));
    var indiceGlobal = 0;

    if (restantes === 0) {
      var cardVazio = document.createElement('div');
      cardVazio.className = 'domino-card-5';
      cardVazio.textContent = '0';
      containerTermo.appendChild(cardVazio);
      return containerTermo;
    }

    while (restantes > 0) {
      var tamBloco = Math.min(5, restantes);
      var cardCinco = document.createElement('div');
      cardCinco.className = 'domino-card-5';

      for (var i = 0; i < tamBloco; i++) {
        var dot = document.createElement('span');
        if (qtdPonteDez > 0 && indiceGlobal < qtdPonteDez) {
          dot.className = 'visual-dot dot-ponte-10';
          dot.title = 'Completa 10 com o primeiro grupo';
        } else {
          dot.className = 'visual-dot ' + classeCor;
        }
        cardCinco.appendChild(dot);
        indiceGlobal++;
      }

      containerTermo.appendChild(cardCinco);
      restantes -= tamBloco;
    }

    return containerTermo;
  }

  /**
   * 1. AJUDA DE ADIÇÃO:
   * Exibe os grupos de 5 estilo dominó com autocompletar (ex: 8 + 7 vira [5+3] + [2+5]),
   * destacando visualmente os pares que completam 10.
   */
  function ajudaAdicao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-adicao';

    var textoDica = '';
    var faltaParaDez = 0;
    var sobraDoSegundo = 0;

    if (numA < 10 && numB > 0 && (numA + numB) > 10) {
      faltaParaDez = 10 - numA;
      sobraDoSegundo = numB - faltaParaDez;
      textoDica = 'Complete 10: <strong>[' + numA + ' + <span class="hl-ponte">' + faltaParaDez + '</span>] + ' + sobraDoSegundo + '</strong> = <strong>10 + ' + sobraDoSegundo + '</strong>';
    } else if (numA >= 10 || numB >= 10) {
      var dezA = Math.floor(numA / 10) * 10;
      var uniA = numA % 10;
      var dezB = Math.floor(numB / 10) * 10;
      var uniB = numB % 10;
      textoDica = 'Decomponha: <strong>[' + (dezA > 0 ? dezA + '+' : '') + uniA + '] + [' + (dezB > 0 ? dezB + '+' : '') + uniB + ']</strong>';
    } else {
      var cA = numA > 5 ? '[5+' + (numA - 5) + ']' : String(numA);
      var cB = numB > 5 ? '[5+' + (numB - 5) + ']' : String(numB);
      textoDica = 'Conte as bolinhas: <strong>' + cA + ' + ' + cB + '</strong>';
    }

    var dicaEl = document.createElement('div');
    dicaEl.className = 'visual-dica-texto';
    dicaEl.innerHTML = textoDica;
    wrapper.appendChild(dicaEl);

    // Desenha sempre os blocos de bolinhas para somas até 40
    if (numA + numB <= 40) {
      var paineis = document.createElement('div');
      paineis.className = 'visual-domino-paineis';

      var grupoA = criarGrupoDominoCinco(numA, 'dot-a', 0);
      var sinal = document.createElement('span');
      sinal.className = 'visual-sinal';
      sinal.textContent = '+';
      var grupoB = criarGrupoDominoCinco(numB, 'dot-b', faltaParaDez);

      paineis.appendChild(grupoA);
      paineis.appendChild(sinal);
      paineis.appendChild(grupoB);
      wrapper.appendChild(paineis);
    }

    container.appendChild(wrapper);
  }

  /**
   * 2. AJUDA DE SUBTRAÇÃO:
   * Desenha o total de 'a' bolinhas em grupos de 5, onde as 'b' bolinhas subtraídas
   * aparecem em vermelho/apagado e as restantes ficam em destaque neon.
   */
  function ajudaSubtracao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;
    var restantes = Math.max(0, numA - numB);

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-subtracao';

    var dicaEl = document.createElement('div');
    dicaEl.className = 'visual-dica-texto';
    dicaEl.innerHTML = 'Total de <strong>' + numA + '</strong>: tirando <span class="hl-removido">' + numB + '</span>, conte as acesas!';
    wrapper.appendChild(dicaEl);

    var limiteDesenho = Math.min(numA, 40);
    var gradeCinco = document.createElement('div');
    gradeCinco.className = 'domino-termo';

    for (var bloco = 0; bloco < Math.ceil(limiteDesenho / 5); bloco++) {
      var cardCinco = document.createElement('div');
      cardCinco.className = 'domino-card-5';

      var inicio = bloco * 5;
      var fim = Math.min(inicio + 5, limiteDesenho);

      for (var i = inicio; i < fim; i++) {
        var dot = document.createElement('span');
        if (i < restantes) {
          dot.className = 'visual-dot dot-neon-restante';
        } else {
          dot.className = 'visual-dot dot-subtraido';
        }
        cardCinco.appendChild(dot);
      }

      gradeCinco.appendChild(cardCinco);
    }

    wrapper.appendChild(gradeCinco);
    container.appendChild(wrapper);
  }

  /**
   * 3. AJUDA DE MULTIPLICAÇÃO:
   * No Treino: exibe grade visual de linhas × colunas.
   * No Desafio: exibe fatores vizinhos discretos (máximo 2 de cada lado).
   */
  function ajudaMultiplicacao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 1;
    var numB = Number(b) || 1;

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-multiplicacao';

    var modoNormalizado = String(modo || 'treino').toLowerCase();

    if (modoNormalizado === 'desafio') {
      var titulo = document.createElement('div');
      titulo.className = 'visual-dica-texto';
      titulo.textContent = 'Vizinhos na tabuada do ' + numB + ':';
      wrapper.appendChild(titulo);

      var listaVizinhos = document.createElement('div');
      listaVizinhos.className = 'vizinhos-container';

      var deltas = [-2, -1, 1, 2];
      deltas.forEach(function (delta) {
        var fatorVizinho = numA + delta;
        if (fatorVizinho >= 1 && fatorVizinho <= 12) {
          var pill = document.createElement('span');
          pill.className = 'vizinho-pill';
          pill.textContent = fatorVizinho + '×' + numB + '=' + (fatorVizinho * numB);
          listaVizinhos.appendChild(pill);
        }
      });

      wrapper.appendChild(listaVizinhos);
    } else {
      var linhas = Math.min(numA, 10);
      var colunas = Math.min(numB, 10);

      var tituloGrade = document.createElement('div');
      tituloGrade.className = 'visual-dica-texto';
      tituloGrade.innerHTML = 'Grade: <strong>' + linhas + '</strong> ' + (linhas === 1 ? 'linha' : 'linhas') + ' × <strong>' + colunas + '</strong> colunas';
      wrapper.appendChild(tituloGrade);

      var grid = document.createElement('div');
      grid.className = 'mult-grid';
      grid.style.gridTemplateColumns = 'repeat(' + colunas + ', 1fr)';

      for (var r = 0; r < linhas; r++) {
        for (var c = 0; c < colunas; c++) {
          var dot = document.createElement('span');
          dot.className = r % 2 === 0 ? 'visual-dot dot-mult-par' : 'visual-dot dot-mult-impar';
          grid.appendChild(dot);
        }
      }

      wrapper.appendChild(grid);
    }

    container.appendChild(wrapper);
  }

  /**
   * 4. AJUDA DE DIVISÃO:
   * Exibe as bolinhas divididas igualmente em grupinhos visuais conforme o divisor.
   */
  function ajudaDivisao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var divisorSeguro = Math.max(1, Number(b) || 1);
    var porGrupo = Math.floor(numA / divisorSeguro);

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-divisao';

    var dicaEl = document.createElement('div');
    dicaEl.className = 'visual-dica-texto';
    dicaEl.innerHTML = '<strong>' + numA + '</strong> dividido igualmente em <strong>' + divisorSeguro + '</strong> grupos:';
    wrapper.appendChild(dicaEl);

    var gruposWrapper = document.createElement('div');
    gruposWrapper.className = 'divisao-grupos-wrapper';

    var maxGruposVisuais = Math.min(divisorSeguro, 10);
    var maxBolinhasPorGrupo = Math.min(porGrupo, 12);

    for (var g = 0; g < maxGruposVisuais; g++) {
      var caixinhaGrupo = document.createElement('div');
      caixinhaGrupo.className = 'divisao-grupo-card';

      for (var i = 0; i < maxBolinhasPorGrupo; i++) {
        var dot = document.createElement('span');
        dot.className = 'visual-dot dot-divisao';
        caixinhaGrupo.appendChild(dot);
      }

      gruposWrapper.appendChild(caixinhaGrupo);
    }

    wrapper.appendChild(gruposWrapper);
    container.appendChild(wrapper);
  }

  function limpar(container) {
    if (container) container.innerHTML = '';
  }

  /**
   * Roteador seguro que descobre os números (numA/a, numB/b) e a operação real da conta
   */
  function renderizarAjuda(questao, modo, container) {
    if (!questao || !container) return;

    var numA = questao.numA !== undefined ? questao.numA : questao.a;
    var numB = questao.numB !== undefined ? questao.numB : questao.b;

    // Caso o motor só tenha entregado o texto (ex: "8 - 7 ="), extrai números e símbolo
    if ((numA === undefined || numB === undefined) && questao.texto) {
      var partes = String(questao.texto).match(/(\d+)\s*([+\-−×*x÷/])\s*(\d+)/);
      if (partes) {
        numA = Number(partes[1]);
        numB = Number(partes[3]);
      }
    }

    var op = String(questao.operacao || '').toLowerCase();
    var textoConta = String(questao.texto || '');

    // Se a operação for 'mestre' ou símbolo direto, detecta pelo texto ou símbolo
    if (op === '+' || op === 'adicao' || textoConta.indexOf('+') !== -1) {
      ajudaAdicao(numA, numB, modo, container);
    } else if (op === '-' || op === '−' || op === 'subtracao' || textoConta.indexOf('-') !== -1 || textoConta.indexOf('−') !== -1) {
      ajudaSubtracao(numA, numB, modo, container);
    } else if (op === '×' || op === '*' || op === 'x' || op === 'multiplicacao' || textoConta.indexOf('×') !== -1) {
      ajudaMultiplicacao(numA, numB, modo, container);
    } else if (op === '÷' || op === '/' || op === 'divisao' || textoConta.indexOf('÷') !== -1) {
      ajudaDivisao(numA, numB, modo, container);
    } else {
      ajudaAdicao(numA, numB, modo, container);
    }
  }

  window.Visual = {
    ajudaAdicao: ajudaAdicao,
    ajudaSubtracao: ajudaSubtracao,
    ajudaMultiplicacao: ajudaMultiplicacao,
    ajudaDivisao: ajudaDivisao,
    limpar: limpar,
    renderizarAjuda: renderizarAjuda
  };
})();