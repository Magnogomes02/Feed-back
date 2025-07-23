// js/formulario.js

const criterios = [
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

// Preenche a tabela de critérios dinamicamente
(function populaTabela() {
  const tbody = document.getElementById("criterios");
  criterios.forEach((nome, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1} - ${nome}</td>
      <td>
        <select name="aval_${index}" required>
          <option value="✔️ OK">✔️ OK</option>
          <option value="⚠️ Parcial">⚠️ Parcial</option>
          <option value="❌ Faltou">❌ Faltou</option>
          <option value="❎ Anulada">❎ Anulada</option>
        </select>
      </td>
      <td><textarea name="obs_${index}" rows="2"></textarea></td>
    `;
    tbody.appendChild(row);
  });
})();

document.getElementById("feedbackForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const data = new FormData(this);

  // Monta o objeto dos critérios
  const avaliacoes = {};
  const contagem = { "✔️ OK":0, "⚠️ Parcial":0, "❌ Faltou":0, "❎ Anulada":0 };

  criterios.forEach((nome, index) => {
    const avaliacao = data.get(`aval_${index}`);
    const observacao = data.get(`obs_${index}`) || "";
    avaliacoes[nome] = { avaliacao, observacao };
    if (contagem[avaliacao] !== undefined) contagem[avaliacao]++;
  });

  // Calcula a nota
  let soma = 0, total = 0;
  Object.values(avaliacoes).forEach(c => {
    if (c.avaliacao !== "❎ Anulada") total++;
    if (c.avaliacao === "✔️ OK") soma++;
    if (c.avaliacao === "⚠️ Parcial") soma += 0.5;
  });
  const notaFinal = total > 0 ? (soma / total) * 10 : 0;

  // Calcula o resumo dos critérios
  const resumoCriterios = {
    ok: contagem["✔️ OK"],
    parcial: contagem["⚠️ Parcial"],
    faltou: contagem["❌ Faltou"],
    anulada: contagem["❎ Anulada"],
    total,
    percentOk: total > 0 ? ((contagem["✔️ OK"] / total) * 100).toFixed(1) : "0.0",
    percentParcial: total > 0 ? ((contagem["⚠️ Parcial"] / total) * 100).toFixed(1) : "0.0",
    percentFaltou: total > 0 ? ((contagem["❌ Faltou"] / total) * 100).toFixed(1) : "0.0",
    percentAnulada: total > 0 ? ((contagem["❎ Anulada"] / total) * 100).toFixed(1) : "0.0"
  };

  // Dados gerais
  const registro = {
    sdr:      data.get("sdr"),
    periodo:  data.get("periodo"),
    campanha: data.get("campanha"),
    protocolo:data.get("protocolo"),
    numero:   data.get("numero"),
    datalig:  data.get("datalig"),
    qualif:   data.get("qualif"),
    nota:     data.get("nota") || "",
    criterios: avaliacoes,
    notaFinal,
    resumoCriterios,
    createdAt: new Date().toISOString()
  };

  // Salva em localStorage para uso imediato (opcional)
  localStorage.setItem("relatorioSDR", JSON.stringify(registro));

  // Salva no Firestore
  try {
    const docRef = await db.collection("avaliacoes").add(registro);
    window.location.href = "relatorio.html?id=" + docRef.id;
  } catch (err) {
    alert("Erro ao salvar no Firebase: " + err.message);
  }
});
