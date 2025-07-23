// js/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const tbody = document.getElementById("lista-relatorios");
  const buscaInput = document.getElementById("busca");
  const btnBuscar = document.getElementById("btnBuscar");

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
        .limit(100)
        .get();
      relatorios = [];
      query.forEach(doc => {
        const r = doc.data();
        relatorios.push({ id: doc.id, ...r });
      });
      renderizarRelatorios(relatorios);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7">Erro ao carregar relatórios.</td></tr>`;
    }
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
      tr.innerHTML = `
        <td>${r.sdr || "-"}</td>
        <td>${r.periodo || "-"}</td>
        <td>${r.datalig ? formatarData(r.datalig) : "-"}</td>
        <td>${r.protocolo || "-"}</td>
        <td>${r.createdAt ? formatarData(r.createdAt) : "-"}</td>
        <td class="nota-tabela">${typeof r.notaFinal === "number" ? r.notaFinal.toFixed(2) : "-"}</td>
        <td>
          <a href="relatorio.html?id=${r.id}" class="btn-ver">Ver</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Filtro/busca
  function filtrar() {
    const termo = (buscaInput.value || "").toLowerCase();
    const filtrados = relatorios.filter(r =>
      (r.sdr || "").toLowerCase().includes(termo) ||
      (r.protocolo || "").toLowerCase().includes(termo) ||
      (r.periodo || "").toLowerCase().includes(termo)
    );
    renderizarRelatorios(filtrados);
  }

  btnBuscar.addEventListener("click", filtrar);
  buscaInput.addEventListener("keypress", e => { if (e.key === "Enter") filtrar(); });

  // Carrega na inicialização
  carregarRelatorios();
});