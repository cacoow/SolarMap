let map;
let marker;
let userLocationMarker;
let infoWindow;
let placesService;
let solarHeatmap;
const API_KEY = 'SUA_API_KEY_AQUI'; // Idealmente carregado de uma variável de ambiente ou config segura

function initMap() {
    // Coordenadas iniciais (Brasil - centro)
    const brazilCenter = { lat: -14.2350, lng: -51.9253 };
    
    // Criar o mapa com configurações otimizadas
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: brazilCenter,
        mapTypeId: 'roadmap', // Mostrar nomes e pontos de interesse
        gestureHandling: 'greedy', // Permitir gestos de zoom com scroll
        fullscreenControl: true, // Botão de tela cheia
        mapTypeControl: true, // Permitir trocar tipo de mapa
        streetViewControl: true, // Street view
        zoomControl: true // Controle de zoom
    });
    
    // Inicializar Geocoder para pesquisa de CEP
    inicializarGeocoder();
    
    // Inicializar a infoWindow e Places Service
    infoWindow = new google.maps.InfoWindow();
    placesService = new google.maps.places.PlacesService(map);
    
    // Inicializar listeners das novas funcionalidades
    inicializarListenersNovasFuncionalidades();
    
    // Obter localização do usuário
    getUserLocation();
    
    // Buscar pontos de interesse quando o mapa acabar de se mover
    map.addListener('idle', function() {
        buscarPontosDeInteresse();
    });
}

async function obterDadosSolarAPI(lat, lng) {
    try {
        // Usar Solar API do Google Cloud
        const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.solarPotential) {
            // Extrair dados de radiação solar
            const radiationData = data.solarPotential.solarPanelConfigs || [];
            if (radiationData.length > 0) {
                const yearlyKwhPerKw = radiationData[0].yearlyEnergyDcKwh || 1000;
                return yearlyKwhPerKw;
            }
        }
        return null;
    } catch (error) {
        console.warn('Erro ao obter dados da Solar API:', error);
        return null;
    }
}

async function gerarDadosSolares() {
    // Gerar pontos de dados solares baseados na visão atual do mapa
    const bounds = map.getBounds();
    if (!bounds) return [];
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const pontoDados = [];
    const step = (ne.lat() - sw.lat()) / 10; // Grade de 10x10 pontos
    
    for (let lat = sw.lat(); lat <= ne.lat(); lat += step) {
        for (let lng = sw.lng(); lng <= ne.lng(); lng += step) {
            // Tentar obter dados reais da Solar API
            let radiacao = await obterDadosSolarAPI(lat, lng);
            
            if (!radiacao) {
                // Fallback: calcular baseado em latitude/longitude
                const distanciaDoEquador = Math.abs(lat);
                radiacao = 1000 - (distanciaDoEquador * 5);
                radiacao += Math.sin(lng * 0.5) * 100;
                radiacao += Math.random() * 150 - 75;
            }
            
            // Normalizar e limitar
            radiacao = Math.max(200, Math.min(1200, radiacao));
            
            pontoDados.push({
                location: new google.maps.LatLng(lat, lng),
                weight: radiacao / 1200 // Normalizar entre 0 e 1
            });
        }
    }
    
    return pontoDados;
}

async function atualizarHeatmapSolar() {
    const dados = await gerarDadosSolares();
    
    if (solarHeatmap) {
        solarHeatmap.setData(dados);
    } else {
        solarHeatmap = new google.maps.visualization.HeatmapLayer({
            data: dados,
            map: map,
            radius: 50,
            opacity: 0.45,
            maxIntensity: 1,
            dissipating: true,
            gradient: [
                '#00008B', // Azul muito escuro - muito frio
                '#0000FF', // Azul puro - frio
                '#00FFFF', // Ciano - frio-moderado
                '#90EE90', // Verde claro - moderado
                '#FFFF00', // Amarelo - quente
                '#FFD700', // Ouro - muito quente
                '#FFA500', // Laranja - muito quente
                '#FF6347', // Vermelho-laranja - muito quente
                '#FF0000', // Vermelho - quente
                '#8B0000'  // Vermelho escuro - extremamente quente
            ]
        });
    }
}

