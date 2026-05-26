function calcularEconomia() {
    // Parâmetros técnicos realistas para a região de Sorocaba/SP
    const TARIFA_MEDIA = 0.92;      // R$/kWh (Média CPFL Piratininga com impostos)
    const HSP_MEDIA = 4.85;        // Horas de Sol Pleno (Média anual regional)
    const PERDAS_SISTEMA = 0.20;   // 20% (Perdas por temperatura, inversor e cabos)
    const POTENCIA_PAINEL = 550;   // Watts (Módulos monocristalinos atuais)
    const AREA_PAINEL = 2.6;       // m² por painel (incluindo folga de instalação)
    const CUSTO_WP_INSTALADO = 3.40; // R$ por Watt-pico (Preço médio de mercado instalado)
    const TAXA_DISP_KWH = 50;      // kWh (Custo de disponibilidade padrão para conexão bifásica)
    const CO2_FACTOR = 0.13125;    // kg CO₂ por kWh médio estimado
    const INFLACAO_ENERGETICA = 1.05; // 5% de aumento anual estimado na tarifa

    const contaMensal = parseFloat(document.getElementById('input-bill').value);
    const areaDisponivel = parseFloat(document.getElementById('input-area').value);

    if (isNaN(contaMensal)) {
        alert("Por favor, insira o valor da sua conta mensal.");
        return;
    }

    if (isNaN(contaMensal) || contaMensal < 150) {
        alert("Para viabilidade solar, a conta deve ser superior a R$ 150,00.");
        return;
    }

    // 1. Converter valor da conta em Consumo Estimado (kWh)
    const consumoKwhTotal = contaMensal / TARIFA_MEDIA;
    
    // 2. Calcular geração necessária (Descontando a taxa mínima obrigatória que o cliente ainda pagará)
    const geracaoAlvoKwh = Math.max(0, consumoKwhTotal - TAXA_DISP_KWH);
    
    // 3. Dimensionar a potência do sistema necessária (kWp)
    // Fórmula: Potência = Energia Mensal / (HSP * 30 dias * Eficiência)
    const potenciaSistemaKwp = geracaoAlvoKwh / (HSP_MEDIA * 30 * (1 - PERDAS_SISTEMA));

    // 4. Calcular quantidade de painéis e área real ocupada
    const paineisNecessarios = Math.ceil((potenciaSistemaKwp * 1000) / POTENCIA_PAINEL);
    const areaNecessaria = (paineisNecessarios * AREA_PAINEL).toFixed(1);

    // 5. Economia Real Mensal (Valor da energia que deixará de ser comprada)
    const economiaMensal = geracaoAlvoKwh * TARIFA_MEDIA;
    const economiaAnual = economiaMensal * 12;

    // 6. Investimento Estimado e Payback (Retorno sobre Investimento)
    const custoEstimado = (paineisNecessarios * POTENCIA_PAINEL) * CUSTO_WP_INSTALADO;
    const paybackAnos = (custoEstimado / (economiaAnual * INFLACAO_ENERGETICA)).toFixed(1);
    
    // Atualizar UI
    document.getElementById('res-monthly').textContent = `R$ ${economiaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('res-yearly').textContent = `R$ ${economiaAnual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('res-panels').textContent = `${paineisNecessarios} painéis (${areaNecessaria}m²)`;
    document.getElementById('res-payback').textContent = `${paybackAnos} anos (est.)`;

    saveSimulationResult({
        date: new Date().toLocaleDateString('pt-BR'),
        accountValue: contaMensal,
        availableArea: isNaN(areaDisponivel) ? 0 : areaDisponivel,
        savingsMonthly: economiaMensal,
        savingsAnnual: economiaAnual,
        energyGenerated: geracaoAlvoKwh,
        co2Saved: geracaoAlvoKwh * CO2_FACTOR,
        panels: paineisNecessarios,
        requiredArea: Number(areaNecessaria),
        payback: Number(paybackAnos)
    });

    // Alerta se a área não for suficiente
    if (!isNaN(areaDisponivel) && areaDisponivel < areaNecessaria) {
        alert(`Atenção: Sua área disponível (${areaDisponivel}m²) é menor que a necessária (${areaNecessaria}m²) para suprir 90% do seu consumo.`);
    }
}

function saveSimulationResult(result) {
    const storageKey = 'solarmap_simulation_history';
    const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
    history.push(result);
    if (history.length > 12) {
        history.splice(0, history.length - 12);
    }
    localStorage.setItem(storageKey, JSON.stringify(history));
}