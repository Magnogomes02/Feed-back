// js/relatorio.js

// Inicialização: pega o ID do relatório na URL
const params = new URLSearchParams(window.location.search);
const docId  = params.get('id');

// Função para popular os dados na página
function populaPagina(dados) {
  document.getElementById("titulo").textContent =
    `Relatório de Feedback – SDR: ${dados.sdr}`;

  document.getElementById("dados").innerHTML = `
    <strong>Período apurado:</strong> ${dados.periodo}<br>
    <strong>Campanha:</strong> ${dados.campanha}<br>
    <strong>Protocolo:</strong> ${dados.protocolo}<br>
    <strong>Número:</strong> ${dados.numero}<br>
    <strong>Data da ligação:</strong> ${new Date(dados.datalig).toLocaleString()}<br>
    <strong>Qualificação:</strong> ${dados.qualif}
  `;

  const cores = {
    "✔️ OK": "ok",
    "⚠️ Parcial": "warn",
    "❌ Faltou": "fail",
    "❎ Anulada": "neutral"
  };
  const container = document.getElementById("conteudo");
  container.innerHTML = "";

  let total = 0;
  const contagem = { "✔️ OK":0, "⚠️ Parcial":0, "❌ Faltou":0, "❎ Anulada":0 };

  Object.entries(dados.criterios).forEach(([criterio, obj]) => {
    const bloco = document.createElement("div");
    bloco.className = `crit ${cores[obj.avaliacao] || ""}`;
    bloco.innerHTML = `
      <h3>${criterio} — ${obj.avaliacao}</h3>
      <p>${obj.observacao || 'Sem observações.'}</p>
    `;
    container.appendChild(bloco);

    if (obj.avaliacao !== "❎ Anulada") {
      contagem[obj.avaliacao]++;
      total++;
    } else {
      contagem["❎ Anulada"]++;
    }
  });

  // Resumo de notas
  const notaAtual = total > 0
    ? ((contagem['✔️ OK']*1 + contagem['⚠️ Parcial']*0.6) / total * 10).toFixed(1)
    : "—";

  const percent = key =>
    total > 0 ? ((contagem[key] / total) * 100).toFixed(1) : "0.0";

  document.getElementById("resumo-calculo").innerHTML = `
    <strong>Nota calculada:</strong> ${notaAtual} / 10<br>
    <strong>Distribuição de Avaliações:</strong><br>
    ✔️ OK: ${percent('✔️ OK')}%<br>
    ⚠️ Parcial: ${percent('⚠️ Parcial')}%<br>
    ❌ Faltou: ${percent('❌ Faltou')}%<br>
    ❎ Anulada: ${contagem['❎ Anulada']}
  `;

  return { sdr: dados.sdr, notaAtual: Number(notaAtual) };
}

// Função para desenhar o gráfico de evolução
function geraGrafico(sdr, notaAtual) {
  db.collection("avaliacoes")
    .where("sdr", "==", sdr)
    .orderBy("createdAt", "desc")
    .limit(2)
    .get()
    .then(snapshot => {
      const avals = snapshot.docs.map(d => d.data());
      const anterior = avals.length > 1 ? avals[1] : null;

      const notaAnt = anterior
        ? (() => {
            let soma=0, cnt=0;
            Object.values(anterior.criterios).forEach(obj => {
              if (obj.avaliacao !== "❎ Anulada") {
                soma += obj.avaliacao === "✔️ OK" ? 1 : obj.avaliacao === "⚠️ Parcial" ? 0.6 : 0;
                cnt++;
              }
            });
            return cnt > 0 ? (soma / cnt * 10).toFixed(1) : 0;
          })()
        : 0;

      new Chart(document.getElementById("grafico"), {
        type: 'bar',
        data: {
          labels: ['Anterior', 'Atual'],
          datasets: [{
            label: `Evolução de ${sdr}`,
            data: [Number(notaAnt), notaAtual],
            backgroundColor: ['#95a5a6', '#3498db']
          }]
        },
        options: {
          scales: { y: { beginAtZero: true, max: 10 } },
          plugins: { legend: { display: false } }
        }
      });
    })
    .catch(err => console.error("Erro ao buscar histórico:", err));
}

// Carrega tudo assim que o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
  // Se não vier id na URL, volta para a listagem
  if (!docId) {
    return window.location.href = 'index.html';
  }

  // Busca o documento direto no Firestore
  db.collection("avaliacoes").doc(docId).get()
    .then(docSnap => {
      if (!docSnap.exists) {
        document.getElementById("titulo").textContent = "Relatório não encontrado";
        return;
      }
      const dados = docSnap.data();
      const { sdr, notaAtual } = populaPagina(dados);
      geraGrafico(sdr, notaAtual);
    })
    .catch(err => {
      console.error("Erro ao carregar relatório:", err);
      document.getElementById("titulo").textContent = "Erro ao carregar relatório.";
    });
});