function buscarPontosDeInteresse() {
    const boundary = map.getBounds();
    
    if (!boundary) return;
    
    // Tipos de pontos de interesse a buscar
    const tiposDeInteresse = [
        'shopping_mall',
        'city_hall', 
        'park',
        'museum',
        'restaurant',
        'landmark'
    ];
    
    // Buscar cada tipo de ponto de interesse
    tiposDeInteresse.forEach(tipo => {
        const request = {
            bounds: boundary,
            type: tipo
        };
        
        placesService.nearbySearch(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(place => {
                    criarMarcadorPOI(place);
                });
            }
        });
    });
}

function criarMarcadorPOI(place) {
    const marcador = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name
    });
    
    // Adicionar listener para clicar
    marcador.addListener('click', function() {
        infoWindow.setContent(`
            <div style="padding: 10px; max-width: 250px;">
                <strong>${place.name}</strong><br>
                <small>${place.types.slice(0, 2).join(', ')}</small>
                ${place.rating ? `<br>⭐ ${place.rating}` : ''}
                ${place.vicinity ? `<br>${place.vicinity}` : ''}
            </div>
        `);
        infoWindow.open(map, marcador);
    });
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Centralizar mapa na localização do usuário
                map.setCenter(userLocation);
                map.setZoom(14);
                
                // Adicionar marcador da localização do usuário
                userLocationMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Sua Localização',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                });
                
                // Atualizar dados com localização do usuário
                updateRegionData(userLocation);
            },
            function(error) {
                console.warn('Erro ao obter localização: ' + error.message);
                console.log('Usando localização padrão do Brasil');
            }
        );
    } else {
        console.log('Geolocalização não suportada por este navegador');
    }
}

function placeMarker(location) {
    if (marker) {
        marker.setPosition(location);
    } else {
        marker = new google.maps.Marker({
            position: location,
            map: map,
            title: `${location.lat().toFixed(4)}, ${location.lng().toFixed(4)}`
        });
    }
    
    // Atualizar dados da região
    updateRegionData(location);
}

function updateRegionData(location) {
    const regionElement = document.querySelectorAll('.card')[1].querySelectorAll('p')[0];
    const irradianciaElement = document.querySelectorAll('.card')[1].querySelectorAll('p')[1];
    const potentialElement = document.querySelectorAll('.card')[1].querySelectorAll('p')[2];

    // Calcular radiação solar para a localização
    const distanciaDoEquador = Math.abs(location.lat());
    let radiacao = 1000 - (distanciaDoEquador * 5);
    radiacao += Math.sin(location.lng() * 0.5) * 100;
    radiacao = Math.max(200, Math.min(1200, radiacao));
    
    // Determinar potencial
    let potencial = 'Baixo';
    if (radiacao > 900) potencial = 'Alto';
    else if (radiacao > 700) potencial = 'Médio';
    
    regionElement.innerHTML = `<strong>Região:</strong> ${location.lat().toFixed(4)}, ${location.lng().toFixed(4)}`;
    irradianciaElement.innerHTML = `<strong>Irradiação:</strong> ~${radiacao.toFixed(0)} W/m²`;
    potentialElement.innerHTML = `<strong>Potencial:</strong> ${potencial}`;
}

// ===== NOVAS FUNCIONALIDADES - PESQUISA DE CEP E ANÁLISE SOLAR =====

// Instâncias globais para Geocoder e Solar API
let geocoder;
let ultimosDadosSolares = {}; // Cache dos últimos dados solares consultados

/**
 * Inicializa o Geocoder quando o mapa é criado
 */
function inicializarGeocoder() {
    geocoder = new google.maps.Geocoder();
}

/**
 * Busca um CEP brasileiro e centraliza o mapa no local encontrado
 * @param {string} cep - CEP no formato XXXXX-XXX ou XXXXXXXX
 */
