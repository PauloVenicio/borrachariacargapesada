let itens = [];
let numeroNota = localStorage.getItem("numeroNota") || 1;
let pdfEmProcessamento = false;

function obterOpcoesPDF(nomeArquivo, removerLogo = false) {
    const executandoEmArquivoLocal = window.location.protocol === "file:";

    return {
        margin: 8,
        filename: nomeArquivo,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: !executandoEmArquivoLocal,
            allowTaint: false,
            logging: false,
            onclone: doc => {
                doc.querySelectorAll(".no-print").forEach(el => {
                    el.style.display = "none";
                });

                if (removerLogo && executandoEmArquivoLocal) {
                    // Em file:// imagens locais podem contaminar o canvas e bloquear toDataURL.
                    doc.querySelectorAll(".logo").forEach(el => el.remove());
                }
            }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
}

// Data automática
document.getElementById("dataAtual").innerText = new Date().toLocaleDateString("pt-BR");

// Número da nota automático
document.getElementById("numeroNota").innerText = numeroNota;
const campoPlaca = document.getElementById("placa");

if (campoPlaca) {
    campoPlaca.addEventListener("input", event => {
        event.target.value = event.target.value.toUpperCase();
    });
}

// ===== ADICIONAR ITEM =====
function adicionarItem() {
    const produto = document.getElementById("produto").value;
    const placa = document.getElementById("placa").value.toUpperCase().trim();
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
    const notaAtual = numeroNota;

    html2pdf()
        .set(obterOpcoesPDF(`Nota_${notaAtual}.pdf`))
        .from(elemento)
        .save()
        .catch(() => {
            // Fallback para ambiente local com restriÃ§Ã£o de canvas.
            return html2pdf()
                .set(obterOpcoesPDF(`Nota_${notaAtual}.pdf`, true))
                .from(elemento)
                .save();
        });

    numeroNota++;
    localStorage.setItem("numeroNota", numeroNota);
    document.getElementById("numeroNota").innerText = numeroNota;

    itens = [];
    atualizarTabela();
}

// ===== GERAR PDF (PROMISE) =====
function gerarPDFAsync() {
    if (itens.length === 0) {
        alert("Adicione pelo menos um item!");
        return null;
    }

    const elemento = document.querySelector(".container");
    const notaAtual = numeroNota;

    return html2pdf()
        .set(obterOpcoesPDF(`Nota_${notaAtual}.pdf`))
        .from(elemento)
        .outputPdf("blob")
        .then(blob => ({ blob, notaAtual }))
        .catch(() => {
            // Fallback para ambiente local com restriÃ§Ã£o de canvas.
            return html2pdf()
                .set(obterOpcoesPDF(`Nota_${notaAtual}.pdf`, true))
                .from(elemento)
                .outputPdf("blob")
                .then(blob => ({ blob, notaAtual }));
        });
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

    const telefone = "5599984272875"; // TROQUE para o número da borracharia

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
}

// ===== PDF + WHATSAPP =====
async function enviarPDFWhatsApp() {
    if (pdfEmProcessamento) {
        return;
    }

    const cliente = document.getElementById("cliente").value.trim();
    const total = document.getElementById("total").innerText;
    const telefone = "5599984272875";

    if (!cliente) {
        alert("Informe o nome do cliente!");
        return;
    }

    if (itens.length === 0) {
        alert("Adicione pelo menos um item!");
        return;
    }

    pdfEmProcessamento = true;

    try {
        const resultado = await gerarPDFAsync();
        if (!resultado) {
            return;
        }

        const { blob, notaAtual } = resultado;
        const nomeArquivo = `Nota_${notaAtual}.pdf`;
        const mensagem = `Olá ${cliente}! Segue sua nota de serviço.\nNota: ${notaAtual}\nTotal: R$ ${total}`;

        const arquivo = new File([blob], nomeArquivo, { type: "application/pdf" });
        const podeCompartilharArquivo =
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({ files: [arquivo] });

        if (podeCompartilharArquivo) {
            await navigator.share({
                title: `Nota ${notaAtual}`,
                text: mensagem,
                files: [arquivo]
            });
        } else {
            const linkBlob = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = linkBlob;
            a.download = nomeArquivo;
            a.click();
            URL.revokeObjectURL(linkBlob);

            const urlWhats = `https://wa.me/${telefone}?text=${encodeURIComponent(
                `${mensagem}\n\nPDF salvo no seu aparelho. Anexe o arquivo ${nomeArquivo} no WhatsApp para finalizar o envio.`
            )}`;
            window.open(urlWhats, "_blank");
        }

        salvarHistorico();
        numeroNota++;
        localStorage.setItem("numeroNota", numeroNota);
        document.getElementById("numeroNota").innerText = numeroNota;
        itens = [];
        atualizarTabela();
    } catch (erro) {
        alert("Não foi possível gerar/compartilhar o PDF agora.");
        console.error(erro);
    } finally {
        pdfEmProcessamento = false;
    }
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



