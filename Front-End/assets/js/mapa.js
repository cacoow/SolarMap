let map;
let marker;
let userLocationMarker;
let infoWindow;
let placesService;
let solarHeatmap;
const API_KEY = 'AIzaSyD1JiPgRZcA7AhuY7poed4K0q1KUhQKTbE';

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
    
    // Inicializar a infoWindow e Places Service
    infoWindow = new google.maps.InfoWindow();
    placesService = new google.maps.places.PlacesService(map);
    
    // Criar heatmap solar com dados da Solar API
    atualizarHeatmapSolar();
    
    // Obter localização do usuário
    getUserLocation();
    
    // Buscar pontos de interesse quando o mapa acabar de se mover
    map.addListener('idle', function() {
        buscarPontosDeInteresse();
        atualizarHeatmapSolar();
    });
    
    // Adicionar listener para cliques no mapa
    map.addListener('click', function(event) {
        placeMarker(event.latLng);
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

// Inicializar quando a página carregar
window.addEventListener('load', initMap);
