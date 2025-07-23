// js/formulario.js

document.addEventListener("DOMContentLoaded", () => {
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

  // Gera as linhas da tabela de critérios
  const tbody = document.getElementById("criterios");
  criteriosNomes.forEach(nome => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nome}</td>
      <td>
        <select name="avaliacao-${nome}" required>
          <option value="">Selecione</option>
          <option value="✔️ OK">✔️ OK</option>
          <option value="⚠️ Parcial">⚠️ Parcial</option>
          <option value="❌ Faltou">❌ Faltou</option>
          <option value="❎ Anulada">❎ Anulada</option>
        </select>
      </td>
      <td>
        <input type="text" name="comentario-${nome}" placeholder="Observação">
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Salva o formulário no Firestore
  document.getElementById("feedbackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = firebase.firestore();
    const form = e.target;

    // Monta critérios como array
    const criterios = criteriosNomes.map(nome => ({
      nome,
      avaliacao: form[`avaliacao-${nome}`].value,
      observacao: form[`comentario-${nome}`].value
    }));

    // Calcula nota e resumo
    const contagem = { "✔️ OK": 0, "⚠️ Parcial": 0, "❌ Faltou": 0, "❎ Anulada": 0 };
    criterios.forEach(c => {
      if (contagem[c.avaliacao] !== undefined) contagem[c.avaliacao]++;
    });
    const total = criterios.length;
    const notaFinal = total > 0
      ? ((contagem["✔️ OK"] * 1 + contagem["⚠️ Parcial"] * 0.6) / total * 10)
      : 0;

    // Resumo de critérios para gráficos e exibição
    const resumoCriterios = {
      ok: contagem["✔️ OK"],
      parcial: contagem["⚠️ Parcial"],
      faltou: contagem["❌ Faltou"],
      anulada: contagem["❎ Anulada"],
      percentOk: ((contagem["✔️ OK"] / total) * 100).toFixed(1),
      percentParcial: ((contagem["⚠️ Parcial"] / total) * 100).toFixed(1),
      percentFaltou: ((contagem["❌ Faltou"] / total) * 100).toFixed(1),
      percentAnulada: ((contagem["❎ Anulada"] / total) * 100).toFixed(1),
      total
    };

    // Monta objeto para salvar
    const registro = {
      sdr: form.sdr.value,
      periodo: form.periodo.value,
      campanha: form.campanha.value,
      protocolo: form.protocolo.value,
      numero: form.numero.value,
      datalig: form.datalig.value,
      qualif: form.qualif.value,
      criterios, // agora array de objetos!
      resumoCriterios,
      nota: form.nota.value,
      notaFinal: Number(notaFinal.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    // Salva no Firestore e redireciona para o relatório
    try {
      const docRef = await db.collection("avaliacoes").add(registro);
      window.location.href = "relatorio.html?id=" + docRef.id;
    } catch (err) {
      alert("Erro ao salvar no Firebase: " + err.message);
    }
  });
});
