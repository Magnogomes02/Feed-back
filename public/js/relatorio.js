// js/relatorio.js

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  // Utilitário: formata data
  function formatarData(dt) {
    if (!dt) return "-";
    const d = new Date(dt);
    return isNaN(d) ? "-" : d.toLocaleString("pt-BR");
  }

  // Critérios na ordem correta
  const criteriosNomes = [
    "Identificação de perfil (PIT)",
    "Abertura e Rapport",
    "Apresentação de valor",
    "Convocação do analista fiscal",
    "Gestão de objeções",
    "Próximo passo definido",
    "Tom e linguagem",
    "Abordagem de Vendas",
    "Técnica no agendamento",
    "Efetividade",
    "Cordialidade e Relacionamento",
    "Prova social",
    "Qualificação de Leads",
    "Tempo de Resposta"
  ];

  // Captura id pela URL
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (!id) {
    document.body.innerHTML = "<main class='container'><h2>Relatório não encontrado!</h2></main>";
    return;
  }

  let relatorio;

  // Busca o relatório pelo id
  try {
    const doc = await db.collection("avaliacoes").doc(id).get();
    if (!doc.exists) throw new Error("Relatório não encontrado!");
    relatorio = doc.data();
  } catch (err) {
    document.body.innerHTML = `<main class='container'><h2>Erro: ${err.message}</h2></main>`;
    return;
  }

  function renderizaTabelaLigacoes(ligacoesArray) {
    if (!Array.isArray(ligacoesArray) || !ligacoesArray.length) return "<p>Sem informações de ligações qualificadas.</p>";
    let html = `<table class="tabela-ligacoes">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Porcentagem (%)</th>
          <th>Total de Chamadas</th>
          <th>Tempo Total Bilhetado</th>
          <th>Valor Total Bilhetado</th>
        </tr>
      </thead>
      <tbody>`;
    ligacoesArray.forEach(item => {
      html += `<tr>
        <td>${item.tipo === "Total" ? "<b>Total</b>" : item.tipo}</td>
        <td>${item.porcentagem !== undefined ? item.porcentagem : ""}</td>
        <td>${item.totalChamadas !== undefined ? item.totalChamadas : ""}</td>
        <td>${item.tempoTotal !== undefined ? item.tempoTotal : ""}</td>
        <td>${item.valorTotal !== undefined ? item.valorTotal : ""}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    return html;
  }

  document.getElementById("tabela-ligacoes-relatorio").innerHTML = renderizaTabelaLigacoes(relatorio.ligacoesQualificadas);

  // Exibe campos principais
  document.getElementById("periodo").textContent = relatorio.periodo || "-";
  document.getElementById("campanha").textContent = relatorio.campanha || "-";
  document.getElementById("protocolo").textContent = relatorio.protocolo || "-";
  document.getElementById("numero").textContent = relatorio.numero || "-";
  document.getElementById("datalig").textContent = formatarData(relatorio.datalig);
  document.getElementById("qualif").textContent = relatorio.qualif || "-";
  document.getElementById("sdr").textContent = relatorio.sdr || "-";
  document.getElementById("createdAt").textContent = formatarData(relatorio.createdAt);
  document.getElementById("nota").textContent = relatorio.nota || "-";

  // Preenche o campo de assinatura com o mesmo SDR
  document.getElementById('sdr-assinatura').textContent = document.getElementById('sdr').textContent;

  // Data de impressão dinâmica
  function preencheDataEmissao() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('data-emissao').textContent = `${dia}/${mes}/${ano}, ${hora}:${min}`;
  }
  preencheDataEmissao();

  // Exibe resumo nota & distribuição
  const rc = relatorio.resumoCriterios || {};
  document.getElementById("resumo-calculo").innerHTML = `
    <strong>Nota calculada:</strong> ${Number(relatorio.notaFinal).toFixed(2)} / 10<br>
    <strong>Distribuição de Avaliações:</strong><br>
    ✔️ OK: ${rc.percentOk || "0.0"}%<br>
    ⚠️ Parcial: ${rc.percentParcial || "0.0"}%<br>
    ❌ Faltou: ${rc.percentFaltou || "0.0"}%<br>
    ❎ Anulada: ${rc.anulada || 0}
  `;

  // Exibe critérios detalhados como cards coloridos (ordem garantida)
  const lista = document.getElementById("lista-criterios");
  lista.innerHTML = "";
  let criterios = relatorio.criterios || [];
  // Retrocompatibilidade: converte objeto para array se necessário
  if (!Array.isArray(criterios)) {
    criterios = criteriosNomes.map(nome => ({
      nome,
      ...(criterios[nome] || {})
    }));
  }

  criteriosNomes.forEach(nome => {
    const c = criterios.find(c => c.nome === nome) || { avaliacao: "-", observacao: "-" };

    // Define classe de cor para a avaliação
    let classe = "criterio-card";
    if (c.avaliacao === "✔️ OK") classe += " criterio-ok";
    else if (c.avaliacao === "⚠️ Parcial") classe += " criterio-parcial";
    else if (c.avaliacao === "❌ Faltou") classe += " criterio-faltou";
    else if (c.avaliacao === "❎ Anulada") classe += " criterio-anulada";

    // Monta o card
    const div = document.createElement("div");
    div.className = classe;
    div.innerHTML = `
      <div>
        <strong>${nome}</strong><br>
        <span><strong>Avaliação:</strong> ${c.avaliacao || "-"}</span><br>
        <span><strong>Comentários:</strong> ${c.observacao || "-"}</span>
      </div>
    `;
    lista.appendChild(div);
  });

  // Gráfico curva de aprendizado: últimos 5 relatórios deste SDR
  if (relatorio.sdr) {
    try {
      const query = await db.collection("avaliacoes")
        .where("sdr", "==", relatorio.sdr)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();
      const dados = [];
      query.forEach(doc => {
        const r = doc.data();
        dados.unshift({ // mais antigo à esquerda
          data: r.periodo || formatarData(r.createdAt),
          nota: Number(r.notaFinal) || 0
        });
      });
      if (dados.length > 1) {
        const ctx = document.getElementById("grafico-aprendizado").getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels: dados.map(d => d.data),
            datasets: [{
              label: "Nota Final",
              data: dados.map(d => d.nota),
              fill: false,
              tension: 0.2,
              borderColor: "#157afe",
              backgroundColor: "#157afe"
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: 10
              }
            }
          }
        });
      }
    } catch {}
  }
});