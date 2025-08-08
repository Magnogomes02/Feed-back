// js/relatorio-consultor.js
document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  function formatarData(dt) {
    if (!dt) return "-";
    const d = new Date(dt);
    if (isNaN(d)) return "-";
    return d.toLocaleString("pt-BR");
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) {
    document.body.innerHTML = "<main class='container'><h2>Relatório não encontrado!</h2></main>";
    return;
  }

  let data;
  try {
    const doc = await db.collection("avaliacoes").doc(id).get();
    if (!doc.exists) throw new Error("Não encontrado");
    data = doc.data();
  } catch (e) {
    document.body.innerHTML = "<main class='container'><h2>Erro ao carregar relatório</h2></main>";
    return;
  }

  // Preenche cabeçalho principal
  document.getElementById("status_negocio").textContent = data.status_negocio || "PERDA";
  document.getElementById("periodo").textContent = data.periodo || (data.periodo_inicio && data.periodo_fim
    ? `${data.periodo_inicio.split('-').reverse().join('/')} - ${data.periodo_fim.split('-').reverse().join('/')}`
    : "");
  document.getElementById("datalig").textContent = formatarData(data.datalig);
  document.getElementById("protocolo").textContent = data.protocolo || "";
  document.getElementById("agente").textContent = data.agente || "";
  document.getElementById("createdAt").textContent = formatarData(data.createdAt);
  document.getElementById("link_tldv").href = data.link_tldv || "#";
  document.getElementById("link_pipe").href = data.link_pipe || "#";
  document.getElementById("notaFinal").textContent = (typeof data.notaFinal === "number" ? data.notaFinal.toFixed(2) : data.notaFinal) || "-";
  document.getElementById("recomendacoes").textContent = data.recomendacoes || "-";
  document.getElementById("plano_acao").textContent = data.plano_acao || "-";
  document.getElementById("assinatura_agente").textContent = data.agente || "";

  // Distribuição (adaptação: conforme / não conforme / não se aplica)
  const rc = data.resumoCriterios || {};
  const totalValidos = rc.totalValidos || ((rc.conforme || 0) + (rc.naoConforme || 0)); // fallback
  const percentOk = totalValidos ? ((rc.conforme || 0) / totalValidos) * 100 : 0;
  const percentFaltou = totalValidos ? ((rc.naoConforme || 0) / totalValidos) * 100 : 0;
  const percentNaoSeAplica = totalValidos ? ((rc.naoSeAplica || 0) / ( (rc.conforme||0)+(rc.naoConforme||0)+(rc.naoSeAplica||0) )) * 100 : 0;

  // Exibe resumo com estilo semelhante ao SDR (ajustando nomes)
  document.getElementById("resumo-calculo").innerHTML = `
    <strong>Nota calculada:</strong> ${Number(data.notaFinal || 0).toFixed(2)} / 10<br>
    <strong>Distribuição de Avaliações:</strong><br>
    ✔️ Conforme: ${percentOk.toFixed(1)}%<br>
    ❌ Não Conforme: ${percentFaltou.toFixed(1)}%<br>
    ℹ️ Não se Aplica: ${percentNaoSeAplica.toFixed(1)}%
  `;

  // Data de emissão
  (function(){
    const now = new Date();
    const dia = String(now.getDate()).padStart(2,'0');
    const mes = String(now.getMonth()+1).padStart(2,'0');
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    document.getElementById("data-emissao").textContent = `${dia}/${mes}/${ano}, ${hora}:${min}`;
  })();

  // Lista de critérios (mantém blocos e número como no consultor)
  const lista = document.getElementById("lista-criterios");
  lista.innerHTML = "";
  if (Array.isArray(data.criterios)) {
    data.criterios.forEach(c => {
      const div = document.createElement("div");
      let classe = "criterio-card";
      if (c.status === "Conforme") classe += " criterio-ok";
      else if (c.status === "Não Conforme") classe += " criterio-faltou";
      else if (c.status === "Não se Aplica") classe += " criterio-anulada";

      div.className = classe;
      div.style.marginBottom = "8px";
      div.innerHTML = `
        <div>
          <strong>${c.numero} - ${c.bloco}</strong><br>
          <strong><span>${c.pergunta}</span></strong><br>
          <strong>Peso:</strong> ${c.peso}<br>
          <strong>Status:</strong> ${c.status}<br>
          <span><strong>OBS:</strong> ${c.obs || "-"}</span>
        </div>
      `;
      lista.appendChild(div);
    });
  }

  // Curva de aprendizado (últimos 5 relatórios do mesmo agente, se relevante)
  if (data.agente) {
    try {
      const query = await db.collection("avaliacoes")
        .where("agente", "==", data.agente)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();
      const dados = [];
      query.forEach(doc => {
        const r = doc.data();
        dados.unshift({
          data: r.periodo || formatarData(r.createdAt),
          nota: Number(r.notaFinal) || 0
        });
      });
      // Parte que gera o gráfico
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
              tension: 0.3,
              borderColor: "#157afe",
              backgroundColor: "#4b6586ff"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 0.1,
            plugins: { 
              legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: 10
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn("Erro ao buscar histórico do agente:", err);
    }
  }
});