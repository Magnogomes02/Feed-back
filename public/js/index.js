// index.js
// Mantém toda a estrutura do seu projeto, só ajusta a tabela "Relatórios Encontrados"

let dados = [];
let filtroSDR = 'todos';
let filtroPeriodo = 'todos';
let termoBusca = '';

const tabelaBody = document.querySelector('#tabela tbody');
const nenhum = document.getElementById('nenhum');
const selectSDR = document.getElementById('filtro-sdr');
const selectPeriodo = document.getElementById('filtro-periodo');
const inputBusca = document.getElementById('campo-busca');

// Função principal: busca e renderiza dados do Firestore
async function carregarRelatorios() {
  try {
    const snapshot = await firebase.firestore()
      .collection("avaliacoes")
      .orderBy("createdAt", "desc")
      .get();

    dados = [];
    snapshot.forEach(doc => {
      let d = doc.data();
      d.id = doc.id; // Para o botão "Ver"
      dados.push(d);
    });

    atualizarFiltros();
    aplicarFiltrosEExibir();
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    tabelaBody.innerHTML = '<tr><td colspan="7">Erro ao buscar relatórios.</td></tr>';
  }
}

// Atualiza os filtros de SDR e Período baseados nos dados carregados
function atualizarFiltros() {
  // SDRs
  const sdrs = Array.from(new Set(dados.map(d => d.sdr).filter(Boolean)));
  selectSDR.innerHTML = '<option value="todos">Todos os SDRs</option>' +
    sdrs.map(sdr => `<option value="${sdr}">${sdr}</option>`).join('');

  // Períodos
  const periodos = Array.from(new Set(dados.map(d => d.periodo).filter(Boolean)));
  selectPeriodo.innerHTML = '<option value="todos">Todos os Períodos</option>' +
    periodos.map(p => `<option value="${p}">${p}</option>`).join('');
}

// Aplica filtros e busca, e chama renderLista
function aplicarFiltrosEExibir() {
  let filtrados = dados;

  // Filtro por SDR
  if (filtroSDR !== 'todos') {
    filtrados = filtrados.filter(d => d.sdr === filtroSDR);
  }
  // Filtro por Período
  if (filtroPeriodo !== 'todos') {
    filtrados = filtrados.filter(d => d.periodo === filtroPeriodo);
  }
  // Filtro por busca (case-insensitive)
  if (termoBusca.length > 0) {
    const busca = termoBusca.toLowerCase();
    filtrados = filtrados.filter(d =>
      (d.sdr || '').toLowerCase().includes(busca) ||
      (d.periodo || '').toLowerCase().includes(busca) ||
      (d.protocolo || '').toLowerCase().includes(busca)
    );
  }

  renderLista(filtrados);
}

// Renderiza a lista dos relatórios encontrados (ajustado conforme seu padrão)
function renderLista(docs) {
  tabelaBody.innerHTML = '';
  if (docs.length === 0) {
    nenhum.style.display = 'block';
    return;
  }
  nenhum.style.display = 'none';

  docs.forEach(d => {
    // Formata datas
    const dataLig = d.datalig
      ? new Date(d.datalig).toLocaleString('pt-BR')
      : '';
    const createdAt = d.createdAt
      ? (d.createdAt.toDate ? d.createdAt.toDate().toLocaleString('pt-BR') : new Date(d.createdAt).toLocaleString('pt-BR'))
      : '';
    const notaFinal = (typeof d.notaFinal !== "undefined" && d.notaFinal !== null)
      ? Number(d.notaFinal).toFixed(2).replace('.', ',')
      : "-";


    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.sdr || ""}</td>
      <td>${d.periodo || ""}</td>
      <td>${dataLig}</td>
      <td>${d.protocolo || ""}</td>
      <td>${createdAt}</td>
      <td>${notaFinal}</td>
      <td>
        <button class="btn-ver" onclick="verRelatorio('${d.id}')">
          Ver
        </button>
      </td>
    `;
    tabelaBody.append(tr);
  });
}

// Botão "Ver" relatório
function verRelatorio(id) {
  window.location.href = `relatorio.html?id=${id}`;
}

// Listeners dos filtros e busca
selectSDR.addEventListener('change', e => {
  filtroSDR = e.target.value;
  aplicarFiltrosEExibir();
});
selectPeriodo.addEventListener('change', e => {
  filtroPeriodo = e.target.value;
  aplicarFiltrosEExibir();
});
inputBusca.addEventListener('input', e => {
  termoBusca = e.target.value;
  aplicarFiltrosEExibir();
});

// Carrega os relatórios ao iniciar a página
window.addEventListener("DOMContentLoaded", carregarRelatorios);