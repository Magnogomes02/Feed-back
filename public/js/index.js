document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const tbody = document.getElementById("lista-relatorios");
  const buscaInput = document.getElementById("busca");
  const selectSDR = document.getElementById('filtro-sdr');
  const selectPeriodo = document.getElementById('filtro-periodo');
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimparFiltro = document.getElementById("btnLimparFiltro");

  // Utilitário: formata data
  function formatarData(dt) {
    if (!dt) return "-";
    const d = new Date(dt);
    return isNaN(d) ? "-" : d.toLocaleString("pt-BR");
  }

  // Busca e lista relatórios
  let relatorios = [];

  async function carregarRelatorios() {
    tbody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;
    try {
      const query = await db.collection("avaliacoes")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
      relatorios = [];
      query.forEach(doc => {
        const r = doc.data();
        relatorios.push({ id: doc.id, ...r });
      });

      popularFiltrosSelects(relatorios);

      renderizarRelatorios(relatorios);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7">Erro ao carregar relatórios.</td></tr>`;
    }
  }

  // Preenche os selects de SDR e Período dinamicamente
  function popularFiltrosSelects(lista) {
    // SDRs únicos
    const sdrs = Array.from(new Set(lista.map(r => r.sdr).filter(Boolean))).sort();
    selectSDR.innerHTML = '<option value="">Todos SDRs</option>' +
      sdrs.map(sdr => `<option value="${sdr}">${sdr}</option>`).join('');

    // Períodos únicos
    const periodos = Array.from(new Set(lista.map(r => r.periodo).filter(Boolean))).sort();
    selectPeriodo.innerHTML = '<option value="">Todos Períodos</option>' +
      periodos.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  // Renderiza a tabela
function renderizarRelatorios(lista) {
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">Nenhum relatório encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  lista.forEach(r => {
    const tr = document.createElement("tr");
    // Verifica a nota
    let nota = typeof r.notaFinal === "number" ? r.notaFinal : null;
    let notaClass = "";
    if (nota !== null) {
      notaClass = nota >= 7 ? "nota-azul" : "nota-vermelha";
    }
    tr.innerHTML = `
      <td>${r.sdr || "-"}</td>
      <td>${r.periodo || "-"}</td>
      <td>${r.datalig ? formatarData(r.datalig) : "-"}</td>
      <td>${r.protocolo || "-"}</td>
      <td>${r.createdAt ? formatarData(r.createdAt) : "-"}</td>
      <td class="nota-tabela ${notaClass}">${nota !== null ? nota.toFixed(2) : "-"}</td>
      <td>
        <a href="relatorio.html?id=${r.id}" class="btn-ver">Ver</a>
        <a href="formulario.html?edit=${r.id}" class="btn-editar">Editar</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

 // Filtro completo: texto, SDR e Período
  function filtrar() {
    const termo = (buscaInput.value || "").toLowerCase();
    const filtroSdr = selectSDR.value;
    const filtroPeriodo = selectPeriodo.value;

    const filtrados = relatorios.filter(r =>
      (
        (r.sdr || "").toLowerCase().includes(termo) ||
        (r.protocolo || "").toLowerCase().includes(termo) ||
        (r.periodo || "").toLowerCase().includes(termo)
      )
      &&
      (!filtroSdr || r.sdr === filtroSdr)
      &&
      (!filtroPeriodo || r.periodo === filtroPeriodo)
    );
    renderizarRelatorios(filtrados);
  }

  // Eventos
  btnBuscar.addEventListener("click", filtrar);
  buscaInput.addEventListener("keypress", e => { if (e.key === "Enter") filtrar(); });
  selectSDR.addEventListener("change", filtrar);
  selectPeriodo.addEventListener("change", filtrar);

  if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
      buscaInput.value = "";
      selectSDR.value = "";
      selectPeriodo.value = "";
      renderizarRelatorios(relatorios);
    });
  }

  // Carrega na inicialização
  carregarRelatorios();
});