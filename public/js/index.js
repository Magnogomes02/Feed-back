let isGestor = false; // flag global de role

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const tbody = document.getElementById("lista-relatorios");
  const buscaInput = document.getElementById("busca");
  const selectAgente = document.getElementById('filtro-agente');
  const filtroAno = document.getElementById('filtro-ano');
  const filtroMes = document.getElementById('filtro-mes');
  const filtroPeriodo = document.getElementById('filtro-periodo');
  const selectSetor = document.getElementById('filtro-setor');
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimparFiltro = document.getElementById("btnLimparFiltro");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnProxima = document.getElementById("btnProxima");
  const infoPaginacao = document.getElementById("info-paginacao");

  let paginaAtual = [];
  let primeiroDoc = null;
  let ultimoDoc = null;
  let pagina = 1;
  let totalResultados = 0;
  const pageSize = 10;
  let debounceTimer = null;

  function formatarData(dt) {
    if (!dt) return "-";
    const d = new Date(dt);
    return isNaN(d) ? "-" : d.toLocaleString("pt-BR");
  }

  function getAnoMes(periodo) {
    if (!periodo || !periodo.includes("-")) return "";
    const [inicio, _] = periodo.split('-').map(p => p.trim());
    const [dia, mes, ano] = inicio.split('/');
    return `${ano}-${mes}`;
  }

    // Decide URLs de "ver" e "editar" com base na função/setor (SDR / Closer)
    function getUrlsPara(r) {
      const funcaoNorm = (r.funcao || "").toString().trim().toLowerCase();
      const isCloser = funcaoNorm === "closer" || funcaoNorm === "consultor";
      return {
        ver: isCloser
          ? `relatorio-consultor.html?id=${r.id}`
          : `relatorio.html?id=${r.id}`,
        editar: isCloser
          ? `formulario-consultor.html?edit=${r.id}`
          : `formulario-sdr.html?edit=${r.id}`
      };
    }

  // Busca total de resultados para exibir contagem
  async function buscarTotalResultados(filtros = {}, busca = "") {
    let q = db.collection("avaliacoes");
    if (filtros.agente) q = q.where("agente", "==", filtros.agente);
    if (filtros.setor) q = q.where("funcao", "==", filtros.setor);
    if (filtros.ano) q = q.where("periodo_ano", "==", filtros.ano);
    if (filtros.mes) q = q.where("periodo_mes", "==", filtros.mes);
    if (filtros.periodo) q = q.where("periodo", "==", filtros.periodo);
    const snapshot = await q.get();
    return snapshot.size;
  }

  async function carregarPagina({ direction = "first", filtros = {}, busca = "" } = {}) {
    tbody.innerHTML = `<tr><td colspan="8">Carregando...</td></tr>`;
    let q = db.collection("avaliacoes")
             .orderBy("datalig", "desc")
             .orderBy("periodo_inicio", "desc");

    if (filtros.agente) q = q.where("agente", "==", filtros.agente);
    if (filtros.setor) q = q.where("funcao", "==", filtros.setor);
    if (filtros.ano) q = q.where("periodo_ano", "==", filtros.ano);
    if (filtros.mes) q = q.where("periodo_mes", "==", filtros.mes);
    if (filtros.periodo) q = q.where("periodo", "==", filtros.periodo);

    // Paginação: startAfter / endBefore com base em direção
    if (direction === "next" && ultimoDoc) q = q.startAfter(ultimoDoc);
    if (direction === "prev" && primeiroDoc) q = q.endBefore(primeiroDoc);

    q = q.limit(pageSize);

    const snapshot = await q.get();

    paginaAtual = [];
    snapshot.forEach(doc => {
      const r = doc.data();
      paginaAtual.push({ id: doc.id, ...r });
    });

    // Aplica busca livre client-side sobre a página atual
    let lista = paginaAtual;
    const termo = (busca || buscaInput.value || "").toLowerCase();
    if (termo) {
      lista = lista.filter(r =>
        (r.agente || "").toLowerCase().includes(termo) ||
        (r.protocolo || "").toLowerCase().includes(termo) ||
        (r.periodo || "").toLowerCase().includes(termo)
      );
    }

    // Guarda os docs para navegação
    primeiroDoc = snapshot.docs[0];
    ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

    // Atualiza total de resultados (sem busca livre)
    totalResultados = await buscarTotalResultados(filtros);

    popularFiltrosSelects(lista, filtros.ano, filtros.mes, filtros.agente, filtros.setor);
    renderizarRelatorios(lista);

    const inicio = totalResultados === 0 ? 0 : (pageSize * (pagina - 1)) + 1;
    const fim = Math.min(pageSize * pagina, totalResultados);
    infoPaginacao.textContent = `Exibindo ${inicio}–${fim} de ${totalResultados} relatórios`;

    btnAnterior.disabled = pagina === 1 || !primeiroDoc;
    btnProxima.disabled = lista.length < pageSize || fim >= totalResultados;
  }

  function popularFiltrosSelects(lista, anoSelecionado, mesSelecionado, agenteSelecionado, setorSelecionado) {
    // Agentes (com preservação da seleção)
    const agentes = Array.from(new Set(lista.map(r => r.agente).filter(Boolean))).sort();
    selectAgente.innerHTML = '<option value="">Todos os agentes</option>' +
      agentes.map(a => `<option value="${a}">${a}</option>`).join('');
    if (agenteSelecionado) selectAgente.value = agenteSelecionado;

    // Setor (não precisa repopular se for estático, mas mantém valor)
    if (setorSelecionado) selectSetor.value = setorSelecionado;

    // ANOS
    const anos = Array.from(new Set(lista.map(r => r.periodo_inicio?.slice(0, 4)).filter(Boolean))).sort().reverse();
    filtroAno.innerHTML = '<option value="">Todos os anos</option>' +
      anos.map(a => `<option value="${a}">${a}</option>`).join('');
    if (anoSelecionado) filtroAno.value = anoSelecionado;

    // Mês (exibe nome e desambigua se houver múltiplos anos)
    const periodosBrutos = lista.map(r => r.periodo).filter(Boolean);
    const meses = Array.from(new Set(periodosBrutos.map(getAnoMes))).filter(Boolean).sort().reverse();

    const mapMesParaAnos = {};
    meses.forEach(m => {
      const [ano, mes] = m.split("-");
      if (!mapMesParaAnos[mes]) mapMesParaAnos[mes] = new Set();
      mapMesParaAnos[mes].add(ano);
    });

    const opcoesMes = meses.map(m => {
      const [ano, mes] = m.split("-");
      const dt = new Date(Number(ano), Number(mes) - 1, 1);
      let nomeMes = dt.toLocaleString("pt-BR", { month: "long" });
      nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
      const precisaAno = mapMesParaAnos[mes].size > 1;
      const label = precisaAno ? `${nomeMes} (${ano})` : nomeMes;
      return `<option value="${m}">${label}</option>`;
    });
    filtroMes.innerHTML = '<option value="">Todos os meses</option>' + opcoesMes.join('');
    if (mesSelecionado) filtroMes.value = mesSelecionado;

    // Períodos do mês selecionado
    let periodos = periodosBrutos;
    if (mesSelecionado) {
      periodos = periodosBrutos.filter(p => getAnoMes(p) === mesSelecionado);
    }
    periodos = Array.from(new Set(periodos)).sort().reverse();
    filtroPeriodo.innerHTML = '<option value="">Todos os períodos</option>' +
      periodos.map(p => `<option value="${p}">${p}</option>`).join('');
  }


  function renderizarRelatorios(lista) {
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="8">Nenhum relatório encontrado.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    lista.forEach(r => {
      const tr = document.createElement("tr");

      const nota = typeof r.notaFinal === "number" ? r.notaFinal : null;
      let notaClass = "";
      if (nota !== null) notaClass = nota >= 7 ? "nota-azul" : "nota-vermelha";

      // Criando células com textContent para evitar XSS
      const tdAgente = document.createElement("td");
      tdAgente.textContent = r.agente || "-";

      const tdFuncao = document.createElement("td");
      tdFuncao.textContent = r.funcao || "-";
      tdFuncao.style.textAlign = "center";

      const tdPeriodo = document.createElement("td");
      tdPeriodo.textContent = r.periodo || "-";
      tdPeriodo.style.textAlign = "center";

      const tdDataContato = document.createElement("td");
      tdDataContato.textContent = r.datalig ? formatarData(r.datalig) : "-";
      tdDataContato.style.textAlign = "center";

      const tdProtocolo = document.createElement("td");
      tdProtocolo.textContent = r.protocolo || "-";
      tdProtocolo.style.textAlign = "center";

      const tdCriacao = document.createElement("td");
      tdCriacao.textContent = r.createdAt ? formatarData(r.createdAt) : "-";
      tdCriacao.style.textAlign = "center";

      const tdNota = document.createElement("td");
      tdNota.className = `nota-tabela ${notaClass}`;
      tdNota.textContent = nota !== null ? nota.toFixed(2) : "-";

      const tdAcoes = document.createElement("td");
      tdAcoes.style.display = "flex";
      tdAcoes.style.gap = "8px";
      tdAcoes.style.justifyContent = "center";

      const urls = getUrlsPara(r);

      const ver = document.createElement("a");
      ver.href = urls.ver;
      ver.className = "btn-ver";
      ver.textContent = "Ver";
      tdAcoes.appendChild(ver);

      if (isGestor) {
        const editar = document.createElement("a");
        editar.href = urls.editar;
        editar.className = "btn-editar";
        editar.textContent = "Editar";
        tdAcoes.appendChild(editar);
      }

      tr.appendChild(tdAgente);
      tr.appendChild(tdFuncao);
      tr.appendChild(tdPeriodo);
      tr.appendChild(tdDataContato);
      tr.appendChild(tdProtocolo);
      tr.appendChild(tdCriacao);
      tr.appendChild(tdNota);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    });
  }

  // Helpers de filtro com debounce
  function filtrar() {
    pagina = 1;
    carregarPagina({
      filtros: {
        agente: selectAgente.value,
        setor: selectSetor.value,
        ano: filtroAno.value,
        mes: filtroMes.value,
        periodo: filtroPeriodo.value
      },
      busca: buscaInput.value
    });
  }

  const debouncedFiltrar = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filtrar, 250);
  };

  // Eventos
  btnBuscar.addEventListener("click", filtrar);
  buscaInput.addEventListener("input", debouncedFiltrar);
  selectAgente.addEventListener("change", filtrar);
  selectSetor.addEventListener("change", filtrar);
  filtroAno.addEventListener("change", filtrar);
  filtroMes.addEventListener("change", filtrar);
  filtroPeriodo.addEventListener("change", filtrar);

  btnLimparFiltro.addEventListener("click", () => {
    buscaInput.value = "";
    selectAgente.value = "";
    filtroAno.value = "";
    filtroMes.value = "";
    filtroPeriodo.value = "";
    selectSetor.value = "";
    pagina = 1;
    carregarPagina();
  });

  btnProxima.addEventListener("click", () => {
    pagina++;
    carregarPagina({
      direction: "next",
      filtros: {
        agente: selectAgente.value,
        setor: selectSetor.value,
        ano: filtroAno.value,
        mes: filtroMes.value,
        periodo: filtroPeriodo.value
      },
      busca: buscaInput.value
    });
  });

  btnAnterior.addEventListener("click", () => {
    if (pagina > 1) pagina--;
    carregarPagina({
      direction: "prev",
      filtros: {
        agente: selectAgente.value,
        setor: selectSetor.value,
        ano: filtroAno.value,
        mes: filtroMes.value,
        periodo: filtroPeriodo.value
      },
      busca: buscaInput.value
    });
  });

  // Inicialização inteligente: seleciona ano/mês atuais
  const hoje = new Date();
  const anoAtual = hoje.getFullYear().toString();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const periodoMesAtual = `${anoAtual}-${mesAtual}`;

  // Autenticação e carregamento com role
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      // pega claim de role
      const tokenResult = await user.getIdTokenResult();
      isGestor = (tokenResult.claims.role || "").toString().toLowerCase() === "gestor";

      // Primeiro carregamento sem filtros para popular os selects
      await carregarPagina();

      // Agora aplica o filtro inteligente (ano e mês atuais) com selects já populados
      const hoje = new Date();
      const anoAtual = hoje.getFullYear().toString();
      const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
      const periodoMesAtual = `${anoAtual}-${mesAtual}`;

      await carregarPagina();
      filtroAno.value = anoAtual;
      filtroMes.value = periodoMesAtual;
      
      await carregarPagina({
        filtros: {
          ano: filtroAno.value,
          mes: filtroMes.value
        }
      });
    }
  });
});