// js/formulario-consultor.js
document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  const form = document.getElementById("feedbackForm");
  const criteriosContainer = document.getElementById("criterios");
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");

  const criteriosDefinicao = [
    { bloco: "HABILIDADES DE COMUNICAÇÃO", numero: 1, pergunta: "Demonstrou clareza e objetividade ao explicar os benefícios do produto?", peso: 0.5294 },
    { bloco: "HABILIDADES DE COMUNICAÇÃO", numero: 2, pergunta: "Escutou ativamente as necessidades e preocupações do cliente?", peso: 0.5294 },
    { bloco: "HABILIDADES DE COMUNICAÇÃO", numero: 3, pergunta: "Manteve uma postura profissional e amigável durante toda a interação?", peso: 0.5294 },
    { bloco: "HABILIDADES DE COMUNICAÇÃO", numero: 4, pergunta: "Utilizou uma linguagem adequada e sem jargões técnicos desnecessários?", peso: 0.5294 },
    { bloco: "HABILIDADES DE COMUNICAÇÃO", numero: 5, pergunta: "Foi capaz de responder às perguntas dos clientes de maneira eficaz?", peso: 0.5294 },

    { bloco: "CONHECIMENTO DO PRODUTO", numero: 6, pergunta: "Demonstrou conhecimento profundo sobre as funcionalidades do SITTAX?", peso: 0.5294 },
    { bloco: "CONHECIMENTO DO PRODUTO", numero: 7, pergunta: "Foi capaz de relacionar o produto às necessidades específicas do cliente?", peso: 0.5294 },
    { bloco: "CONHECIMENTO DO PRODUTO", numero: 8, pergunta: "Apresentou o produto de maneira estruturada e lógica?", peso: 0.5294 },
    { bloco: "CONHECIMENTO DO PRODUTO", numero: 9, pergunta: "Destacou os diferenciais competitivos do SITTAX em relação a outros produtos no mercado?", peso: 0.5294 },

    { bloco: "VENDAS", numero: 10, pergunta: "Aplicou corretamente técnicas de spin selling durante a apresentação?", peso: 0.8824 },
    { bloco: "VENDAS", numero: 11, pergunta: "Seguiu o funil de vendas de maneira eficaz?", peso: 0.8824 },
    { bloco: "VENDAS", numero: 12, pergunta: "Utilizou técnicas de fechamento de vendas adequadas para o contexto?", peso: 0.8824 },
    { bloco: "VENDAS", numero: 13, pergunta: "Conseguiu identificar e superar objeções dos clientes de forma eficiente?", peso: 0.8824 },

    { bloco: "TABULAÇÃO", numero: 14, pergunta: "Preenchimento do portal de contratos conforme critérios exigidos?", peso: 0.3530 },
    { bloco: "TABULAÇÃO", numero: 15, pergunta: "Salvou a gravação na pasta correta/TL;DV e vinculou o resumo da atividade no PipeDrive?", peso: 0.3530 },

    { bloco: "NCG - Gravíssimos", numero: 16, pergunta: "Risco de prejuízo financeiro?", peso: 0.2 },
    { bloco: "NCG - Gravíssimos", numero: 17, pergunta: "Rispidez durante o atendimento?", peso: 0.2 },
    { bloco: "NCG - Gravíssimos", numero: 18, pergunta: "Oferta indevida de planos inexistentes/descontos sem formalização?", peso: 0.2 },
    { bloco: "NCG - Gravíssimos", numero: 19, pergunta: "Ética (denegrir concorrência/promessas irreais)?", peso: 0.2 },
    { bloco: "NCG - Gravíssimos", numero: 20, pergunta: "Finalização/abandono da ligação/falta de interação/TL;DV sem gravação?", peso: 0.2 }
  ];

  function montaTabela() {
    const container = document.getElementById("criterios");
    container.innerHTML = "";

    const blocos = [
      {
        titulo: "HABILIDADES DE COMUNICAÇÃO",
        itens: criteriosDefinicao.filter(c => c.bloco === "HABILIDADES DE COMUNICAÇÃO")
      },
      {
        titulo: "CONHECIMENTO DO PRODUTO",
        itens: criteriosDefinicao.filter(c => c.bloco === "CONHECIMENTO DO PRODUTO")
      },
      {
        titulo: "VENDAS",
        itens: criteriosDefinicao.filter(c => c.bloco === "VENDAS")
      },
      {
        titulo: "TABULAÇÃO",
        itens: criteriosDefinicao.filter(c => c.bloco === "TABULAÇÃO")
      },
      {
        titulo: "NCG - Gravíssimos",
        itens: criteriosDefinicao.filter(c => c.bloco === "NCG - Gravíssimos")
      }
    ];

    let globalIdx = 0; // contador unificado para name=status-{n}
    blocos.forEach(bloco => {
      const h3 = document.createElement("h3");
      h3.textContent = bloco.titulo;
      h3.style.marginTop = "16px";
      container.appendChild(h3);

      const table = document.createElement("table");
      table.className = "tabela-criterios";
      table.innerHTML = `
        <colgroup>
          <col style="width:3%;">
          <col style="width:23%;">
          <col style="width:8%;">
          <col style="width:15%;">
          <col style="width:auto;">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Questão</th>
            <th>Peso</th>
            <th>Status</th>
            <th>OBS</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector("tbody");

      bloco.itens.forEach(c => {
        const idx = globalIdx;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.numero}</td>
          <td><strong>${c.pergunta}</strong></td>
          <td>${c.peso}</td>
          <td>
            <select name="status-${idx}" required>
              <option value="">Selecione</option>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Não se Aplica">Não se Aplica</option>
            </select>
          </td>
          <td>
            <textarea name="obs-${idx}" rows="3" placeholder="Observações"></textarea>
          </td>
        `;
        tbody.appendChild(tr);
        globalIdx += 1;
      });

      container.appendChild(table);
    });
  }

  montaTabela();

  function calculaNotaConsultor(criterios) {
    // se qualquer gravíssimo estiver “Não Conforme”, zera o bloco inteiro
    const temGravissimoNaoConforme = criterios
      .filter(c => c.bloco === "NCG - Gravíssimos")
      .some(c => c.status === "Não Conforme");
    if (temGravissimoNaoConforme) return 0;

    let somaPesosValidos = 0;
    let pontosObtidos = 0;

    criterios.forEach(c => {
      if (c.status === "Não se Aplica") return;
      somaPesosValidos += c.peso;
      if (c.status === "Conforme") {
        pontosObtidos += c.peso;
      }
    });

    if (somaPesosValidos === 0) return 0;
    return (pontosObtidos / somaPesosValidos) * 10;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.querySelector("button[type=submit]").disabled = true;

    const agente = form.agente ? form.agente.value : "";
    const funcao = "Closer";
    const periodo_inicio = form.periodo_inicio ? form.periodo_inicio.value : "";
    const periodo_fim = form.periodo_fim ? form.periodo_fim.value : "";

    if (!agente || !periodo_inicio || !periodo_fim) {
      alert("Preencha os campos obrigatórios.");
      form.querySelector("button[type=submit]").disabled = false;
      return;
    }

    const dtInicio = new Date(periodo_inicio);
    const dtFim = new Date(periodo_fim);
    if (dtFim < dtInicio) {
      alert("Período inválido: fim anterior ao início.");
      form.querySelector("button[type=submit]").disabled = false;
      return;
    }
    const diffDias = (dtFim - dtInicio) / (1000 * 60 * 60 * 24);
    if (diffDias > 7) {
      alert("O período avaliado deve ter no máximo 7 dias.");
      form.querySelector("button[type=submit]").disabled = false;
      return;
    }

    const periodo_mes = periodo_inicio.slice(0,7);
    const periodo_ano = periodo_inicio.slice(0,4);
    const periodo = `${periodo_inicio.split('-').reverse().join('/')} - ${periodo_fim.split('-').reverse().join('/')}`;
    const protocolo = form.protocolo ? form.protocolo.value : "";
    const datalig = form.datalig ? form.datalig.value : "";
    const link_tldv = form.link_tldv ? form.link_tldv.value : "";
    const link_pipe = form.link_pipe ? form.link_pipe.value : "";
    const recomendacoes = form.recomendacoes ? form.recomendacoes.value : "";
    const plano_acao = form.plano_acao ? form.plano_acao.value : "";

    const criterios = criteriosDefinicao.map((c, idx) => {
      const statusEl = form[`status-${idx}`];
      const obsEl = form[`obs-${idx}`];
      if (!statusEl) {
        console.warn(`status-${idx} não encontrado no DOM`); // ajuda a debugar
      }
      if (!obsEl) {
        console.warn(`obs-${idx} não encontrado no DOM`);
      }
      return {
        bloco: c.bloco,
        numero: c.numero,
        pergunta: c.pergunta,
        peso: c.peso,
        status: statusEl ? statusEl.value : "",
        obs: obsEl ? (obsEl.value || "") : ""
      };
    });

    const notaFinal = calculaNotaConsultor(criterios);
    const resumoCriterios = {
      conforme: criterios.filter(c => c.status === "Conforme").length,
      naoConforme: criterios.filter(c => c.status === "Não Conforme").length,
      naoSeAplica: criterios.filter(c => c.status === "Não se Aplica").length,
      totalValidos: criterios.filter(c => c.status !== "Não se Aplica").length
    };

    if (!editId) {
      const existente = await db.collection("avaliacoes")
        .where("agente", "==", agente)
        .where("funcao", "==", funcao)
        .where("periodo_inicio", "==", periodo_inicio)
        .get();
      if (!existente.empty) {
        alert("Já existe uma avaliação para esse consultor nesse período.");
        form.querySelector("button[type=submit]").disabled = false;
        return;
      }
    }

    const dados = {
      agente,
      funcao,
      status_negocio: "PERDA",
      periodo_inicio,
      periodo_fim,
      periodo_mes,
      periodo_ano,
      periodo,
      protocolo,
      datalig,
      link_tldv,
      link_pipe,
      criterios,
      notaFinal,
      resumoCriterios,
      recomendacoes,
      plano_acao,
      createdAt: editId ? undefined : new Date().toISOString(), // ficará ajustado se for edição
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editId) {
        const docRef = db.collection("avaliacoes").doc(editId);
        const docSnap = await docRef.get();
        let createdAt = docSnap.exists && docSnap.data().createdAt
          ? docSnap.data().createdAt
          : new Date().toISOString();
        dados.createdAt = createdAt;
        dados.updatedAt = new Date().toISOString();
        await docRef.set(dados, { merge: true });
        alert("Edição salva com sucesso!");
      } else {
        dados.createdAt = new Date().toISOString();
        await db.collection("avaliacoes").doc(protocolo).set(dados);
        alert("Cadastro realizado com sucesso!");
      }
      window.location.href = `relatorio-consultor.html?id=${protocolo}`;
    } catch (err) {
      alert("Erro ao salvar: " + (err.message || err));
    } finally {
      form.querySelector("button[type=submit]").disabled = false;
    }
  });

  if (editId) {
    db.collection("avaliacoes").doc(editId).get().then(doc => {
      if (!doc.exists) {
        alert("Protocolo não encontrado!");
        window.location.href = "index.html";
        return;
      }
      const data = doc.data();
      if (form.agente) form.agente.value = data.agente || "";
      if (form.periodo_inicio) form.periodo_inicio.value = data.periodo_inicio || "";
      if (form.periodo_fim) form.periodo_fim.value = data.periodo_fim || "";
      if (form.protocolo) form.protocolo.value = data.protocolo || "";
      if (form.datalig) form.datalig.value = data.datalig ? data.datalig.slice(0,16) : "";
      if (form.link_tldv) form.link_tldv.value = data.link_tldv || "";
      if (form.link_pipe) form.link_pipe.value = data.link_pipe || "";
      if (form.recomendacoes) form.recomendacoes.value = data.recomendacoes || "";
      if (form.plano_acao) form.plano_acao.value = data.plano_acao || "";

      if (Array.isArray(data.criterios)) {
        data.criterios.forEach((c, idx) => {
          const statusSel = form[`status-${idx}`];
          const obsTxt = form[`obs-${idx}`];
          if (statusSel) statusSel.value = c.status || "";
          if (obsTxt) obsTxt.value = c.obs || "";
        });
      }

      const submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.textContent = "Salvar Edição";
    });
  }
});