async function buscarCep(cep) {
    const botao = document.getElementById('cep-search-button');
    const mensagemDiv = document.getElementById('cep-message');
    
    // Limpar mensagens anteriores
    mensagemDiv.classList.remove('show', 'error', 'success');
    mensagemDiv.innerHTML = '';
    
    // Validação básica do CEP
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
        mostrarMensagemCep('❌ CEP inválido. Digite 8 dígitos.', 'error');
        return;
    }
    
    // Desabilitar botão durante a busca
    botao.disabled = true;
    botao.innerHTML = '<span class="loading-spinner"></span>Buscando...';
    
    try {
        // Formatar CEP para o padrão brasileiro (XXXXX-XXX)
        const cepFormatado = cepLimpo.substring(0, 5) + '-' + cepLimpo.substring(5);
        
        // Usar Geocoding API do Google
        const request = {
            address: `${cepFormatado}, Brasil`
        };
        
        geocoder.geocode(request, async function(results, status) {
            if (status === 'OK' && results.length > 0) {
                const resultado = results[0];
                const localizacao = resultado.geometry.location;
                const latitude = localizacao.lat();
                const longitude = localizacao.lng();
                
                // Centralizar mapa no local encontrado
                map.setCenter(localizacao);
                map.setZoom(18);
                
                // Criar/atualizar marcador
                if (marker) {
                    marker.setPosition(localizacao);
                } else {
                    marker = new google.maps.Marker({
                        position: localizacao,
                        map: map,
                        title: resultado.formatted_address
                    });
                }
                
                // Mostrar mensagem de sucesso
                mostrarMensagemCep(`✅ CEP encontrado: ${resultado.formatted_address}`, 'success');
                
                // Fechar modal após 1.5 segundos
                setTimeout(() => {
                    fecharModalCep();
                }, 1500);
                
                // Atualizar dados da região
                updateRegionData(localizacao);
                
            } else {
                mostrarMensagemCep(`❌ CEP não encontrado. Verifique e tente novamente.`, 'error');
            }
        });
        
    } catch (erro) {
        console.error('Erro ao buscar CEP:', erro);
        mostrarMensagemCep('❌ Erro ao buscar CEP. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        botao.disabled = false;
        botao.innerHTML = 'Buscar';
    }
}

/**
 * Mostra mensagem no modal de CEP
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - Tipo da mensagem ('success' ou 'error')
 */
function mostrarMensagemCep(mensagem, tipo) {
    const mensagemDiv = document.getElementById('cep-message');
    mensagemDiv.textContent = mensagem;
    mensagemDiv.className = `modal-message ${tipo} show`;
}

/**
 * Abre o modal de pesquisa de CEP
 */
function abrirModalCep() {
    const modal = document.getElementById('cep-modal');
    const input = document.getElementById('cep-input');
    modal.classList.add('active');
    input.focus();
    input.value = '';
}

/**
 * Fecha o modal de pesquisa de CEP
 */
function fecharModalCep() {
    const modal = document.getElementById('cep-modal');
    modal.classList.remove('active');
}

/**
 * Consulta a Google Solar API para obter dados solares de uma localização
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {object} Dados solares ou null se houver erro
 */
