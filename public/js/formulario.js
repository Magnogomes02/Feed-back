// js/formulario.js

document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  const form = document.getElementById("feedbackForm");
  const tbody = document.getElementById("criterios");

  // Ordem e nomes dos critérios (ajuste aqui se quiser trocar!)
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

  // Ao submeter formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.querySelector("button[type=submit]").disabled = true;

    // Monta o objeto criterios como array
    const criterios = criteriosNomes.map((nome, idx) => ({
      nome,
      avaliacao: form[`criterio-avaliacao-${idx}`].value,
      observacao: form[`criterio-observacao-${idx}`].value
    }));

    // Calcula resumo de notas
    const contagem = {
      "✔️ OK": 0,
      "⚠️ Parcial": 0,
      "❌ Faltou": 0,
      "❎ Anulada": 0
    };
    criterios.forEach(c => contagem[c.avaliacao]++);
    const total = criterios.length;
    const notaFinal = total > 0
      ? ((contagem["✔️ OK"] * 1 + contagem["⚠️ Parcial"] * 0.6) / total * 10)
      : 0;

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

    // Monta dados do formulário
    const dados = {
      sdr: form.sdr.value,
      periodo: form.periodo.value,
      campanha: form.campanha.value,
      protocolo: form.protocolo.value,
      numero: form.numero.value,
      datalig: form.datalig.value,
      qualif: form.qualif.value,
      criterios,
      nota: form.nota.value,
      notaFinal,
      resumoCriterios,
      createdAt: new Date().toISOString()
    };

    // Salva no Firestore
    try {
      const doc = await db.collection("avaliacoes").doc(dados.protocolo).set(dados);
      // Redireciona para o relatório criado
      window.location.href = `relatorio.html?id=${dados.protocolo}`;
    } catch (err) {
      alert("Erro ao salvar no Firebase: " + (err.message || err));
    } finally {
      form.querySelector("button[type=submit]").disabled = false;
    }
  });
});
