layerControl = null;

function create_layers_control(){
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
        }

    }).addTo(map);

    var semantic_layer_group = L.featureGroup([semantic_layer_geojson]);
    semantic_layer_group.name = layer_name;
    layerControl.addLayerToControl(map, semantic_layer_group, color);
    //controled_layers.push(semantic_layer_group);
}


function makeRandomColor() {
    return '#' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6);
}
