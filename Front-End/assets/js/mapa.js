let map;
let marker;

function initMap() {
    // Coordenadas iniciais (Brasil - centro)
    const initialLocation = { lat: -14.2350, lng: -51.9253 };
    
    // Criar o mapa
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: initialLocation,
        mapTypeId: 'satellite' // Útil para visualizar potencial solar
    });
    
    // Adicionar listener para cliques no mapa
    map.addListener('click', function(event) {
        placeMarker(event.latLng);
    });
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
    
    regionElement.innerHTML = `<strong>Região:</strong> ${location.lat().toFixed(4)}, ${location.lng().toFixed(4)}`;
    irradianciaElement.innerHTML = `<strong>Irradiação:</strong> ~1000 W/m² (valor típico)`;
    potentialElement.innerHTML = `<strong>Potencial:</strong> Alto`;
}

// Inicializar quando a página carregar
window.addEventListener('load', initMap);
