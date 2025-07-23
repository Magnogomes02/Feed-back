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

  // Exibe critérios detalhados (ordem garantida)
  const lista = document.getElementById("lista-criterios");
  lista.innerHTML = "";
  let criterios = relatorio.criterios || [];
  // Caso retrocompatibilidade, converte objeto para array
  if (!Array.isArray(criterios)) {
    criterios = criteriosNomes.map(nome => ({
      nome,
      ...(criterios[nome] || {})
    }));
  }

  criteriosNomes.forEach(nome => {
    const c = criterios.find(c => c.nome === nome) || { avaliacao: "-", observacao: "-" };
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nome}</td>
      <td>${c.avaliacao || "-"}</td>
      <td>${c.observacao || "-"}</td>
    `;
    lista.appendChild(tr);
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
        dados.unshift({ // unshift: mais antigo à esquerda
          data: r.periodo || formatarData(r.createdAt),
          nota: Number(r.notaFinal) || 0
        });
      });
      // Renderiza gráfico se houver mais de 1 dado
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
              tension: 0.2
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
