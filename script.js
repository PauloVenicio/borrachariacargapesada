let itens = [];
let numeroNota = localStorage.getItem("numeroNota") || 1;

// Data automática
document.getElementById("dataAtual").innerText = new Date().toLocaleDateString("pt-BR");

// Número da nota automático
document.getElementById("numeroNota").innerText = numeroNota;

// ===== ADICIONAR ITEM =====
function adicionarItem() {
    const produto = document.getElementById("produto").value;
    const placa = document.getElementById("placa").value;
    const valor = document.getElementById("valor").value;

    if (produto === "" || placa === "" || valor === "") {
        alert("Preencha todos os campos!");
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        alert("Informe um valor válido!");
        return;
    }

    itens.push({
        produto,
        placa,
        valor: parseFloat(valor)
    });

    atualizarTabela();
    limparCampos();
}

// ===== LIMPAR CAMPOS =====
function limparCampos() {
    document.getElementById("produto").value = "";
    document.getElementById("placa").value = "";
    document.getElementById("valor").value = "";
}

// ===== ATUALIZAR TABELA =====
function atualizarTabela() {
    const tabela = document.getElementById("tabelaItens");
    tabela.innerHTML = "";

    let total = 0;

    itens.forEach((item, index) => {
        total += item.valor;

        tabela.innerHTML += `
            <tr>
                <td>${item.produto}</td>
                <td>${item.placa}</td>
                <td>R$ ${item.valor.toFixed(2)}</td>
                <td class="no-print">
                    <button onclick="removerItem(${index})">X</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("total").innerText = total.toFixed(2);
}

// ===== REMOVER ITEM =====
function removerItem(index) {
    itens.splice(index, 1);
    atualizarTabela();
}

// ===== GERAR PDF =====
function gerarPDF() {
    if (itens.length === 0) {
        alert("Adicione pelo menos um item!");
        return;
    }

    salvarHistorico();

    const elemento = document.querySelector(".container");

    html2pdf()
        .from(elemento)
        .save(`Nota_${numeroNota}.pdf`);

    numeroNota++;
    localStorage.setItem("numeroNota", numeroNota);
    document.getElementById("numeroNota").innerText = numeroNota;

    itens = [];
    atualizarTabela();
}

// ===== IMPRIMIR =====
function imprimirNota() {
    window.print();
}

// ===== WHATSAPP =====
function enviarWhatsApp() {
    const cliente = document.getElementById("cliente").value;
    const total = document.getElementById("total").innerText;
    const nota = document.getElementById("numeroNota").innerText;

    if (!cliente) {
        alert("Informe o nome do cliente!");
        return;
    }

    let mensagem = `Olá ${cliente}! Segue sua nota de serviço.\n\n`;
    mensagem += `Nota: ${nota}\n`;
    mensagem += `Total: R$ ${total}`;

    const telefone = "5599999999999"; // TROQUE para o número da borracharia

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
}

// ===== HISTÓRICO =====
function salvarHistorico() {
    const cliente = document.getElementById("cliente").value;
    const total = document.getElementById("total").innerText;

    const historico = JSON.parse(localStorage.getItem("historico")) || [];

    historico.push({
        nota: numeroNota,
        cliente: cliente,
        total: total,
        data: new Date().toLocaleDateString("pt-BR")
    });

    localStorage.setItem("historico", JSON.stringify(historico));
    mostrarHistorico();
}

// ===== MOSTRAR HISTÓRICO =====
function mostrarHistorico() {
    const lista = document.getElementById("historico");
    const historico = JSON.parse(localStorage.getItem("historico")) || [];

    lista.innerHTML = "";

    historico.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `Nota ${item.nota} - ${item.cliente} - R$ ${item.total} - ${item.data}`;
        lista.appendChild(li);
    });
}

// ===== TEMA ESCURO =====
function toggleTema() {
    document.body.classList.toggle("dark");
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
}

// ===== CARREGAR TEMA =====
if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
}

// ===== CARREGAR HISTÓRICO AO ABRIR =====
mostrarHistorico();
