function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercentage(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

function parseBrazilianValue(val) {
    if (!val) return 0;
    let cleaned = val.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function getSimulationSnapshot() {
    const periodicidadeRadio = document.querySelector('input[name="periodicidade"]:checked');
    const periodicidade = periodicidadeRadio ? periodicidadeRadio.value : 'trimestral';
    const labelPeriodo = periodicidade === 'trimestral' ? 'Trimestral' : 'Anual';
    const fat1 = parseBrazilianValue(document.getElementById('faturamento1').value);
    const fat2 = parseBrazilianValue(document.getElementById('faturamento2').value);
    const total = fat1 + fat2;
    const atividade1 = document.getElementById('atividade1');
    const atividade2 = document.getElementById('atividade2');
    const empresaNome = document.getElementById('empresaNome');
    const empresaCnpj = document.getElementById('empresaCnpj');

    return {
        periodicidade,
        labelPeriodo,
        empresaNome: empresaNome ? empresaNome.value.trim() : '',
        empresaCnpj: empresaCnpj ? empresaCnpj.value.trim() : '',
        faturamento1: fat1,
        faturamento2: fat2,
        faturamentoTotal: total,
        atividade1Nome: atividade1.options[atividade1.selectedIndex].text,
        atividade2Nome: atividade2.options[atividade2.selectedIndex].text,
        baseIrpjAntes: document.getElementById('baseIrpjAntes').textContent,
        baseIrpjDepois: document.getElementById('baseIrpjDepois').textContent,
        totalIrpjAntes: document.getElementById('totalIrpjAntes').textContent,
        totalIrpjDepois: document.getElementById('totalIrpjDepois').textContent,
        totalCsllAntes: document.getElementById('totalCsllAntes').textContent,
        totalCsllDepois: document.getElementById('totalCsllDepois').textContent,
        totalGeralAntes: document.getElementById('totalGeralAntes').textContent,
        totalGeralDepois: document.getElementById('totalGeralDepois').textContent,
        diferencaFinal: document.getElementById('diferencaFinal').textContent,
        percentualImpacto: document.getElementById('percentualImpacto').textContent
    };
}

function calcular() {
    console.log("Iniciando função calcular...");
    const periodicidadeRadio = document.querySelector('input[name="periodicidade"]:checked');
    if (!periodicidadeRadio) return;
    const periodicidade = periodicidadeRadio.value;
    
    const fat1_Periodo = parseBrazilianValue(document.getElementById('faturamento1').value);
    const fat2_Periodo = parseBrazilianValue(document.getElementById('faturamento2').value);
    
    const a1Select = document.getElementById('atividade1');
    const a2Select = document.getElementById('atividade2');
    const aliq1 = a1Select.value.split(',');
    const aliq2 = a2Select.value.split(',');
    
    const p1_Irpj = parseFloat(aliq1[0]);
    const p1_Csll = parseFloat(aliq1[1]);
    const p2_Irpj = parseFloat(aliq2[0]);
    const p2_Csll = parseFloat(aliq2[1]);

    let limiteAdicional = (periodicidade === 'trimestral') ? 60000 : 240000;
    let labelPeriodo = (periodicidade === 'trimestral') ? "trimestral" : "anual";

    const fatTotal_Periodo = fat1_Periodo + fat2_Periodo;
    const fatTotal_Anual = (periodicidade === 'trimestral') ? fatTotal_Periodo * 4 : fatTotal_Periodo;
    
    const limiteAnualNovaRegra = 5000000;
    const acrescimoRegra = 0.10;
    const aliquotaIrpjNormal = 0.15;
    const aliquotaCsllNormal = 0.09;

    // --- ANTES DA MUDANÇA ---
    const baseIrpjAntes = (fat1_Periodo * p1_Irpj) + (fat2_Periodo * p2_Irpj);
    const irpjAntesNormal = baseIrpjAntes * aliquotaIrpjNormal;
    const baseAdicionalAntes = Math.max(0, baseIrpjAntes - limiteAdicional);
    const adicionalIrpjAntes = baseAdicionalAntes * 0.10;
    const totalIrpjAntes = irpjAntesNormal + adicionalIrpjAntes;

    const baseCsllAntes = (fat1_Periodo * p1_Csll) + (fat2_Periodo * p2_Csll);
    const totalCsllAntes = baseCsllAntes * aliquotaCsllNormal;
    const totalGeralAntes = totalIrpjAntes + totalCsllAntes;

    // --- DEPOIS DA MUDANÇA (LC 224/2025) ---
    const excedenteAnualTotal = Math.max(0, fatTotal_Anual - limiteAnualNovaRegra);
    const excedentePeriodoTotal = (periodicidade === 'trimestral') ? (excedenteAnualTotal / 4) : excedenteAnualTotal;
    const proporcao1 = fat1_Periodo / (fatTotal_Periodo || 1);
    const proporcao2 = fat2_Periodo / (fatTotal_Periodo || 1);
    const exc1 = excedentePeriodoTotal * proporcao1;
    const exc2 = excedentePeriodoTotal * proporcao2;

    const baseIrpj1_Depois = ((fat1_Periodo - exc1) * p1_Irpj) + (exc1 * p1_Irpj * (1 + acrescimoRegra));
    const baseIrpj2_Depois = ((fat2_Periodo - exc2) * p2_Irpj) + (exc2 * p2_Irpj * (1 + acrescimoRegra));
    const baseIrpjDepois = baseIrpj1_Depois + baseIrpj2_Depois;

    const irpjDepoisNormal = baseIrpjDepois * aliquotaIrpjNormal;
    const baseAdicionalDepois = Math.max(0, baseIrpjDepois - limiteAdicional);
    const adicionalIrpjDepois = baseAdicionalDepois * 0.10;
    const totalIrpjDepois = irpjDepoisNormal + adicionalIrpjDepois;

    const baseCsll1_Depois = ((fat1_Periodo - exc1) * p1_Csll) + (exc1 * p1_Csll * (1 + acrescimoRegra));
    const baseCsll2_Depois = ((fat2_Periodo - exc2) * p2_Csll) + (exc2 * p2_Csll * (1 + acrescimoRegra));
    const baseCsllDepois = baseCsll1_Depois + baseCsll2_Depois;

    const totalCsllDepois = baseCsllDepois * aliquotaCsllNormal;
    const totalGeralDepois = totalIrpjDepois + totalCsllDepois;

    const diferencaFim = totalGeralDepois - totalGeralAntes;
    const percentualImpacto = fatTotal_Periodo > 0 ? (diferencaFim / fatTotal_Periodo) * 100 : 0;

    // Atualizar Tela
    const mapping = {
        'valorFatTotal': formatCurrency(fatTotal_Periodo),
        'baseIrpjAntes': formatCurrency(baseIrpjAntes),
        'baseIrpjDepois': formatCurrency(baseIrpjDepois),
        'irpjAntes': formatCurrency(irpjAntesNormal),
        'irpjDepois': formatCurrency(irpjDepoisNormal),
        'adicionalIrpjAntes': formatCurrency(adicionalIrpjAntes),
        'adicionalIrpjDepois': formatCurrency(adicionalIrpjDepois),
        'totalIrpjAntes': formatCurrency(totalIrpjAntes),
        'totalIrpjDepois': formatCurrency(totalIrpjDepois),
        'baseCsllAntes': formatCurrency(baseCsllAntes),
        'baseCsllDepois': formatCurrency(baseCsllDepois),
        'totalCsllAntes': formatCurrency(totalCsllAntes),
        'totalCsllDepois': formatCurrency(totalCsllDepois),
        'totalGeralAntes': formatCurrency(totalGeralAntes),
        'totalGeralDepois': formatCurrency(totalGeralDepois),
        'diferencaFinal': formatCurrency(diferencaFim) + " (aumento)",
        'percentualImpacto': formatPercentage(percentualImpacto)
    };

    for (let key in mapping) {
        const el = document.getElementById(key);
        if (el) el.textContent = mapping[key];
    }

    const explAntes = document.getElementById('expl-antes');
    if (explAntes) {
        explAntes.innerHTML = baseAdicionalAntes > 0 ? 
            `<strong>Antes:</strong> A base ${labelPeriodo} (${formatCurrency(baseIrpjAntes)}) excedeu ${formatCurrency(limiteAdicional)}. Excedente: <code>${formatCurrency(baseAdicionalAntes)}</code>, Adicional (10%): <code>${formatCurrency(adicionalIrpjAntes)}</code>.` :
            `<strong>Antes:</strong> Limite mensal de R$ ${formatCurrency(limiteAdicional)} não excedido.`;
    }

    const explDepois = document.getElementById('expl-depois');
    if (explDepois) {
        explDepois.innerHTML = baseAdicionalDepois > 0 ? 
            `<strong>Depois:</strong> A base ${labelPeriodo} (${formatCurrency(baseIrpjDepois)}) excedeu ${formatCurrency(limiteAdicional)}. Excedente: <code>${formatCurrency(baseAdicionalDepois)}</code>, Adicional (10%): <code>${formatCurrency(adicionalIrpjDepois)}</code>.` :
            `<strong>Depois:</strong> Limite mensal de R$ ${formatCurrency(limiteAdicional)} não excedido.`;
    }

    const resDiv = document.getElementById('results');
    if (resDiv) resDiv.style.display = 'block';

    document.querySelectorAll('.labelFaturamento').forEach(lbl => {
        lbl.textContent = periodicidade === 'trimestral' ? 
            lbl.textContent.replace('Anual', 'Trimestral') : 
            lbl.textContent.replace('Trimestral', 'Anual');
    });
}

function exportarParaPDF() {
    apresentarAoCliente(false, true);
    return;
    const periodicidadeRadio = document.querySelector('input[name="periodicidade"]:checked');
    const periodicidade = periodicidadeRadio ? periodicidadeRadio.value : 'trimestral';
    const labelPeriodoStr = periodicidade === 'trimestral' ? 'TRIMESTRE' : 'ANO';
    const limiteVal = periodicidade === 'trimestral' ? 60000 : 240000;
    
    const f1 = parseBrazilianValue(document.getElementById('faturamento1').value);
    const f2 = parseBrazilianValue(document.getElementById('faturamento2').value);
    const sel1 = document.getElementById('atividade1');
    const ativ1_Nome = sel1.options[sel1.selectedIndex].text.toUpperCase();
    const aliq1 = sel1.value.split(',');
    
    const sel2 = document.getElementById('atividade2');
    const ativ2_Nome = sel2.options[sel2.selectedIndex].text.toUpperCase();
    const aliq2 = sel2.value.split(',');

    const base1 = f1 * parseFloat(aliq1[0]);
    const base2 = f2 * parseFloat(aliq2[0]);
    const totalBaseIrpj = base1 + base2;
    const excedenteBase = Math.max(0, totalBaseIrpj - limiteVal);

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Relatório de Simulação Tributária</title>
            ${autoDownloadPdf ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>' : ''}
            <style>
                @page { margin: 1cm; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 20px; line-height: 1.6; }
                .top-header { border-bottom: 2px solid #010969; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .report-title { color: #010969; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
                .date-info { font-size: 12px; color: #666; }
                
                .summary-card { background: #f8f9fa; border: 1px solid #dee2e6; border-left: 5px solid #010969; padding: 20px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 20px; }
                .card-item { flex: 1; min-width: 200px; }
                .card-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                .card-value { font-size: 18px; font-weight: bold; color: #010969; }
                
                .section-header { background: #333; color: white; padding: 10px 15px; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 30px; border-radius: 4px 4px 0 0; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #dee2e6; padding: 12px 15px; text-align: left; }
                th { background-color: #f1f1f1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .total-row { background-color: #f1f3f5; font-weight: bold; }
                .grand-total { background-color: #010969; color: white; font-weight: bold; }
                
                .highlight-row { background-color: #fffac2; }
                .red-alert { background-color: #fff5f5; border: 1px solid #feb2b2; padding: 15px; border-radius: 8px; margin-top: 20px; display: flex; align-items: center; justify-content: space-between; }
                .alert-text { color: #c0392b; font-size: 18px; font-weight: bold; }
                
                .adicional-calc { background: #fff5f5; border: 1px solid #feb2b2; padding: 15px; margin-top: 10px; }
                .adicional-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #feb2b2; }
                .adicional-label { font-size: 12px; font-weight: bold; color: #822727; }
                .adicional-val { font-size: 14px; color: #c53030; }
                
                .footer { margin-top: 50px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                .no-print { display: flex; justify-content: center; gap: 10px; margin-top: 30px; }
                button { padding: 12px 30px; border-radius: 5px; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; }
                .btn-print { background: #010969; color: white; }
                .btn-print:hover { background: #01054d; }
                @media print { .no-print { display: none; } .section-header { -webkit-print-color-adjust: exact; } .grand-total { -webkit-print-color-adjust: exact; background-color: #010969 !important; color: white !important; } }
            </style>
        </head>
        <body>
            <div class="top-header">
                <h1 class="report-title">Simulação Tributária IRPJ / CSLL</h1>
                <div class="date-info">Referente à LC 224/2025 • Emissão: ${dataAtual}</div>
            </div>

            <div class="summary-card">
                <div class="card-item">
                    <div class="card-label">Periodicidade</div>
                    <div class="card-value">${labelPeriodoStr}</div>
                </div>
                <div class="card-item">
                    <div class="card-label">Faturamento Total</div>
                    <div class="card-value">${formatCurrency(f1 + f2)}</div>
                </div>
            </div>

            <div class="section-header">Quadro Comparativo de Impostos</div>
            <table>
                <thead>
                    <tr><th>Descrição Técnica</th><th class="right">Cenário Atual</th><th class="right">Nova Regra (LC 224)</th></tr>
                </thead>
                <tbody>
                    <tr><td class="bold">Base de Cálculo IRPJ</td><td class="right">${document.getElementById('baseIrpjAntes').textContent}</td><td class="right">${document.getElementById('baseIrpjDepois').textContent}</td></tr>
                    <tr><td>Alíquota IRPJ (15%)</td><td class="right">${document.getElementById('irpjAntes').textContent}</td><td class="right">${document.getElementById('irpjDepois').textContent}</td></tr>
                    <tr class="highlight-row"><td>Adicional IRPJ (10%)</td><td class="right">${document.getElementById('adicionalIrpjAntes').textContent}</td><td class="right">${document.getElementById('adicionalIrpjDepois').textContent}</td></tr>
                    <tr class="total-row"><td>SUBTOTAL IRPJ</td><td class="right">${document.getElementById('totalIrpjAntes').textContent}</td><td class="right">${document.getElementById('totalIrpjDepois').textContent}</td></tr>
                    
                    <tr><td colspan="3" style="height: 10px; border:none;"></td></tr>
                    
                    <tr><td class="bold">Base de Cálculo CSLL</td><td class="right">${document.getElementById('baseCsllAntes').textContent}</td><td class="right">${document.getElementById('baseCsllDepois').textContent}</td></tr>
                    <tr class="total-row"><td>SUBTOTAL CSLL (9%)</td><td class="right">${document.getElementById('totalCsllAntes').textContent}</td><td class="right">${document.getElementById('totalCsllDepois').textContent}</td></tr>
                    
                    <tr><td colspan="3" style="height: 10px; border:none;"></td></tr>
                    
                    <tr class="grand-total">
                        <td>TOTAL GERAL DE IMPOSTOS</td>
                        <td class="right">${document.getElementById('totalGeralAntes').textContent}</td>
                        <td class="right">${document.getElementById('totalGeralDepois').textContent}</td>
                    </tr>
                </tbody>
            </table>

            <div class="red-alert">
                <div style="font-size: 12px; color: #666; text-transform: uppercase;">Aumento Identificado</div>
                <div class="alert-text">DIFERENÇA A PAGAR: ${document.getElementById('diferencaFinal').textContent.split('(')[0].trim()}</div>
            </div>

            <div style="page-break-before: always;"></div>

            <div class="section-header">Memória de Cálculo do Adicional</div>
            <p style="font-size: 13px; color: #666;">Detalhamento da presunção por atividade (Novo Adicional da Lei 224):</p>
            <table>
                <thead>
                    <tr><th>Atividade Presumida</th><th class="right">Faturamento</th><th class="right">Presunção</th><th class="right">Base de Cálculo</th></tr>
                </thead>
                <tbody>
                    <tr><td>${ativ1_Nome}</td><td class="right">${formatCurrency(f1)}</td><td class="right">${(parseFloat(aliq1[0])*100).toFixed(2)}%</td><td class="right">${formatCurrency(base1)}</td></tr>
                    <tr><td>${ativ2_Nome}</td><td class="right">${formatCurrency(f2)}</td><td class="right">${(parseFloat(aliq2[0])*100).toFixed(2)}%</td><td class="right">${formatCurrency(base2)}</td></tr>
                    <tr class="total-row"><td colspan="3">BASE TRIBUTÁVEL TOTAL</td><td class="right">${formatCurrency(totalBaseIrpj)}</td></tr>
                </tbody>
            </table>

            <div class="adicional-calc">
                <div class="adicional-row">
                    <span class="adicional-label">Base Tributável Total</span>
                    <span class="adicional-val">${formatCurrency(totalBaseIrpj)}</span>
                </div>
                <div class="adicional-row">
                    <span class="adicional-label">Limite de Isenção (${labelPeriodoStr})</span>
                    <span class="adicional-val">(-) ${formatCurrency(limiteVal)}</span>
                </div>
                <div class="adicional-row" style="border-bottom: 2px solid #feb2b2;">
                    <span class="adicional-label">Excedente Tributável (10%)</span>
                    <span class="adicional-val">(=) ${formatCurrency(excedenteBase)}</span>
                </div>
                <div class="adicional-row" style="border:none; margin-top: 10px;">
                    <span class="adicional-label" style="font-size: 16px;">VALOR DO ADICIONAL</span>
                    <span class="adicional-val" style="font-size: 20px; font-weight: bold;">${document.getElementById('adicionalIrpjDepois').textContent}</span>
                </div>
            </div>

            <div class="footer">
                Relatório gerado automaticamente por Simulador Tributário. Os cálculos refletem as alíquotas vigentes e o novo impacto da LC 224/2025.
            </div>

            <div class="no-print">
                <button class="btn-print" onclick="window.print()">IMPRIMIR RELATÓRIO</button>
            </div>
            ${autoDownloadPdf ? `
                <script>
                    window.addEventListener('load', function () {
                        const element = document.getElementById('presentationRoot');
                        const options = {
                            margin: 0,
                            filename: 'apresentacao-cliente.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                            pagebreak: { mode: ['css', 'legacy'] }
                        };

                        html2pdf().set(options).from(element).save().then(function () {
                            window.close();
                        });
                    });
                <\/script>
            ` : ''}
        </body>
        </html>
    `);
    win.document.close();
    if (autoPrint && !autoDownloadPdf) {
        win.addEventListener('load', () => {
            win.print();
        });
    }
}

function apresentarAoCliente(autoPrint = false, autoDownloadPdf = false) {
    const dados = getSimulationSnapshot();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const win = window.open('', '_blank');
    const logoSrc = 'j:/Público/2. Materiais Padrão JP/Documentos Padrão 2024/LOGOS/logo sem fundo/logo-jp-2023_Prancheta 1 cópia 7.png';

    win.document.write(`
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Apresentação ao Cliente</title>
            <style>
                :root {
                    --jp-blue: #010969;
                    --jp-orange: #e85909;
                    --jp-ink: #1f2937;
                    --jp-soft: #f6f8fc;
                    --jp-line: #dbe3f1;
                    --white: #ffffff;
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    color: var(--jp-ink);
                    background: linear-gradient(180deg, #eef3ff 0%, #ffffff 45%, #fff5ef 100%);
                }
                .presentation {
                    width: min(1120px, calc(100% - 48px));
                    margin: 24px auto 48px;
                }
                .slide {
                    background: var(--white);
                    border-radius: 24px;
                    margin-bottom: 28px;
                    overflow: hidden;
                    box-shadow: 0 18px 50px rgba(1, 9, 105, 0.10);
                    border: 1px solid rgba(1, 9, 105, 0.08);
                    min-height: 680px;
                    position: relative;
                }
                .slide::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(circle at top right, rgba(232, 89, 9, 0.14), transparent 28%),
                        radial-gradient(circle at bottom left, rgba(1, 9, 105, 0.10), transparent 30%);
                    pointer-events: none;
                }
                .slide-content {
                    position: relative;
                    z-index: 1;
                    padding: 56px;
                }
                .hero {
                    background: linear-gradient(135deg, var(--jp-blue) 0%, #10229f 65%, var(--jp-orange) 100%);
                    color: var(--white);
                }
                .hero .slide-content {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 560px;
                }
                .hero-stack {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: space-evenly;
                    min-height: 420px;
                }
                .hero-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    min-height: 54px;
                    margin-top: -1.5cm;
                }
                .hero-logo {
                    max-width: 250px;
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                    filter: brightness(0) invert(1);
                }
                .hero-brand {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0;
                }
                .hero-company {
                    display: grid;
                    gap: 6px;
                    padding: 14px 18px;
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.10);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    max-width: 560px;
                    margin-top: -1.5cm;
                }
                .hero-company-name {
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.15;
                }
                .hero-company-cnpj {
                    font-size: 14px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.82);
                }
                .hero-main {
                    padding-top: 0;
                }
                .eyebrow {
                    font-size: 13px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    opacity: 0.85;
                    margin-bottom: 18px;
                }
                h1, h2, h3, p {
                    margin: 0;
                }
                h1 {
                    font-size: clamp(42px, 6vw, 72px);
                    line-height: 0.98;
                    max-width: 760px;
                    margin-bottom: 20px;
                }
                h2 {
                    color: var(--jp-blue);
                    font-size: 34px;
                    margin-bottom: 16px;
                }
                .hero-subtitle {
                    font-size: 22px;
                    line-height: 1.4;
                    max-width: 720px;
                    color: rgba(255, 255, 255, 0.9);
                }
                .hero-footer {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    margin-top: 40px;
                }
                .hero-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 999px;
                    padding: 12px 18px;
                    font-size: 14px;
                }
                .metrics {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 18px;
                    margin-top: 28px;
                }
                .metric-card {
                    padding: 26px;
                    border-radius: 20px;
                    background: var(--jp-soft);
                    border: 1px solid var(--jp-line);
                }
                .metric-card.featured {
                    background: linear-gradient(135deg, rgba(232, 89, 9, 0.12) 0%, rgba(1, 9, 105, 0.06) 100%);
                    border-color: rgba(232, 89, 9, 0.35);
                }
                .metric-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: #667085;
                    margin-bottom: 10px;
                }
                .metric-value {
                    font-size: 36px;
                    line-height: 1.05;
                    font-weight: 700;
                    color: var(--jp-blue);
                }
                .metric-value.impact {
                    color: var(--jp-orange);
                }
                .metric-note {
                    margin-top: 10px;
                    font-size: 15px;
                    color: #475467;
                    line-height: 1.45;
                }
                .two-columns {
                    display: grid;
                    grid-template-columns: 1.1fr 0.9fr;
                    gap: 24px;
                    margin-top: 26px;
                }
                .panel {
                    background: #ffffff;
                    border: 1px solid var(--jp-line);
                    border-radius: 20px;
                    padding: 24px;
                }
                .panel.dark {
                    background: var(--jp-blue);
                    color: var(--white);
                    border-color: transparent;
                }
                .panel.dark h3,
                .panel.dark .big-number,
                .panel.dark .list strong {
                    color: var(--white);
                }
                .panel h3 {
                    color: var(--jp-blue);
                    font-size: 20px;
                    margin-bottom: 18px;
                }
                .big-number {
                    font-size: 52px;
                    font-weight: 800;
                    color: var(--jp-orange);
                    line-height: 1;
                    margin-bottom: 14px;
                }
                .list {
                    display: grid;
                    gap: 14px;
                }
                .list-item {
                    padding: 16px 18px;
                    border-radius: 16px;
                    background: var(--jp-soft);
                    border: 1px solid var(--jp-line);
                }
                .panel.dark .list-item {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.12);
                }
                .list strong {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--jp-blue);
                    font-size: 15px;
                }
                .list span {
                    font-size: 15px;
                    line-height: 1.5;
                    color: inherit;
                }
                .comparison-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 24px;
                    overflow: hidden;
                    border-radius: 18px;
                }
                .comparison-table th,
                .comparison-table td {
                    padding: 18px 20px;
                    border-bottom: 1px solid var(--jp-line);
                    text-align: left;
                }
                .comparison-table th {
                    background: var(--jp-blue);
                    color: var(--white);
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .comparison-table td:last-child,
                .comparison-table th:last-child,
                .comparison-table td:nth-child(2),
                .comparison-table th:nth-child(2) {
                    text-align: right;
                }
                .comparison-table td:nth-child(3),
                .comparison-table th:nth-child(3) {
                    text-align: right;
                }
                .comparison-table tr:last-child td {
                    border-bottom: none;
                }
                .comparison-table .highlight td {
                    background: rgba(232, 89, 9, 0.08);
                    font-weight: 700;
                }
                .section-text {
                    font-size: 18px;
                    line-height: 1.6;
                    color: #475467;
                    max-width: 760px;
                }
                .accent {
                    color: var(--jp-orange);
                    font-weight: 700;
                }
                .footer-actions {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 18px;
                }
                .footer-actions button {
                    border: none;
                    border-radius: 999px;
                    padding: 14px 22px;
                    font-weight: 700;
                    cursor: pointer;
                    letter-spacing: 0.04em;
                }
                .footer-actions .print {
                    background: var(--jp-blue);
                    color: var(--white);
                }
                .footer-actions .close {
                    background: var(--jp-orange);
                    color: var(--white);
                }
                @media print {
                    html, body {
                        width: 210mm;
                        margin: 0;
                        padding: 0;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    body * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .presentation {
                        width: 190mm;
                        margin: 0 auto;
                    }
                    .slide {
                        box-shadow: none;
                        border: none;
                        border-radius: 0;
                        margin: 0;
                        page-break-after: always;
                        break-after: page;
                        overflow: visible;
                    }
                    .slide:last-of-type { page-break-after: auto; }
                    .footer-actions { display: none; }
                    .hero {
                        background: linear-gradient(135deg, var(--jp-blue) 0%, #10229f 65%, var(--jp-orange) 100%) !important;
                    }
                    .comparison-table .highlight td,
                    .metric-card.featured,
                    .panel.dark,
                    .hero-chip,
                    .hero-company {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                @media (max-width: 900px) {
                    .presentation { width: calc(100% - 24px); margin: 12px auto 32px; }
                    .slide-content { padding: 28px; }
                    .metrics,
                    .two-columns { grid-template-columns: 1fr; }
                    .hero .slide-content { min-height: auto; }
                    .hero-stack { min-height: auto; gap: 28px; justify-content: flex-start; }
                    .hero-top { margin-top: 0; }
                    .hero-company { max-width: 100%; margin-top: 0; }
                    .hero-logo { max-width: 200px; }
                    .metric-value { font-size: 30px; }
                    .big-number { font-size: 42px; }
                }
            </style>
        </head>
        <body>
            <div class="presentation" id="presentationRoot">
                <section class="slide hero">
                    <div class="slide-content">
                        <div class="hero-stack">
                            <div class="hero-top">
                                <div class="hero-brand">
                                    <img class="hero-logo" src="${logoSrc}" alt="JP Contábil">
                                </div>
                            </div>
                            ${(dados.empresaNome || dados.empresaCnpj) ? `
                                <div class="hero-company">
                                    ${dados.empresaNome ? `<div class="hero-company-name">${dados.empresaNome}</div>` : ''}
                                    ${dados.empresaCnpj ? `<div class="hero-company-cnpj">CNPJ ${dados.empresaCnpj}</div>` : ''}
                                </div>
                            ` : ''}
                            <div class="hero-main">
                                <h1>Impacto tributário da nova regra no Lucro Presumido</h1>
                            </div>
                        </div>
                        <div class="hero-footer">
                            <div class="hero-chip">Periodicidade analisada: ${dados.labelPeriodo}</div>
                            <div class="hero-chip">Emissão: ${dataAtual}</div>
                        </div>
                    </div>
                </section>

                <section class="slide">
                    <div class="slide-content">
                        <div class="eyebrow" style="color: var(--jp-orange);">Resumo Financeiro</div>
                        <h2>O que muda no resultado</h2>
                        <p class="section-text">A simulação compara o cenário atual com a nova regra aplicada sobre a base presumida, evidenciando o aumento projetado na carga tributária total.</p>

                        <div class="metrics">
                            <div class="metric-card">
                                <div class="metric-label">Faturamento do período</div>
                                <div class="metric-value">${formatCurrency(dados.faturamentoTotal)}</div>
                                <div class="metric-note">Soma das duas frentes de faturamento informadas na calculadora.</div>
                            </div>
                            <div class="metric-card featured">
                                <div class="metric-label">Diferença a pagar</div>
                                <div class="metric-value impact">${dados.diferencaFinal.split('(')[0].trim()}</div>
                                <div class="metric-note">Valor incremental estimado entre o cenário atual e a nova regra.</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">Impacto sobre o faturamento</div>
                                <div class="metric-value">${dados.percentualImpacto}</div>
                                <div class="metric-note">Representação percentual do aumento tributário sobre a receita do período.</div>
                            </div>
                        </div>

                        <div class="panel dark" style="margin-top: 26px;">
                            <h3>Leitura executiva</h3>
                            <div class="big-number">${dados.percentualImpacto}</div>
                            <div class="list">
                                <div class="list-item">
                                    <strong>Mensagem principal</strong>
                                    <span>A nova regra eleva o custo tributário estimado no período analisado.</span>
                                </div>
                                <div class="list-item">
                                    <strong>Ponto de atenção</strong>
                                    <span>O valor adicional projetado é de <span class="accent">${dados.diferencaFinal.split('(')[0].trim()}</span>.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="slide">
                    <div class="slide-content">
                        <div class="eyebrow" style="color: var(--jp-orange);">Comparativo</div>
                        <h2>Cenário atual x nova regra</h2>
                        <p class="section-text">A tabela abaixo resume os totais já apurados na calculadora e apresenta o deslocamento entre o modelo atual e a projeção após a mudança.</p>

                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Indicador</th>
                                    <th>Cenário atual</th>
                                    <th>Nova regra</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Total IRPJ</td>
                                    <td>${dados.totalIrpjAntes}</td>
                                    <td>${dados.totalIrpjDepois}</td>
                                </tr>
                                <tr>
                                    <td>Total CSLL</td>
                                    <td>${dados.totalCsllAntes}</td>
                                    <td>${dados.totalCsllDepois}</td>
                                </tr>
                                <tr>
                                    <td>Total de impostos</td>
                                    <td>${dados.totalGeralAntes}</td>
                                    <td>${dados.totalGeralDepois}</td>
                                </tr>
                                <tr class="highlight">
                                    <td>Diferença a pagar</td>
                                    <td colspan="2">${dados.diferencaFinal}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="two-columns">
                            <div class="panel">
                                <h3>Base IRPJ</h3>
                                <div class="list">
                                    <div class="list-item">
                                        <strong>Antes</strong>
                                        <span>${dados.baseIrpjAntes}</span>
                                    </div>
                                    <div class="list-item">
                                        <strong>Depois</strong>
                                        <span>${dados.baseIrpjDepois}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="panel">
                                <h3>Conclusão para o cliente</h3>
                                <div class="list">
                                    <div class="list-item">
                                        <strong>Impacto financeiro</strong>
                                        <span>Há um acréscimo estimado de <span class="accent">${dados.diferencaFinal.split('(')[0].trim()}</span> na carga tributária do ${dados.labelPeriodo.toLowerCase()} analisado.</span>
                                    </div>
                                    <div class="list-item">
                                        <strong>Representatividade</strong>
                                        <span>Esse aumento corresponde a <span class="accent">${dados.percentualImpacto}</span> do faturamento informado.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="footer-actions">
                    <button class="print" onclick="window.print()">Imprimir apresentação</button>
                    <button class="close" onclick="window.close()">Fechar</button>
                </div>
            </div>
        </body>
        </html>
    `);

    win.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.money-input').forEach(input => {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value === '') {
                e.target.value = '';
            } else {
                value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                e.target.value = value;
            }
            calcular();
        });
    });
    document.querySelectorAll('.atividade-select').forEach(sel => sel.addEventListener('change', calcular));
    document.querySelectorAll('input[name="periodicidade"]').forEach(radio => radio.addEventListener('change', calcular));
    calcular();
});
