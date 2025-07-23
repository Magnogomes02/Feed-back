// index.js
document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const listaRelatorios = document.getElementById("lista-relatorios");
  const nenhumRelatorio = document.getElementById("nenhum-relatorio");
  const filtroBusca = document.getElementById("filtroBusca");
  const btnBuscar = document.getElementById("btnBuscar");

  // Busca relatórios do Firestore
  async function carregarRelatorios(filtro = "") {
    listaRelatorios.innerHTML = "";
    let query = db.collection("avaliacoes").orderBy("createdAt", "desc");
    let snapshot;
    try {
      snapshot = await query.get();
    } catch (err) {
      listaRelatorios.innerHTML = "<tr><td colspan='7'>Erro ao buscar relatórios: " + err.message + "</td></tr>";
      return;
    }

    let relatorios = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Aplicar filtro simples por SDR, protocolo, período, qualificação ou número
      const busca = filtro.toLowerCase();
      if (
        !filtro ||
        (data.sdr && data.sdr.toLowerCase().includes(busca)) ||
        (data.protocolo && data.protocolo.toLowerCase().includes(busca)) ||
        (data.periodo && data.periodo.toLowerCase().includes(busca)) ||
        (data.qualif && data.qualif.toLowerCase().includes(busca)) ||
        (data.numero && data.numero.toLowerCase().includes(busca))
      ) {
        relatorios.push({ ...data, id: doc.id });
      }
    });

    if (relatorios.length === 0) {
      nenhumRelatorio.style.display = "block";
      return;
    } else {
      nenhumRelatorio.style.display = "none";
    }

    relatorios.forEach(r => {
      const tr = document.createElement("tr");

      // Formatações de datas
      const dataLig = r.datalig ? new Date(r.datalig).toLocaleString("pt-BR") : "-";
      const dataCriacao = r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "-";
      const nota = r.notaFinal !== undefined ? Number(r.notaFinal).toFixed(2) : "-";

      tr.innerHTML = `
        <td>${r.sdr || "-"}</td>
        <td>${r.periodo || "-"}</td>
        <td>${dataLig}</td>
        <td>${r.protocolo || "-"}</td>
        <td>${dataCriacao}</td>
        <td class="nota-tabela">${nota}</td>
        <td>
          <a href="relatorio.html?id=${r.id}" class="btn btn-ver" title="Ver Relatório">Ver</a>
        </td>
      `;
      listaRelatorios.appendChild(tr);
    });
  }

  // Filtro por busca
  btnBuscar.addEventListener("click", () => {
    carregarRelatorios(filtroBusca.value);
  });

  filtroBusca.addEventListener("keyup", e => {
    if (e.key === "Enter") carregarRelatorios(filtroBusca.value);
  });

  // Carrega todos ao abrir
  carregarRelatorios();
});
