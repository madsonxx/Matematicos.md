/**
 * ==========================================================================
 * 5. js/visual.js — Módulo de Ajudas Visuais e "Arminha" Vertical (M6)
 * Implementa:
 * - As 4 funções isoladas (ajudaAdicao, ajudaSubtracao, ajudaMultiplicacao, ajudaDivisao)
 * - Renderização da "Arminha" Vertical (Dezena e Unidade alinhadas) para Adição e Subtração
 * - Fluxo Guiado Passo a Passo Estilo Duolingo com Highlight de Colunas e Reagrupamento
 * - Regra do 19: empréstimo com vizinho ativo exclusivamente a partir de 20
 * ==========================================================================
 */

(function () {
  'use strict';

  var estadoGuiaM6 = {
    timerPasso: null,
    passoAtual: 0,
    passos: [],
    conta: null
  };

  function pararTimerGuia() {
    if (estadoGuiaM6.timerPasso) {
      clearTimeout(estadoGuiaM6.timerPasso);
      estadoGuiaM6.timerPasso = null;
    }
  }

  /**
   * M6: Renderiza a conta principal no centro do palco (#area-conta).
   * - Em Adição e Subtração: monta a "Arminha" vertical com colunas D e U e encaixa o #display-resposta embaixo do traço.
   * - Em Multiplicação e Divisão: mantém o formato horizontal clássico.
   */
  function renderizarContaNoPalco(conta, elTextoConta, elDisplayResposta) {
    pararTimerGuia();
    limparDestaquesArminha();

    if (!conta || !elTextoConta) return;

    var areaConta = elTextoConta.parentElement;
    var op = String(conta.operacao || '').toLowerCase();
    var ehVertical = (op === 'adicao' || op === '+' || op === 'subtracao' || op === '-' || op === '−');

    if (!ehVertical) {
      // Layout Horizontal Clássico (Multiplicação e Divisão)
      if (areaConta) areaConta.classList.remove('area-conta-vertical');
      elTextoConta.classList.remove('conta-modo-arminha');
      elTextoConta.textContent = conta.texto;

      if (elDisplayResposta && areaConta && elDisplayResposta.parentElement !== areaConta) {
        areaConta.appendChild(elDisplayResposta);
      }
      if (elDisplayResposta) {
        elDisplayResposta.classList.remove('display-arminha-resultado');
      }
      return;
    }

    // Layout Vertical ("Arminha") para Adição e Subtração
    if (areaConta) areaConta.classList.add('area-conta-vertical');
    elTextoConta.classList.add('conta-modo-arminha');

    var numA = Number(conta.numA !== undefined ? conta.numA : conta.a) || 0;
    var numB = Number(conta.numB !== undefined ? conta.numB : conta.b) || 0;
    var simbolo = (op === 'subtracao' || op === '-' || op === '−') ? '−' : '+';

    var temDezena = (numA >= 10 || numB >= 10 || (numA + numB) >= 10);
    var dezA = numA >= 10 ? Math.floor(numA / 10) : '';
    var uniA = numA % 10;
    var dezB = numB >= 10 ? Math.floor(numB / 10) : '';
    var uniB = numB % 10;

    elTextoConta.innerHTML =
      '<div class="arminha-card" id="arminha-card-ativa">' +
      '<div class="arminha-grid ' + (temDezena ? 'com-dezena' : 'so-unidade') + '">' +
      // Destaque de fundo por coluna (Coluna D e Coluna U)
      '<div class="arminha-col-bg col-bg-dez" id="arminha-hl-dez"></div>' +
      '<div class="arminha-col-bg col-bg-uni" id="arminha-hl-uni"></div>' +

      // Linha 0: Rótulos D e U discretos
      '<div class="arminha-cel arminha-rotulo-op"></div>' +
      '<div class="arminha-cel arminha-rotulo-col">' + (temDezena ? 'D' : '') + '</div>' +
      '<div class="arminha-cel arminha-rotulo-col">U</div>' +

      // Linha 1: Área de Reagrupamento (Vai 1 / Empréstimo)
      '<div class="arminha-cel"></div>' +
      '<div class="arminha-cel arminha-carry-cel" id="arminha-carry-dez"></div>' +
      '<div class="arminha-cel arminha-carry-cel" id="arminha-carry-uni"></div>' +

      // Linha 2: Primeiro Número (numA)
      '<div class="arminha-cel"></div>' +
      '<div class="arminha-cel arminha-digito" id="arminha-a-dez">' + dezA + '</div>' +
      '<div class="arminha-cel arminha-digito" id="arminha-a-uni">' + uniA + '</div>' +

      // Linha 3: Operador + Segundo Número (numB)
      '<div class="arminha-cel arminha-operador">' + simbolo + '</div>' +
      '<div class="arminha-cel arminha-digito" id="arminha-b-dez">' + dezB + '</div>' +
      '<div class="arminha-cel arminha-digito" id="arminha-b-uni">' + uniB + '</div>' +

      // Linha 4: Traço horizontal da Arminha
      '<div class="arminha-traco"></div>' +

      // Linha 5: Slot onde o display de resposta é posicionado abaixo do traço
      '<div class="arminha-slot-resposta" id="arminha-slot-resposta">' +
      '<div class="arminha-parcial-guia oculto" id="arminha-parcial-guia">' +
      '<span class="parcial-dez" id="arminha-res-dez"></span>' +
      '<span class="parcial-uni" id="arminha-res-uni"></span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    var slotResposta = document.getElementById('arminha-slot-resposta');
    if (elDisplayResposta && slotResposta) {
      elDisplayResposta.classList.add('display-arminha-resultado');
      slotResposta.appendChild(elDisplayResposta);
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
    var parcial = document.getElementById('arminha-parcial-guia');

    if (hlDez) hlDez.className = 'arminha-col-bg col-bg-dez';
    if (hlUni) hlUni.className = 'arminha-col-bg col-bg-uni';
    if (carryDez) carryDez.innerHTML = '';
    if (carryUni) carryUni.innerHTML = '';
    if (aDez) aDez.classList.remove('digito-riscado');
    if (aUni) aUni.classList.remove('digito-destaque-emprestimo');
    if (parcial) {
      parcial.classList.add('oculto');
      var rD = document.getElementById('arminha-res-dez');
      var rU = document.getElementById('arminha-res-uni');
      if (rD) rD.textContent = '';
      if (rU) rU.textContent = '';
    }
  }

  /**
   * Constrói os passos didáticos estilo Duolingo para Adição e Subtração na Arminha
   */
  function construirPassosArminha(numA, numB, operacao) {
    var ehSub = (operacao === 'subtracao' || operacao === '-' || operacao === '−');
    var dezA = Math.floor(numA / 10);
    var uniA = numA % 10;
    var dezB = Math.floor(numB / 10);
    var uniB = numB % 10;
    var temDezenas = (numA >= 10 || numB >= 10 || (!ehSub && (numA + numB) >= 10));

    var passos = [];

    if (!ehSub) {
      // ADIÇÃO
      var somaUni = uniA + uniB;
      var vaiUm = somaUni >= 10 ? 1 : 0;
      var digitoUniFinal = somaUni % 10;
      var somaDezFinal = dezA + dezB + vaiUm;

      if (!temDezenas) {
        passos.push({
          coluna: 'uni',
          titulo: 'Passo Único • Unidades',
          fala: '🦉 <strong>Vamos somar as unidades!</strong> Junte <strong>' + uniA + ' + ' + uniB + ' = ' + somaUni + '</strong>.',
          resUni: String(somaUni),
          resDez: ''
        });
      } else if (vaiUm === 0) {
        passos.push({
          coluna: 'uni',
          titulo: 'Passo 1 de 2 • Coluna das Unidades (U)',
          fala: '🦉 <strong>Vamos começar pelas unidades!</strong> Quanto é <strong>' + uniA + ' + ' + uniB + '</strong>? Isso mesmo, dá <strong>' + digitoUniFinal + '</strong>!',
          resUni: String(digitoUniFinal),
          resDez: '?'
        });
        passos.push({
          coluna: 'dez',
          titulo: 'Passo 2 de 2 • Coluna das Dezenas (D)',
          fala: '✨ <strong>Agora as dezenas!</strong> Some <strong>' + dezA + ' + ' + dezB + ' = ' + somaDezFinal + '</strong>. Juntando tudo, temos <strong>' + (numA + numB) + '</strong>!',
          resUni: String(digitoUniFinal),
          resDez: String(somaDezFinal)
        });
      } else {
        // Adição com "Vai Um" (Carry-Over)
        passos.push({
          coluna: 'uni',
          titulo: 'Passo 1 de 3 • Coluna das Unidades (U)',
          fala: '🦉 <strong>Vamos começar pelas unidades!</strong> Olhe para o <strong>' + uniA + ' + ' + uniB + '</strong>: dá <strong>' + somaUni + '</strong> (passou de 9!).',
          resUni: '?',
          resDez: ''
        });
        passos.push({
          coluna: 'uni',
          vaiUm: true,
          titulo: 'Passo 2 de 3 • Vai 1 para a Dezena!',
          fala: '💡 Como <strong>' + uniA + ' + ' + uniB + ' = ' + somaUni + '</strong>, deixamos o <strong>' + digitoUniFinal + '</strong> nas unidades e <strong>subimos +1</strong> para o vizinho das dezenas!',
          resUni: String(digitoUniFinal),
          resDez: '?'
        });
        passos.push({
          coluna: 'dez',
          vaiUm: true,
          titulo: 'Passo 3 de 3 • Coluna das Dezenas (D)',
          fala: '🎯 <strong>Agora some as dezenas com o +1 que subiu:</strong> <strong>1 + ' + dezA + ' + ' + dezB + ' = ' + somaDezFinal + '</strong>! Resultado: <strong>' + (numA + numB) + '</strong>!',
          resUni: String(digitoUniFinal),
          resDez: String(somaDezFinal)
        });
      }
    } else {
      // SUBTRAÇÃO
      // Regra do 19: empréstimo com vizinho só faz sentido didático a partir de 20
      var precisaEmprestimo = (numA >= 20) && (uniA < uniB);

      if (numA <= 19) {
        // Até 19: Fato fundamental da base 10 (evita o loop circular 10 - 4 = 10 - 4)
        passos.push({
          coluna: 'uni',
          titulo: 'Fato Fundamental • Contagem até 19',
          fala: '🦉 <strong>De 10 a 19:</strong> Pense em completar 10! Tirando <strong>' + numB + '</strong> de <strong>' + numA + '</strong>, ficamos com <strong>' + (numA - numB) + '</strong>.',
          resUni: String(numA - numB),
          resDez: ''
        });
      } else if (!precisaEmprestimo) {
        // De 20 para cima, sem necessidade de empréstimo
        var difUni = uniA - uniB;
        var difDez = dezA - dezB;
        passos.push({
          coluna: 'uni',
          titulo: 'Passo 1 de 2 • Coluna das Unidades (U)',
          fala: '🦉 <strong>Vamos começar pelas unidades!</strong> Faça <strong>' + uniA + ' − ' + uniB + ' = ' + difUni + '</strong>.',
          resUni: String(difUni),
          resDez: '?'
        });
        passos.push({
          coluna: 'dez',
          titulo: 'Passo 2 de 2 • Coluna das Dezenas (D)',
          fala: '✨ <strong>Agora a coluna das dezenas!</strong> Faça <strong>' + dezA + ' − ' + dezB + ' = ' + difDez + '</strong>. O resultado é <strong>' + (numA - numB) + '</strong>!',
          resUni: String(difUni),
          resDez: difDez > 0 ? String(difDez) : ''
        });
      } else {
        // De 20 para cima com Empréstimo Real (o vizinho de fato tem dezenas sobrando)
        var dezAposEmprestimo = dezA - 1;
        var uniComEmprestimo = uniA + 10;
        var difUniEmp = uniComEmprestimo - uniB;
        var difDezEmp = dezAposEmprestimo - dezB;

        passos.push({
          coluna: 'uni',
          titulo: 'Passo 1 de 3 • Olhe as Unidades (U)',
          fala: '🦉 <strong>Vamos começar pelas unidades!</strong> Note que <strong>' + uniA + '</strong> é menor que <strong>' + uniB + '</strong>. Vamos pedir ajuda ao vizinho da frente!',
          resUni: '?',
          resDez: ''
        });
        passos.push({
          coluna: 'uni',
          emprestimo: true,
          dezRestante: dezAposEmprestimo,
          uniNova: uniComEmprestimo,
          titulo: 'Passo 2 de 3 • Pedindo Emprestado ao Vizinho!',
          fala: '💡 <strong>O ' + dezA + ' empresta 1 dezena!</strong> Ele vira <strong>' + dezAposEmprestimo + '</strong> e o <strong>' + uniA + '</strong> vira <strong>' + uniComEmprestimo + '</strong>. Agora: <strong>' + uniComEmprestimo + ' − ' + uniB + ' = ' + difUniEmp + '</strong>!',
          resUni: String(difUniEmp),
          resDez: '?'
        });
        passos.push({
          coluna: 'dez',
          emprestimo: true,
          dezRestante: dezAposEmprestimo,
          uniNova: uniComEmprestimo,
          titulo: 'Passo 3 de 3 • Coluna das Dezenas (D)',
          fala: '🎯 <strong>Agora resolva as dezenas que sobraram:</strong> <strong>' + dezAposEmprestimo + ' − ' + dezB + ' = ' + difDezEmp + '</strong>. Resposta final: <strong>' + (numA - numB) + '</strong>!',
          resUni: String(difUniEmp),
          resDez: difDezEmp > 0 ? String(difDezEmp) : '0'
        });
      }
    }

    return passos;
  }

  /**
   * Aplica no DOM da Arminha e no Balão do Mascote o estado do passo selecionado
   */
  function aplicarPassoArminha(indice, containerAjuda) {
    pararTimerGuia();
    var lista = estadoGuiaM6.passos;
    if (!lista || !lista.length) return;

    var idx = Math.max(0, Math.min(indice, lista.length - 1));
    estadoGuiaM6.passoAtual = idx;
    var p = lista[idx];

    limparDestaquesArminha();

    var hlDez = document.getElementById('arminha-hl-dez');
    var hlUni = document.getElementById('arminha-hl-uni');
    var carryDez = document.getElementById('arminha-carry-dez');
    var carryUni = document.getElementById('arminha-carry-uni');
    var aDez = document.getElementById('arminha-a-dez');
    var aUni = document.getElementById('arminha-a-uni');

    // 1. Aplica o Highlight Neon na coluna ativa (U ou D)
    if (p.coluna === 'uni' && hlUni) {
      hlUni.classList.add('arminha-col-ativa-neon');
    } else if (p.coluna === 'dez' && hlDez) {
      hlDez.classList.add('arminha-col-ativa-neon');
    }

    // 2. Exibe o badge de "Vai 1" se o passo tiver reagrupamento de adição
    if (p.vaiUm && carryDez) {
      carryDez.innerHTML = '<span class="badge-arminha-carry">+1</span>';
    }

    // 3. Exibe o corte de empréstimo se o passo tiver reagrupamento de subtração
    if (p.emprestimo) {
      if (aDez) aDez.classList.add('digito-riscado');
      if (aUni) aUni.classList.add('digito-destaque-emprestimo');
      if (carryDez) {
        carryDez.innerHTML = '<span class="badge-arminha-emprestimo-dez">' + p.dezRestante + '</span>';
      }
      if (carryUni) {
        carryUni.innerHTML = '<span class="badge-arminha-emprestimo-uni">' + p.uniNova + '</span>';
      }
    }

    // 4. Atualiza a fala do Mascote estilo Duolingo
    if (window.Mascotes && typeof window.Mascotes.falarTextoDireto === 'function') {
      window.Mascotes.falarTextoDireto(p.fala, true);
    }

    // 5. Atualiza o painel interativo de controle de passos em #container-ajuda-visual
    if (containerAjuda) {
      var tituloEl = containerAjuda.querySelector('#guia-m6-titulo');
      var textoEl = containerAjuda.querySelector('#guia-m6-texto');
      var btnAnt = containerAjuda.querySelector('#guia-m6-btn-ant');
      var btnProx = containerAjuda.querySelector('#guia-m6-btn-prox');
      var dots = containerAjuda.querySelectorAll('.guia-step-dot');

      if (tituloEl) tituloEl.textContent = p.titulo;
      if (textoEl) {
        var resumoColuna = p.resDez
          ? ('Dezena: <strong>' + p.resDez + '</strong> | Unidade: <strong>' + p.resUni + '</strong>')
          : ('Unidade calculada: <strong>' + p.resUni + '</strong>');
        textoEl.innerHTML = resumoColuna;
      }

      if (btnAnt) btnAnt.disabled = (idx === 0);
      if (btnProx) {
        btnProx.textContent = (idx < lista.length - 1) ? 'Próximo passo ➔' : 'Rever 1º passo ↺';
      }

      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('ativo', d === idx);
      }
    }

    // Avança automaticamente para o próximo passo após 3,2s se ainda não estiver no último
    if (idx < lista.length - 1) {
      estadoGuiaM6.timerPasso = setTimeout(function () {
        aplicarPassoArminha(idx + 1, containerAjuda);
      }, 3200);
    }
  }

  /**
   * Inicia o Guia Passo a Passo Estilo Duolingo dentro do container de ajuda visual
   */
  function iniciarGuiaArminha(numA, numB, operacao, container) {
    pararTimerGuia();
    var passos = construirPassosArminha(numA, numB, operacao);
    estadoGuiaM6.passos = passos;
    estadoGuiaM6.passoAtual = 0;

    var barraPassos = document.createElement('div');
    barraPassos.className = 'guia-duolingo-box';

    var dotsHtml = '';
    for (var i = 0; i < passos.length; i++) {
      dotsHtml += '<span class="guia-step-dot' + (i === 0 ? ' ativo' : '') + '" data-step="' + i + '"></span>';
    }

    barraPassos.innerHTML =
      '<div class="guia-duolingo-topo">' +
      '<span class="guia-duolingo-badge" id="guia-m6-titulo">' + passos[0].titulo + '</span>' +
      '<div class="guia-duolingo-dots">' + dotsHtml + '</div>' +
      '</div>' +
      '<div class="guia-duolingo-corpo">' +
      '<div class="guia-duolingo-resumo" id="guia-m6-texto"></div>' +
      '<div class="guia-duolingo-acoes">' +
      '<button type="button" class="btn-guia-step" id="guia-m6-btn-ant">◀</button>' +
      '<button type="button" class="btn-guia-step btn-guia-destaque" id="guia-m6-btn-prox">Próximo passo ➔</button>' +
      '</div>' +
      '</div>';

    // Insere no topo do container de ajuda visual
    container.insertBefore(barraPassos, container.firstChild);

    var btnAnt = barraPassos.querySelector('#guia-m6-btn-ant');
    var btnProx = barraPassos.querySelector('#guia-m6-btn-prox');
    var dots = barraPassos.querySelectorAll('.guia-step-dot');

    if (btnAnt) {
      btnAnt.addEventListener('click', function () {
        if (estadoGuiaM6.passoAtual > 0) {
          aplicarPassoArminha(estadoGuiaM6.passoAtual - 1, container);
        }
      });
    }

    if (btnProx) {
      btnProx.addEventListener('click', function () {
        var proxIndice = (estadoGuiaM6.passoAtual + 1) % estadoGuiaM6.passos.length;
        aplicarPassoArminha(proxIndice, container);
      });
    }

    for (var j = 0; j < dots.length; j++) {
      (function (indiceDot) {
        dots[indiceDot].addEventListener('click', function () {
          aplicarPassoArminha(indiceDot, container);
        });
      })(j);
    }

    aplicarPassoArminha(0, container);
  }

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
   * No Modo Treino (M6): aciona o Guia Passo a Passo por colunas estilo Duolingo + apoio visual.
   * No Modo Desafio: exibe a decomposição rápida.
   */
  function ajudaAdicao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;
    var modoNormalizado = String(modo || 'treino').toLowerCase();

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
      textoDica = 'Por colunas: Unidades <strong>(' + uniA + '+' + uniB + ')</strong> e Dezenas <strong>(' + dezA + '+' + dezB + ')</strong>';
    } else {
      var cA = numA > 5 ? '[5+' + (numA - 5) + ']' : String(numA);
      var cB = numB > 5 ? '[5+' + (numB - 5) + ']' : String(numB);
      textoDica = 'Conte as bolinhas: <strong>' + cA + ' + ' + cB + '</strong>';
    }

    // Desenha bolinhas apenas quando a soma for compacta (<= 25) para não poluir com o guia da Arminha
    if (numA + numB <= 25) {
      var dicaEl = document.createElement('div');
      dicaEl.className = 'visual-dica-texto';
      dicaEl.innerHTML = textoDica;
      wrapper.appendChild(dicaEl);

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
    } else if (modoNormalizado === 'desafio') {
      var dicaDesafio = document.createElement('div');
      dicaDesafio.className = 'visual-dica-texto';
      dicaDesafio.innerHTML = textoDica;
      wrapper.appendChild(dicaDesafio);
    }

    container.appendChild(wrapper);

    // M6: No Modo Treino, inicia o passo a passo guiado na Arminha com o Mascote
    if (modoNormalizado === 'treino') {
      iniciarGuiaArminha(numA, numB, 'adicao', container);
    }
  }

  /**
   * 2. AJUDA DE SUBTRAÇÃO:
   * No Modo Treino (M6): aciona o Guia Passo a Passo por colunas (com empréstimo visual se necessário).
   * Para contas pequenas, exibe também as bolinhas subtraídas.
   */
  function ajudaSubtracao(a, b, modo, container) {
    if (!container) return;
    container.innerHTML = '';

    var numA = Number(a) || 0;
    var numB = Number(b) || 0;
    var restantes = Math.max(0, numA - numB);
    var modoNormalizado = String(modo || 'treino').toLowerCase();

    var wrapper = document.createElement('div');
    wrapper.className = 'visual-box visual-subtracao';

    if (numA <= 25) {
      var dicaEl = document.createElement('div');
      dicaEl.className = 'visual-dica-texto';
      dicaEl.innerHTML = 'Total de <strong>' + numA + '</strong>: tirando <span class="hl-removido">' + numB + '</span>, conte as acesas!';
      wrapper.appendChild(dicaEl);

      var gradeCinco = document.createElement('div');
      gradeCinco.className = 'domino-termo';

      for (var bloco = 0; bloco < Math.ceil(numA / 5); bloco++) {
        var cardCinco = document.createElement('div');
        cardCinco.className = 'domino-card-5';

        var inicio = bloco * 5;
        var fim = Math.min(inicio + 5, numA);

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
    } else if (modoNormalizado === 'desafio') {
      var dicaSub = document.createElement('div');
      dicaSub.className = 'visual-dica-texto';
      var uA = numA % 10;
      var uB = numB % 10;
      if (numA >= 20 && uA < uB) {
        dicaSub.innerHTML = 'Empréstimo: <strong>' + (uA + 10) + ' − ' + uB + ' = ' + (uA + 10 - uB) + '</strong> nas unidades!';
      } else {
        dicaSub.innerHTML = 'Unidades: <strong>' + uA + ' − ' + uB + ' = ' + (uA - uB) + '</strong> | Dezenas: <strong>' + Math.floor(numA / 10) + ' − ' + Math.floor(numB / 10) + '</strong>';
      }
      wrapper.appendChild(dicaSub);
    }

    container.appendChild(wrapper);

    // M6: No Modo Treino, inicia o passo a passo guiado na Arminha com o Mascote
    if (modoNormalizado === 'treino') {
      iniciarGuiaArminha(numA, numB, 'subtracao', container);
    }
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
    pararTimerGuia();
    limparDestaquesArminha();
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
    limparDestaquesArminha: limparDestaquesArminha,
    renderizarContaNoPalco: renderizarContaNoPalco,
    renderizarAjuda: renderizarAjuda
  };
})();