window.addEventListener('DOMContentLoaded', async () => {
  const db = firebase.firestore();

  // Pega o id da URL (?id=XYZ)
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');
  if (!docId) {
    window.location.href = 'index.html';
    return;
  }

  // Busca o relatório individual
  let doc;
  try {
    doc = await db.collection('avaliacoes').doc(docId).get();
  } catch (e) {
    document.getElementById('dados').innerHTML = `<span style="color:#e74c3c">Erro ao consultar Firestore:<br>${e.message}</span>`;
    return;
  }
  if (!doc.exists) {
    document.getElementById('dados').innerHTML = 'Relatório não encontrado.';
    return;
  }

  const dados = doc.data();

  // Espelha TODOS os campos do formulário
  document.getElementById('dados').innerHTML = `
    <strong>SDR:</strong> ${dados.sdr || ''}<br>
    <strong>Período apurado:</strong> ${dados.periodo || ''}<br>
    <strong>Campanha:</strong> ${dados.campanha || ''}<br>
    <strong>Protocolo:</strong> ${dados.protocolo || ''}<br>
    <strong>Número:</strong> ${dados.numero || ''}<br>
    <strong>Data da ligação:</strong> ${dados.datalig || ''}<br>
    <strong>Qualificação:</strong> ${dados.qualif || ''}
  `;

  // Cálculo e exibição da nota + distribuição de avaliações
  let nota = 0;
  let resumo = dados.resumoCriterios;
  if (dados.notaFinal !== undefined) {
    nota = Number(dados.notaFinal);
  }
  if (!resumo && dados.criterios && typeof dados.criterios === "object") {
    // Calcula o resumo na hora se não vier salvo
    const contagem = { "✔️ OK":0, "⚠️ Parcial":0, "❌ Faltou":0, "❎ Anulada":0 };
    let soma = 0, total = 0;
    Object.values(dados.criterios).forEach(c => {
      if (c.avaliacao !== "❎ Anulada") total++;
      if (contagem[c.avaliacao] !== undefined) contagem[c.avaliacao]++;
      if (c.avaliacao === "✔️ OK") soma++;
      if (c.avaliacao === "⚠️ Parcial") soma += 0.5;
    });
    nota = total > 0 ? (soma / total) * 10 : 0;
    resumo = {
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
  }

  document.getElementById('resumo-calculo').innerHTML = `
    <div><strong>Nota calculada:</strong> ${nota.toFixed(1)} / 10</div>
    <div>
      <strong>Distribuição de Avaliações:</strong><br>
      ✔️ OK: ${resumo.percentOk}%<br>
      ⚠️ Parcial: ${resumo.percentParcial}%<br>
      ❌ Faltou: ${resumo.percentFaltou}%<br>
      ❎ Anulada: ${resumo.anulada || 0}
    </div>
  `;

  document.getElementById('titulo').innerText = dados.titulo || '';

  // Renderiza critérios
  const container = document.getElementById("conteudo");
  container.innerHTML = "";
  const cores = {
    "✔️ OK": "cor-ok",
    "⚠️ Parcial": "cor-parcial",
    "❌ Faltou": "cor-faltou",
    "❎ Anulada": "cor-anulada"
  };
  if (dados.criterios && typeof dados.criterios === "object") {
    Object.entries(dados.criterios).forEach(([criterio, obj]) => {
      const bloco = document.createElement("div");
      bloco.className = `crit ${cores[obj.avaliacao] || ""}`;
      bloco.innerHTML = `
        <h3>${criterio} — ${obj.avaliacao}</h3>
        <p>${obj.observacao || 'Sem observações.'}</p>
      `;
      container.appendChild(bloco);
    });
  }

  // Recomendações finais (campo "nota")
  if (dados.nota) {
    const recomendacoesDiv = document.createElement("div");
    recomendacoesDiv.className = "recomendacoes-finais";
    recomendacoesDiv.innerHTML = `<h3>Recomendações Finais</h3><p>${dados.nota}</p>`;
    container.appendChild(recomendacoesDiv);
  }

  // Busca os últimos 5 relatórios desse SDR para curva de aprendizado
  let curvaSnapshot;
  try {
    curvaSnapshot = await db.collection('avaliacoes')
      .where('sdr', '==', dados.sdr)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
  } catch (e) {
    document.getElementById('grafico').style.display = 'none';
    return;
  }

  const curvaDocs = curvaSnapshot.docs.reverse();
  const labels = [];
  const notas = [];

  curvaDocs.forEach(docCurva => {
    const data = docCurva.data();
    let label = '';
    if (data.createdAt) {
      label = new Date(data.createdAt).toLocaleDateString('pt-BR');
    } else if (data.periodo) {
      label = data.periodo;
    }
    // Calcula nota da curva se não vier salva
    let notaCurva = 0;
    if (data.notaFinal !== undefined) {
      notaCurva = Number(data.notaFinal);
    } else if (data.criterios && typeof data.criterios === "object") {
      let soma = 0, total = 0;
      Object.values(data.criterios).forEach(c => {
        if (c.avaliacao !== "❎ Anulada") total++;
        if (c.avaliacao === "✔️ OK") soma++;
        if (c.avaliacao === "⚠️ Parcial") soma += 0.5;
      });
      notaCurva = total > 0 ? (soma / total) * 10 : 0;
    }
    labels.push(label);
    notas.push(notaCurva);
  });

  // Gráfico de linha - curva de aprendizado
  const ctx = document.getElementById('grafico').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nota Final',
        data: notas,
        fill: false,
        borderColor: '#3498db',
        backgroundColor: '#3498db',
        tension: 0.2,
        pointRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3498db'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { title: { display: true, text: 'Avaliação' } },
        y: { title: { display: true, text: 'Nota' }, min: 0, max: 10 }
      }
    }
  });
});
