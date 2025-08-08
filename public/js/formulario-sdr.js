// js/formulario-sdr.js

document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  const form = document.getElementById("feedbackForm");
  const tbody = document.getElementById("criterios");
  const tbodyLigacoes = document.getElementById("tbody-ligacoes");
  const btnAddTipo = document.getElementById("addTipoLigacao");
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");

  // Bloco de ligações (array controlado)
  let ligacoesArray = [
    { tipo: "Fixo", porcentagem: "", totalChamadas: "", tempoTotal: "", valorTotal: "" },
    { tipo: "Móvel", porcentagem: "", totalChamadas: "", tempoTotal: "", valorTotal: "" }
  ];

  // Critérios padrão do SDR
  const criteriosNomes = [
    "1 - Identificação de perfil (PIT)",
    "2 - Abertura e Rapport",
    "3 - Apresentação de valor",
    "4 - Convocação do analista fiscal",
    "5 - Gestão de objeções",
    "6 - Próximo passo definido",
    "7 - Tom e linguagem",
    "8 - Abordagem de Vendas",
    "9 - Técnica no agendamento",
    "10 - Efetividade",
    "11 - Cordialidade e Relacionamento",
    "12 - Prova social",
    "13 - Qualificação de Leads",
    "14 - Tempo de Resposta"
  ];

  // Renderiza tabela de ligações
  function renderizaLigacoes() {
    tbodyLigacoes.innerHTML = "";
    ligacoesArray.forEach((item, idx) => {
      const isTotal = item.tipo === "Total";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          ${isTotal ? "<b>Total</b>" : `<input type="text" class="input-tipo" data-idx="${idx}" value="${item.tipo}">`}
        </td>
        <td><input type="number" min="0" max="100" class="input-porcentagem" data-idx="${idx}" value="${item.porcentagem}" ${isTotal ? "readonly" : ""}></td>
        <td><input type="number" min="0" class="input-chamadas" data-idx="${idx}" value="${item.totalChamadas}" ${isTotal ? "readonly" : ""}></td>
        <td><input type="text" class="input-tempo" data-idx="${idx}" value="${item.tempoTotal}" ${isTotal ? "readonly" : ""}></td>
        <td><input type="text" class="input-valor" data-idx="${idx}" value="${item.valorTotal}" ${isTotal ? "readonly" : ""}></td>
        <td>
          ${!isTotal && ligacoesArray.length > 2 ? `<button type="button" class="btn-remove-ligacao" data-idx="${idx}">Remover</button>` : ""}
        </td>
      `;
      tbodyLigacoes.appendChild(tr);
    });
  }

  function atualizarTotalLigacoes() {
    ligacoesArray = ligacoesArray.filter(item => item.tipo !== "Total");
    let somaPorcentagem = 0, somaChamadas = 0;
    let tempos = [], valores = [];
    ligacoesArray.forEach(item => {
      somaPorcentagem += parseFloat(item.porcentagem) || 0;
      somaChamadas += parseInt(item.totalChamadas) || 0;
      tempos.push(item.tempoTotal || "0");
      valores.push(item.valorTotal || "R$ 0");
    });
    function somarTemposArr(arr) {
      let min = 0;
      arr.forEach(t => { min += parseInt(t) || 0; });
      return `${min} min`;
    }
    function somarValoresArr(arr) {
      let tot = 0;
      arr.forEach(v => {
        let n = parseFloat((v || "0").replace(/[^\d,]/g, '').replace(',', '.'));
        tot += n || 0;
      });
      return `R$ ${tot.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    }
    ligacoesArray.push({
      tipo: "Total",
      porcentagem: somaPorcentagem,
      totalChamadas: somaChamadas,
      tempoTotal: somarTemposArr(tempos),
      valorTotal: somarValoresArr(valores)
    });
  }

  function syncLigacoesInputsToArray() {
    document.querySelectorAll('.input-tipo').forEach(input => {
      const idx = +input.dataset.idx;
      ligacoesArray[idx].tipo = input.value;
    });
    document.querySelectorAll('.input-porcentagem').forEach(input => {
      const idx = +input.dataset.idx;
      ligacoesArray[idx].porcentagem = input.value;
    });
    document.querySelectorAll('.input-chamadas').forEach(input => {
      const idx = +input.dataset.idx;
      ligacoesArray[idx].totalChamadas = input.value;
    });
    document.querySelectorAll('.input-tempo').forEach(input => {
      const idx = +input.dataset.idx;
      ligacoesArray[idx].tempoTotal = input.value;
    });
    document.querySelectorAll('.input-valor').forEach(input => {
      const idx = +input.dataset.idx;
      ligacoesArray[idx].valorTotal = input.value;
    });
    atualizarTotalLigacoes();
    renderizaLigacoes();
  }

  // Eventos de blur
  tbodyLigacoes.addEventListener('blur', function(e) {
    if (
      e.target.classList.contains('input-tipo') ||
      e.target.classList.contains('input-porcentagem') ||
      e.target.classList.contains('input-chamadas') ||
      e.target.classList.contains('input-tempo') ||
      e.target.classList.contains('input-valor')
    ) {
      syncLigacoesInputsToArray();
    }
  }, true);

  // Adicionar novo tipo de ligação
  btnAddTipo.addEventListener('click', () => {
    ligacoesArray.splice(ligacoesArray.length-1, 0, { tipo:"Novo", porcentagem:"", totalChamadas:"", tempoTotal:"", valorTotal:"" });
    renderizaLigacoes();
  });

  // Remover tipo de ligação
  tbodyLigacoes.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remove-ligacao')) {
      const idx = +e.target.dataset.idx;
      ligacoesArray.splice(idx, 1);
      renderizaLigacoes();
    }
  });

  // Inicializa blocos na primeira carga
  atualizarTotalLigacoes();
  renderizaLigacoes();

  // Renderiza linhas para os critérios
  function renderizaCriterios() {
    tbody.innerHTML = "";
    criteriosNomes.forEach((nome, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${nome}</strong></td>
        <td>
          <select name="criterio-avaliacao-${idx}" required>
            <option value="">Selecione</option>
            <option value="✔️ OK">✔️ OK</option>
            <option value="⚠️ Parcial">⚠️ Parcial</option>
            <option value="❌ Faltou">❌ Faltou</option>
            <option value="❎ Anulada">❎ Anulada</option>
          </select>
        </td>
        <td>
          <textarea name="criterio-observacao-${idx}" rows="2" required></textarea>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderizaCriterios();

  // Submissão do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.querySelector("button[type=submit]").disabled = true;

    // Monta o objeto criterios como array
    const criterios = criteriosNomes.map((nome, idx) => ({
      nome,
      avaliacao: form[`criterio-avaliacao-${idx}`].value,
      observacao: form[`criterio-observacao-${idx}`].value
    }));

    // Calcula resumo de notas (Anulada não tem peso!)
    const contagem = {
      "✔️ OK": 0,
      "⚠️ Parcial": 0,
      "❌ Faltou": 0,
      "❎ Anulada": 0
    };
    criterios.forEach(c => contagem[c.avaliacao]++);
    const totalValidos = criterios.filter(c => c.avaliacao !== "❎ Anulada").length;
    const notaFinal = totalValidos > 0
      ? ((contagem["✔️ OK"] * 1 + contagem["⚠️ Parcial"] * 0.6) / totalValidos * 10)
      : 0;

    const resumoCriterios = {
      ok: contagem["✔️ OK"],
      parcial: contagem["⚠️ Parcial"],
      faltou: contagem["❌ Faltou"],
      anulada: contagem["❎ Anulada"],
      percentOk: totalValidos > 0 ? ((contagem["✔️ OK"] / totalValidos) * 100).toFixed(1) : "0.0",
      percentParcial: totalValidos > 0 ? ((contagem["⚠️ Parcial"] / totalValidos) * 100).toFixed(1) : "0.0",
      percentFaltou: totalValidos > 0 ? ((contagem["❌ Faltou"] / totalValidos) * 100).toFixed(1) : "0.0",
      percentAnulada: ((contagem["❎ Anulada"] / criterios.length) * 100).toFixed(1),
      total: criterios.length
    };

    const ligacoesQualificadas = ligacoesArray.slice();
    const periodo_inicio = form.periodo_inicio.value;
    const periodo_fim = form.periodo_fim.value;

    // Validação de semana (máx 7 dias)
    const dtInicio = new Date(periodo_inicio);
    const dtFim = new Date(periodo_fim);
    const diffDias = (dtFim - dtInicio) / (1000 * 60 * 60 * 24);
    if (diffDias > 7) {
      alert("O período avaliado deve ter no máximo 7 dias.");
      form.querySelector("button[type=submit]").disabled = false;
      return;
    }

    const periodo_mes = periodo_inicio.slice(0,7);
    const periodo_ano = periodo_inicio.slice(0,4);

    // Previne duplicidade para novo (não em edição)
    if (!editId) {
      const existente = await db.collection("avaliacoes")
        .where("agente", "==", form.agente.value)
        .where("periodo_inicio", "==", periodo_inicio)
        .get();
      if (!existente.empty) {
        alert("Já existe uma avaliação para esse agente nesse período.");
        form.querySelector("button[type=submit]").disabled = false;
        return;
      }
    }

    // Monta dados do formulário
    const dados = {
      agente: form.agente.value,
      funcao: "SDR",
      periodo_inicio,      // string YYYY-MM-DD
      periodo_fim,         // string YYYY-MM-DD
      periodo_mes,         // string YYYY-MM
      periodo_ano,         // string YYYY
      periodo: `${periodo_inicio.split('-').reverse().join('/')} - ${periodo_fim.split('-').reverse().join('/')}`,
      campanha: form.campanha.value,
      protocolo: form.protocolo.value,
      numero: form.numero.value,
      datalig: form.datalig.value,
      qualif: form.qualif.value,
      ligacoesQualificadas,
      criterios,
      nota: form.nota.value,
      notaFinal,
      resumoCriterios
    };

    try {
      if (editId) {
        // Busca o documento original para manter o createdAt
        const docRef = db.collection("avaliacoes").doc(editId);
        const docSnap = await docRef.get();
        let createdAt = docSnap.exists && docSnap.data().createdAt
          ? docSnap.data().createdAt
          : new Date().toISOString();
        dados.createdAt = createdAt; // Preserva o createdAt SEMPRE!
        dados.updatedAt = new Date().toISOString();
        await docRef.set(dados, { merge: true });
        alert("Edição salva com sucesso!");
      } else {
        // Criação nova (usa o protocolo como ID)
        dados.createdAt = new Date().toISOString();
        await db.collection("avaliacoes").doc(dados.protocolo).set(dados);
        alert("Cadastro realizado com sucesso!");
      }
      window.location.href = `relatorio.html?id=${dados.protocolo}`;
    } catch (err) {
      alert("Erro ao salvar no Firebase: " + (err.message || err));
    } finally {
      form.querySelector("button[type=submit]").disabled = false;
    }
  });

  // Preenchimento do formulário para edição
  if (editId) {
    form.protocolo.readOnly = true;
    db.collection("avaliacoes").doc(editId).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();

        // Preenche campos simples
        form.agente.value = data.agente || "";
        form.periodo_inicio.value = data.periodo_inicio || "";
        form.periodo_fim.value = data.periodo_fim || "";
        form.campanha.value = data.campanha || "";
        form.protocolo.value = data.protocolo || "";
        form.numero.value = data.numero || "";
        form.datalig.value = data.datalig ? data.datalig.slice(0,16) : "";
        form.qualif.value = data.qualif || "";
        form.nota.value = data.nota || "";

        // Preenche totais ligações qualificadas
        if (Array.isArray(data.ligacoesQualificadas)) {
          ligacoesArray = data.ligacoesQualificadas.map(l => ({...l}));
          atualizarTotalLigacoes();
          renderizaLigacoes();
        }

        // Preenche critérios
        if (Array.isArray(data.criterios)) {
          renderizaCriterios();
          data.criterios.forEach((c, idx) => {
            const sel = form[`criterio-avaliacao-${idx}`];
            const txt = form[`criterio-observacao-${idx}`];
            if (sel) sel.value = c.avaliacao || "";
            if (txt) txt.value = c.observacao || "";
          });
        }

        // Troca texto do botão
        form.querySelector("button[type=submit]").textContent = "Salvar Edição";
      } else {
        alert("Protocolo não encontrado!");
        window.location.href = "index.html";
      }
    });
  }
});