async function analisarLocalSolar(lat, lng) {
    try {
        // Usar Solar API do Google Cloud
        // Endpoint: buildingInsights:findClosest
        const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=AIzaSyD1JiPgRZcA7AhuY7poed4K0q1KUhQKTbE`;
        
        console.log('📡 Consultando Solar API para:', { lat, lng });
        console.log('📡 URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📡 Resposta da API (completa):', data);
        console.log('📡 Status HTTP:', response.status);
        
        // Verificar se há erro na resposta
        if (data.error) {
            console.error('❌ Erro da Solar API:', data.error);
            console.warn('⚠️ Código de erro:', data.error.code);
            console.warn('⚠️ Mensagem:', data.error.message);
            return null;
        }
        
        if (!response.ok && response.status !== 200) {
            console.error('❌ Erro HTTP:', response.status, response.statusText);
            return null;
        }
        
        // Log dos campos principais
        console.log('✅ Campos disponíveis:');
        console.log('   - solarPotential:', data.solarPotential ? '✅ Sim' : '❌ Não');
        console.log('   - buildingStats:', data.buildingStats ? '✅ Sim' : '❌ Não');
        console.log('   - center:', data.center ? '✅ Sim' : '❌ Não');
        console.log('   - boundingBox:', data.boundingBox ? '✅ Sim' : '❌ Não');
        
        if (data.solarPotential) {
            console.log('✅ Dados solares encontrados:');
            console.log('   - maxArrayAreaMeters2:', data.solarPotential.maxArrayAreaMeters2);
            console.log('   - solarPanelConfigs:', data.solarPotential.solarPanelConfigs?.length, 'config(s)');
            if (data.solarPotential.solarPanelConfigs && data.solarPotential.solarPanelConfigs[0]) {
                const config = data.solarPotential.solarPanelConfigs[0];
                console.log('   - yearlyEnergyDcKwh:', config.yearlyEnergyDcKwh);
                console.log('   - yearlyEnergyAcKwh:', config.yearlyEnergyAcKwh);
                console.log('   - panelCount:', config.panelCount);
            }
        }
        
        // Cache dos dados
        ultimosDadosSolares = {
            lat: lat,
            lng: lng,
            dados: data,
            timestamp: Date.now()
        };
        
        return data;
        
    } catch (erro) {
        console.error('❌ Erro ao consultar Solar API:', erro);
        console.error('Detalhes:', erro.message);
        console.error('Stack:', erro.stack);
        return null;
    }
}

/**
 * Classifica o potencial solar com base nos dados retornados pela API
 * @param {object} dados - Dados da Solar API
 * @returns {object} Objeto com classificação, cor e mensagem
 */
function classificarPotencialSolar(dados) {
    console.log('🔍 Processando dados solares...', dados);
    
    // Extrair dados do potencial solar
    let potencialKwh = 0;
    let areaTelinado = 0;
    let numPaineis = 0;
    let irradiacao = 0;
    let pixelQualidade = 0;
    let horasSol = 0;
    
    // Tentar extrair dados de múltiplas fontes
    if (dados && dados.solarPotential) {
        const solar = dados.solarPotential;
        
        console.log('📊 Campos de solarPotential:', Object.keys(solar));
        
        // Área do telhado em m²
        areaTelinado = solar.maxArrayAreaMeters2 || 0;
        
        // Qualidade do pixel (0-1)
        pixelQualidade = solar.pixelQualityScore || 0;
        
        // Radiação solar
        if (solar.solarRadiation) {
            irradiacao = solar.solarRadiation.averageLatitudeUnknownTilt || 0;
            horasSol = solar.solarRadiation.monthlyAverageDirectNormalIrradiance 
                ? solar.solarRadiation.monthlyAverageDirectNormalIrradiance[0] 
                : 0;
        }
        
        // Configurações de painéis solares
        if (solar.solarPanelConfigs && solar.solarPanelConfigs.length > 0) {
            const config = solar.solarPanelConfigs[0];
            
            console.log('⚙️ Configuração de painel:', Object.keys(config));
            
            // Potencial anual de energia (kWh/ano)
            potencialKwh = config.yearlyEnergyDcKwh || config.yearlyEnergyAcKwh || 0;
            
            // Quantidade de painéis
            numPaineis = config.panelCount || 0;
        }
    }
    
    console.log('📈 Dados extraídos:', {
        potencialKwh,
        areaTelinado,
        numPaineis,
        irradiacao,
        pixelQualidade,
        horasSol
    });
    
    // Classificar com base no potencial anual
    let classificacao = 'Baixo Potencial';
    let cor = 'low';
    let emoji = '❌';
    let mensagem = '';
    
    if (potencialKwh > 5000) {
        classificacao = 'Alto Potencial';
        cor = 'high';
        emoji = '✅';
        mensagem = 'Excelente potencial solar! Este local é muito favorável para instalação de painéis solares.';
    } else if (potencialKwh > 2000) {
        classificacao = 'Médio Potencial';
        cor = 'medium';
        emoji = '⚠️';
        mensagem = 'Potencial moderado para energia solar. Pode ser interessante dependendo dos custos locais.';
    } else if (potencialKwh > 0) {
        classificacao = 'Baixo Potencial';
        cor = 'low';
        emoji = '❌';
        mensagem = 'Potencial solar baixo para esta localização. Pode não ser economicamente viável.';
    } else {
        // Se não houver dados de kWh, usar irradiação como base
        if (irradiacao > 1500) {
            classificacao = 'Alto Potencial';
            cor = 'high';
            emoji = '✅';
            mensagem = 'Localização com boa irradiação solar. Potencial para energia solar.';
        } else if (irradiacao > 1000) {
            classificacao = 'Médio Potencial';
            cor = 'medium';
            emoji = '⚠️';
            mensagem = 'Irradiação solar moderada nesta localização.';
        } else {
            classificacao = 'Baixo Potencial';
            cor = 'low';
            emoji = '❌';
            mensagem = 'Irradiação solar baixa para esta localização.';
        }
    }
    
    return {
        classificacao,
        cor,
        emoji,
        mensagem,
        potencialKwh: Math.round(potencialKwh),
        areaTelinado: Math.round(areaTelinado),
        numPaineis,
        irradiacao: Math.round(irradiacao),
        pixelQualidade: (pixelQualidade * 100).toFixed(1),
        horasSol: Math.round(horasSol)
    };
}

/**
 * Abre o painel lateral com os dados solares da localização clicada
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function abrirPainelSolar(lat, lng) {
    const painel = document.getElementById('solar-panel');
    const conteudo = document.getElementById('solar-panel-content');
    const localizacao = document.getElementById('solar-location');
    
    painel.classList.add('active');
    
    // Mostrar loading
    conteudo.innerHTML = `
        <div class="solar-message">
            <span class="loading-spinner"></span>Consultando dados solares via satélite...
        </div>
    `;
    
    // Atualizar localização
    localizacao.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    // Consultar Solar API
    const dadosSolares = await analisarLocalSolar(lat, lng);
    
    // Processar dados
    let classificacao;
    let html = '';
    
    if (dadosSolares) {
        // Dados retornados da API (mesmo que parciais)
        console.log('✅ Dados da API disponíveis, processando...');
        classificacao = classificarPotencialSolar(dadosSolares);
        
        // Construir conteúdo HTML com dados reais
        html = `
            <div class="solar-message" style="background: #e8f5e9; border-left-color: #4caf50; color: #2e7d32;">
                ✅ Análise completa! ${classificacao.mensagem}
            </div>
            
            <div class="solar-info-card">
                <h3>📍 Localização</h3>
                <p class="description">
                    Latitude: ${lat.toFixed(6)}<br>
                    Longitude: ${lng.toFixed(6)}
                </p>
            </div>
        `;
        
        // Adicionar potencial anual se disponível
        if (classificacao.potencialKwh > 0) {
            html += `
                <div class="solar-info-card">
                    <h3>⚡ Potencial Anual (kWh)</h3>
                    <p class="value">${classificacao.potencialKwh.toLocaleString('pt-BR')}</p>
                    <span class="unit">kWh/ano</span>
                    <p class="description">Estimativa de energia que os painéis solares podem gerar anualmente.</p>
                </div>
            `;
        }
        
        // Adicionar área do telhado se disponível
        if (classificacao.areaTelinado > 0) {
            html += `
                <div class="solar-info-card">
                    <h3>📐 Área Utilizável do Telhado</h3>
                    <p class="value">${classificacao.areaTelinado}</p>
                    <span class="unit">m²</span>
                    <p class="description">Área estimada disponível para instalação de painéis.</p>
                </div>
            `;
        }
        
        // Adicionar quantidade de painéis se disponível
        if (classificacao.numPaineis > 0) {
            html += `
                <div class="solar-info-card">
                    <h3>🔆 Quantidade de Painéis</h3>
                    <p class="value">${classificacao.numPaineis}</p>
                    <span class="unit">painéis</span>
                    <p class="description">Estimativa baseada em painéis padrão de 400W.</p>
                </div>
            `;
        }
        
        // Adicionar irradiação solar se disponível
        if (classificacao.irradiacao > 0) {
            html += `
                <div class="solar-info-card">
                    <h3>☀️ Irradiação Solar</h3>
                    <p class="value">${classificacao.irradiacao}</p>
                    <span class="unit">W/m²</span>
                    <p class="description">Radiação solar média incidente na região.</p>
                </div>
            `;
        }
        
        // Adicionar qualidade do pixel se disponível
        if (classificacao.pixelQualidade > 0) {
            html += `
                <div class="solar-info-card">
                    <h3>📊 Qualidade dos Dados</h3>
                    <p class="value">${classificacao.pixelQualidade}%</p>
                    <span class="unit">confiança</span>
                    <p class="description">Confiabilidade dos dados do satélite para esta localização.</p>
                </div>
            `;
        }
        
        // Adicionar classificação
        html += `
            <div class="solar-info-card">
                <h3>📊 Classificação do Potencial</h3>
                <span class="potential-badge ${classificacao.cor}">
                    ${classificacao.emoji} ${classificacao.classificacao}
                </span>
            </div>
            
            <button class="solar-button" id="solar-budget-button">
                💼 Solicitar orçamento com empresa parceira
            </button>
        `;
        
    } else {
        // Sem dados disponíveis da API
        console.warn('⚠️ Sem dados da API, exibindo placeholder');
        
        html = `
            <div class="solar-message" style="background: #fff3cd; border-left-color: #ffc107; color: #856404;">
                ⚠️ <strong>Dados não disponíveis</strong><br>
                A Solar API do Google não retornou dados para esta localização.<br><br>
                <small>📌 Verifique no Console (F12) para ver o status da API.<br>Localizações urbanas e bem documentadas têm melhor cobertura.</small>
            </div>
            
            <div class="solar-info-card">
                <h3>📍 Localização</h3>
                <p class="description">
                    Latitude: ${lat.toFixed(6)}<br>
                    Longitude: ${lng.toFixed(6)}
                </p>
            </div>
            
            <div class="solar-info-card" style="background: #f5f5f5; border-left-color: #999;">
                <h3>💡 Dicas</h3>
                <p class="description">
                    • Tente em uma área urbana ou bem mapeada<br>
                    • Clique no centro da cidade<br>
                    • Verifique sua conexão com a internet<br>
                    • Abra o Console (F12) para ver detalhes do erro
                </p>
            </div>
            
            <button class="solar-button" id="solar-budget-button" style="background: #ccc; cursor: not-allowed; opacity: 0.5;">
                💼 Solicitar orçamento (indisponível)
            </button>
        `;
    }
    
    conteudo.innerHTML = html;
    
    // Adicionar listener ao botão de orçamento
    const botaoOrcamento = document.getElementById('solar-budget-button');
    if (botaoOrcamento && !botaoOrcamento.disabled) {
        botaoOrcamento.addEventListener('click', () => {
            alert('✉️ Funcionalidade de contato com empresas parceiras em desenvolvimento.\n\nEm breve você poderá enviar sua localização diretamente para empresas especializadas em energia solar!');
        });
    }
}

/**
 * Fecha o painel lateral de análise solar
 */
function fecharPainelSolar() {
    const painel = document.getElementById('solar-panel');
    painel.classList.remove('active');
}

/**
 * Inicializa os listeners para as novas funcionalidades
 */
function inicializarListenersNovasFuncionalidades() {
    // Botão flutuante de pesquisa de CEP
    const botaoFlutante = document.getElementById('floating-cep-button');
    botaoFlutante.addEventListener('click', abrirModalCep);
    
    // Fechar modal de CEP
    const botaoFecharCep = document.getElementById('cep-modal-close');
    botaoFecharCep.addEventListener('click', fecharModalCep);
    
    // Botão de busca de CEP no modal
    const botaoBuscaCep = document.getElementById('cep-search-button');
    botaoBuscaCep.addEventListener('click', () => {
        const input = document.getElementById('cep-input');
        if (input.value.trim()) {
            buscarCep(input.value);
        } else {
            mostrarMensagemCep('❌ Por favor, digite um CEP.', 'error');
        }
    });
    
    // Permitir buscar CEP ao pressionar Enter
    const inputCep = document.getElementById('cep-input');
    inputCep.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            botaoBuscaCep.click();
        }
    });
    
    // Fechar modal ao clicar fora dele
    const modalOverlay = document.getElementById('cep-modal');
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            fecharModalCep();
        }
    });
    
    // Fechar painel solar
    const botaoFecharPainel = document.getElementById('solar-panel-close');
    botaoFecharPainel.addEventListener('click', fecharPainelSolar);
    
    // Atualizar listener do clique no mapa para abrir painel solar
    // Remover o antigo listener
    map.addListener('click', async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Atualizar marcador de clique
        placeMarker(event.latLng);
        
        // Abrir painel com análise solar
        abrirPainelSolar(lat, lng);
    });
}

// Inicializar quando a página carregar
window.addEventListener('load', initMap);
