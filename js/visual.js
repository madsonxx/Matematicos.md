/**
 * ==========================================================================
 * 5. js/visual.js — Módulo de Ajudas Visuais e "Arminha" Vertical (M6)
 * Implementa:
 * - Arminha Vertical limpa (SEM rótulos D/U) com Grid Estrito de Colunas
 * - Highlight (Cápsula Neon) posicionado estritamente na coluna ativa (U ou D)
 * - Visor com sublinhados (_ / __) alinhados com as colunas e preenchimento em tempo real
 * - Sem poluição de painéis de texto abaixo da arminha no modo Passo a Passo
 * ==========================================================================
 */

(function () {
  'use strict';

  /**
   * M6: Renderiza a conta principal no centro do palco (#area-conta).
   * - Em Adição e Subtração: monta a Arminha Vertical limpa e posiciona o visor embaixo do traço.
   * - Em Multiplicação e Divisão: mantém o formato horizontal clássico.
   */
  function renderizarContaNoPalco(conta, elTextoConta, elDisplayResposta) {
    limparDestaquesArminha();

    if (!conta || !elTextoConta) return;

    var areaConta = elTextoConta.parentElement;
    var op = String(conta.operacao || '').toLowerCase();
    var ehVertical = (op === 'adicao' || op === '+' || op === 'subtracao' || op === '-' || op === '−');

    if (!ehVertical) {
      if (areaConta) areaConta.classList.remove('area-conta-vertical');
      elTextoConta.classList.remove('conta-modo-arminha');
      elTextoConta.textContent = conta.texto;

      if (elDisplayResposta && areaConta && elDisplayResposta.parentElement !== areaConta) {
        areaConta.appendChild(elDisplayResposta);
      }
      if (elDisplayResposta) {
        elDisplayResposta.classList.remove('display-arminha-resultado');
      }
      atualizarVisorSublinhado(elDisplayResposta, '', String(conta.resposta).length, false, null);
      return;
    }

    // Layout Vertical ("Arminha") para Adição e Subtração — SEM rótulos D e U
    if (areaConta) areaConta.classList.add('area-conta-vertical');
    elTextoConta.classList.add('conta-modo-arminha');

    var numA = Number(conta.numA !== undefined ? conta.numA : conta.a) || 0;
    var numB = Number(conta.numB !== undefined ? conta.numB : conta.b) || 0;
    var simbolo = (op === 'subtracao' || op === '-' || op === '−') ? '−' : '+';

    var dezA = numA >= 10 ? String(Math.floor(numA / 10)) : '';
    var uniA = String(numA % 10);
    var dezB = numB >= 10 ? String(Math.floor(numB / 10)) : '';
    var uniB = String(numB % 10);

    elTextoConta.innerHTML =
      '<div class="arminha-card" id="arminha-card-ativa">' +
      '<div class="arminha-grid">' +
      // Cápsulas Neon de Coluna (Coluna 2 = Dezena, Coluna 3 = Unidade)
      '<div class="arminha-col-bg col-bg-dez" id="arminha-hl-dez"></div>' +
      '<div class="arminha-col-bg col-bg-uni" id="arminha-hl-uni"></div>' +

      // Linha 1: Área de Reagrupamento (Vai 1 / Empréstimo)
      '<div class="arminha-cel arminha-row-carry col-op"></div>' +
      '<div class="arminha-cel arminha-row-carry col-dez arminha-carry-cel" id="arminha-carry-dez"></div>' +
      '<div class="arminha-cel arminha-row-carry col-uni arminha-carry-cel" id="arminha-carry-uni"></div>' +

      // Linha 2: Primeiro Número (numA)
      '<div class="arminha-cel arminha-row-a col-op"></div>' +
      '<div class="arminha-cel arminha-row-a col-dez arminha-digito" id="arminha-a-dez">' + dezA + '</div>' +
      '<div class="arminha-cel arminha-row-a col-uni arminha-digito" id="arminha-a-uni">' + uniA + '</div>' +

      // Linha 3: Operador + Segundo Número (numB)
      '<div class="arminha-cel arminha-row-b col-op arminha-operador">' + simbolo + '</div>' +
      '<div class="arminha-cel arminha-row-b col-dez arminha-digito" id="arminha-b-dez">' + dezB + '</div>' +
      '<div class="arminha-cel arminha-row-b col-uni arminha-digito" id="arminha-b-uni">' + uniB + '</div>' +

      // Linha 4: Traço horizontal
      '<div class="arminha-traco"></div>' +

      // Linha 5: Visor encaixado exatamente nas colunas Dezena e Unidade
      '<div class="arminha-slot-resposta" id="arminha-slot-resposta"></div>' +
      '</div>' +
      '</div>';

    var slotResposta = document.getElementById('arminha-slot-resposta');
    if (elDisplayResposta && slotResposta) {
      elDisplayResposta.classList.add('display-arminha-resultado');
      slotResposta.appendChild(elDisplayResposta);
    }

    atualizarVisorSublinhado(elDisplayResposta, '', String(conta.resposta).length, true, null);
  }

  /**
   * Atualiza o visor com sublinhados (_ ou _ _) e preenche os dígitos em tempo real.
   * - Se estiver na Arminha (ehArminha = true), alinha cada casa exatamente na coluna da Dezena e da Unidade.
   * - No modo passo a passo, permite preencher primeiro a Unidade (ex: "_ 0") e depois a Dezena ("2 0").
   */
  function atualizarVisorSublinhado(elDisplay, valorTexto, qtdDigitosAlvo, ehArminha, estadoPasso) {
    var display = elDisplay || document.getElementById('display-resposta');
    if (!display) return;

    var ehModoArminha = (ehArminha !== undefined)
      ? Boolean(ehArminha)
      : display.classList.contains('display-arminha-resultado');

    var tam = Math.max(1, Number(qtdDigitosAlvo) || 1);
    var str = String(valorTexto || '');

    // Se estiver em passo a passo por coluna (Unidade -> Dezena)
    if (estadoPasso && estadoPasso.ativo) {
      var charDez = (estadoPasso.digitoDez !== null && estadoPasso.digitoDez !== undefined) ? String(estadoPasso.digitoDez) : '_';
      var charUni = (estadoPasso.digitoUni !== null && estadoPasso.digitoUni !== undefined) ? String(estadoPasso.digitoUni) : '_';

      if (tam === 1) {
        display.innerHTML =
          '<span class="slot-digito-visor"></span>' +
          '<span class="slot-digito-visor ' + (charUni === '_' ? 'slot-vazio slot-foco-passo' : '') + '">' + charUni + '</span>';
      } else {
        var focoDez = (estadoPasso.etapa === 'dez' && charDez === '_') ? 'slot-foco-passo' : '';
        var focoUni = (estadoPasso.etapa === 'uni' && charUni === '_') ? 'slot-foco-passo' : '';
        display.innerHTML =
          '<span class="slot-digito-visor ' + (charDez === '_' ? 'slot-vazio ' : '') + focoDez + '">' + charDez + '</span>' +
          '<span class="slot-digito-visor ' + (charUni === '_' ? 'slot-vazio ' : '') + focoUni + '">' + charUni + '</span>';
      }
      return;
    }

    // Modo normal (Teclado ou clique de alternativa inteira)
    if (ehModoArminha) {
      if (tam === 1) {
        var dU = str.length >= 1 ? str.charAt(0) : '_';
        display.innerHTML =
          '<span class="slot-digito-visor"></span>' +
          '<span class="slot-digito-visor ' + (dU === '_' ? 'slot-vazio' : '') + '">' + dU + '</span>';
      } else {
        var d1 = str.length >= 1 ? str.charAt(0) : '_';
        var d2 = str.length >= 2 ? str.charAt(1) : '_';
        display.innerHTML =
          '<span class="slot-digito-visor ' + (d1 === '_' ? 'slot-vazio' : '') + '">' + d1 + '</span>' +
          '<span class="slot-digito-visor ' + (d2 === '_' ? 'slot-vazio' : '') + '">' + d2 + '</span>';
      }
    } else {
      // Conta Horizontal (Multiplicação / Divisão)
      var pecas = [];
      for (var i = 0; i < tam; i++) {
        var ch = i < str.length ? str.charAt(i) : '_';
        pecas.push(ch);
      }
      display.textContent = pecas.join(' ');
    }
  }

  /**
   * Remove destaques de coluna e badges de "vai 1" / "empréstimo" da Arminha
   */
  function limparDestaquesArminha() {
    var hlDez = document.getElementById('arminha-hl-dez');
    var hlUni = document.getElementById('arminha-hl-uni');
    var carryDez = document.getElementById('arminha-carry-dez');
    var carryUni = document.getElementById('arminha-carry-uni');
    var aDez = document.getElementById('arminha-a-dez');
    var aUni = document.getElementById('arminha-a-uni');

    if (hlDez) hlDez.className = 'arminha-col-bg col-bg-dez';
    if (hlUni) hlUni.className = 'arminha-col-bg col-bg-uni';
    if (carryDez) carryDez.innerHTML = '';
    if (carryUni) carryUni.innerHTML = '';
    if (aDez) aDez.classList.remove('digito-riscado');
    if (aUni) aUni.classList.remove('digito-destaque-emprestimo');
  }

  /**
   * Destaca exatamente a coluna solicitada ('uni' ou 'dez') e exibe badges de reagrupamento se houver
   */
  function destacarColunaArminha(coluna, opcoesExtras) {
    limparDestaquesArminha();

    var hlDez = document.getElementById('arminha-hl-dez');
    var hlUni = document.getElementById('arminha-hl-uni');
    var carryDez = document.getElementById('arminha-carry-dez');
    var carryUni = document.getElementById('arminha-carry-uni');
    var aDez = document.getElementById('arminha-a-dez');
    var aUni = document.getElementById('arminha-a-uni');

    var cfg = opcoesExtras || {};

    if (coluna === 'uni' && hlUni) {
      hlUni.classList.add('arminha-col-ativa-neon');
    } else if (coluna === 'dez' && hlDez) {
      hlDez.classList.add('arminha-col-ativa-neon');
    }

    if (cfg.vaiUm && carryDez) {
      carryDez.innerHTML = '<span class="badge-arminha-carry">+1</span>';
    }

    if (cfg.emprestimo) {
      if (aDez) aDez.classList.add('digito-riscado');
      if (aUni) aUni.classList.add('digito-destaque-emprestimo');
      if (carryDez && cfg.dezRestante !== undefined) {
        carryDez.innerHTML = '<span class="badge-arminha-emprestimo-dez">' + cfg.dezRestante + '</span>';
      }
      if (carryUni && cfg.uniNova !== undefined) {
        carryUni.innerHTML = '<span class="badge-arminha-emprestimo-uni">' + cfg.uniNova + '</span>';
      }
    }
  }

  /**
   * Auxiliar para desenhar bolinhas agrupadas de 5 em 5 (apenas para contas pequenas de 1 coluna)
   */
  function criarGrupoDominoCinco(quantidade, classeCor, qtdPonteDez) {
    var containerTermo = document.createElement('div');
    containerTermo.className = 'domino-termo';

    var restantes = Math.max(0, Math.min(Number(quantidade) || 0, 20));
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
   * 1. AJUDA DE ADIÇÃO (Apenas para contas simples <= 19 quando não usa passo a passo de 2 colunas)
   */
  function ajudaAdicao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;

    // Se tem 2 colunas (numA >= 10 ou numB >= 10), o passo a passo ocorre direto na Arminha + Mascote!
    if (numA >= 10 || numB >= 10) {
      container.classList.add('oculto');
      return;
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-adicao';

    var faltaParaDez = (numA < 10 && numB > 0 && (numA + numB) > 10) ? (10 - numA) : 0;
    var paineis = document.createElement('div');
    paineis.className = 'visual-domino-paineis';

    paineis.appendChild(criarGrupoDominoCinco(numA, 'dot-a', 0));
    var sinal = document.createElement('span');
    sinal.className = 'visual-sinal';
    sinal.textContent = '+';
    paineis.appendChild(sinal);
    paineis.appendChild(criarGrupoDominoCinco(numB, 'dot-b', faltaParaDez));

    wrapper.appendChild(paineis);
    container.appendChild(wrapper);
  }

  /**
   * 2. AJUDA DE SUBTRAÇÃO (Apenas bolinhas para contas até 19; de 20+ usa o passo a passo limpo na Arminha)
   */
  function ajudaSubtracao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;

    if (numA >= 20) {
      container.classList.add('oculto');
      return;
    }

    var restantes = Math.max(0, numA - numB);
    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-subtracao';

    var gradeCinco = document.createElement('div');
    gradeCinco.className = 'domino-termo';

    for (var bloco = 0; bloco < Math.ceil(numA / 5); bloco++) {
      var cardCinco = document.createElement('div');
      cardCinco.className = 'domino-card-5';

      var inicio = bloco * 5;
      var fim = Math.min(inicio + 5, numA);

      for (var i = inicio; i < fim; i++) {
        var dot = document.createElement('span');
        dot.className = (i < restantes) ? 'visual-dot dot-neon-restante' : 'visual-dot dot-subtraido';
        cardCinco.appendChild(dot);
      }

      gradeCinco.appendChild(cardCinco);
    }

    wrapper.appendChild(gradeCinco);
    container.appendChild(wrapper);
  }

  /**
   * 3. AJUDA DE MULTIPLICAÇÃO
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
   * 4. AJUDA DE DIVISÃO
   */
  function ajudaDivisao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var divisorSeguro = Math.max(1, Number(b) || 1);
    var porGrupo = Math.floor(numA / divisorSeguro);

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-divisao';

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
    limparDestaquesArminha();
    if (container) container.innerHTML = '';
  }

  function renderizarAjuda(questao, modo, container) {
    if (!questao || !container) return;

    var numA = questao.numA !== undefined ? questao.numA : questao.a;
    var numB = questao.numB !== undefined ? questao.numB : questao.b;

    if ((numA === undefined || numB === undefined) && questao.texto) {
      var partes = String(questao.texto).match(/(\d+)\s*([+\-−×*x÷/])\s*(\d+)/);
      if (partes) {
        numA = Number(partes[1]);
        numB = Number(partes[3]);
      }
    }

    var op = String(questao.operacao || '').toLowerCase();
    var textoConta = String(questao.texto || '');

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
    limparDestaquesArminha: limparDestaquesArminha,
    destacarColunaArminha: destacarColunaArminha,
    atualizarVisorSublinhado: atualizarVisorSublinhado,
    renderizarContaNoPalco: renderizarContaNoPalco,
    renderizarAjuda: renderizarAjuda
  };
})();