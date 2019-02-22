layerControl = null;

function create_layers_control() {
    var options = {position: 'topleft'};
    layerControl = new L.Control.ControlLayers(options).addTo(map);
    controled_layers = [];
    layerControl.initializeComponents();
}


function addSemanticLayerToMap(geojson, layer_name) {
    var color = makeRandomColor();
    var style = {
        "color": color,
        "weight": 4,
        "opacity": 1.0,
        "fillOpacity": 0.5,
        "collapsed": true
    };

    var semantic_layer_geojson = L.geoJson(geojson, {
        style: style,
        onEachFeature: function (features, layer) {
            var props = features.properties;
            var html = '';
            for (var p in props) {
                html += '<div style="display: inline-flex"><div style="font-weight: bolder">' + p + ':&nbsp;</div>' + props[p] + '</div>';
            }
            layer.bindPopup(html);
        },
        pointToLayer: function (feature, latlng) {
            //L.marker(latlng).addTo(map);

            return L.marker(latlng,{icon:build_circle_icon(color)});
        }

    });

    var semantic_layer_group = L.featureGroup([semantic_layer_geojson]);
    semantic_layer_group.name = layer_name;
    layerControl.addLayerToControl(map, semantic_layer_group, color);
    //controled_layers.push(semantic_layer_group);
}
function build_circle_icon(color) {
    let icon = '<?xml version="1.0" standalone="no"?>' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg class="icon" ' +
        'height="512" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="'+color+'" d="M512 32C249.6 32 32 249.6 32 512s217.6 480 480 480c262.4 0 480-217.6 480-480S774.4 32 512 32zM512 896c-211.2 0-384-172.8-384-384 0-211.2 ' +
        '172.8-384 384-384 211.2 0 384 172.8 384 384C896 723.2 723.2 896 512 896z"  />' +
        '<path fill="'+color+'" d="M512 256c140.8 0 256 115.2 256 256 0 140.8-115.2 256-256 256-140.8 ' +
        '0-256-115.2-256-256C256 371.2 371.2 256 512 256z"  /></svg>';
    var svgURL = "data:image/svg+xml;base64," + btoa(icon);
    return L.icon({
        iconUrl: svgURL,
        iconSize: [30, 30], // size of the icon
        iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
    });
}


function makeRandomColor() {
    return '#' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6);
}
