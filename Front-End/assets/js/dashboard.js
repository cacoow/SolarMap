const CO2_FACTOR = 0.13125;
const DEFAULT_HISTORY = [
    { date: 'Jan', savingsMonthly: 150, energyGenerated: 290, savingsAnnual: 1800, co2Saved: 290 * CO2_FACTOR, panels: 6, requiredArea: 15.6, payback: 6.4 },
    { date: 'Fev', savingsMonthly: 160, energyGenerated: 300, savingsAnnual: 1920, co2Saved: 300 * CO2_FACTOR, panels: 6, requiredArea: 15.6, payback: 6.2 },
    { date: 'Mar', savingsMonthly: 175, energyGenerated: 310, savingsAnnual: 2100, co2Saved: 310 * CO2_FACTOR, panels: 7, requiredArea: 18.2, payback: 6.0 },
    { date: 'Abr', savingsMonthly: 187, energyGenerated: 320, savingsAnnual: 2244, co2Saved: 320 * CO2_FACTOR, panels: 7, requiredArea: 18.2, payback: 5.8 },
    { date: 'Mai', savingsMonthly: 190, energyGenerated: 330, savingsAnnual: 2280, co2Saved: 330 * CO2_FACTOR, panels: 7, requiredArea: 18.2, payback: 5.6 },
    { date: 'Jun', savingsMonthly: 185, energyGenerated: 315, savingsAnnual: 2220, co2Saved: 315 * CO2_FACTOR, panels: 7, requiredArea: 18.2, payback: 5.7 }
];

function formatCurrency(value) {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value, decimals = 0) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function getSavedSimulationHistory() {
    const raw = localStorage.getItem('solarmap_simulation_history');
    if (!raw) return null;
    try {
        const history = JSON.parse(raw);
        if (!Array.isArray(history)) return null;
        return history.map(item => ({
            ...item,
            savingsMonthly: Number(item.savingsMonthly) || 0,
            energyGenerated: Number(item.energyGenerated) || 0,
            savingsAnnual: Number(item.savingsAnnual) || 0,
            co2Saved: Number(item.co2Saved) || Number(item.energyGenerated || 0) * CO2_FACTOR,
            panels: Number(item.panels) || 0,
            requiredArea: Number(item.requiredArea) || 0,
            payback: Number(item.payback) || 0
        }));
    } catch {
        return null;
    }
}

function updateDashboardCards(latest) {
    const economiaEl = document.getElementById('economia-value');
    const energiaEl = document.getElementById('energia-value');
    const co2El = document.getElementById('co2-value');

    if (economiaEl) economiaEl.textContent = formatCurrency(latest.savingsMonthly);
    if (energiaEl) energiaEl.textContent = `${formatNumber(latest.energyGenerated)} kWh`;
    if (co2El) co2El.textContent = `${formatNumber(latest.co2Saved, 1)} kg`;
}

function renderCharts(history) {
    const labels = history.map(item => item.date);
    const economyData = history.map(item => item.savingsMonthly);
    const energyData = history.map(item => item.energyGenerated);

    const ctxEconomia = document.getElementById('grafico-economia');
    const ctxEnergia = document.getElementById('grafico-energia');

    if (ctxEconomia) {
        new Chart(ctxEconomia, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Economia Mensal',
                    data: economyData,
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(102, 187, 106, 0.25)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `R$ ${value}`
                        }
                    }
                }
            }
        });
    }

    if (ctxEnergia) {
        new Chart(ctxEnergia, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Energia Produzida',
                    data: energyData,
                    backgroundColor: '#4da6ff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `${value} kWh`
                        }
                    }
                }
            }
        });
    }
}

function renderHistoryList(history) {
    const historyList = document.getElementById('simulation-history');
    if (!historyList) return;

    historyList.innerHTML = '';

    if (!history.length) {
        historyList.innerHTML = '<li>Nenhuma simulação registrada. Faça uma simulação no painel para começar.</li>';
        return;
    }

    const recent = history.slice(-5).reverse();
    recent.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="history-row">
                <span><strong>${item.date}</strong></span>
                <span>R$ ${formatNumber(item.savingsMonthly, 2)} / ${formatNumber(item.energyGenerated)} kWh</span>
                <span>${formatNumber(item.co2Saved, 1)} kg CO₂</span>
                <span>Payback: ${formatNumber(item.payback, 1)} anos</span>
            </div>`;
        historyList.appendChild(li);
    });
}

function loadDashboard() {
    const savedHistory = getSavedSimulationHistory();
    const history = savedHistory && savedHistory.length ? savedHistory : DEFAULT_HISTORY;
    const latest = history[history.length - 1];

    updateDashboardCards(latest);
    renderCharts(history);
    renderHistoryList(history);
}

window.addEventListener('DOMContentLoaded', loadDashboard);
