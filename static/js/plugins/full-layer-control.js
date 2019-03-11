L.Control.ControlLayers = L.Control.extend({

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-layers-custom');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
        // .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        // .addListener(controlDiv, 'click', function () {
        //     showPanel();
        // });
        this._controlDiv = controlDiv;

        return controlDiv;
    },

    initializeComponents: function () {
        $('.leaflet-control-layers-custom').empty();
        $('.leaflet-control-layers-custom').append('<button id="leaflet-control-layers-button" class="leaflet-control-button-custom"><img id="layer-image" src="/media/layer-icon.png" data-toggle="tooltip" title="Manage layers attributes" data-placement="right"></img></button>');
        $('.leaflet-control-layers-custom').append('<div class="leaflet-control-layers-custom-container"></div>');
        $('#leaflet-control-layers-button').click(function () {
            if ($('.leaflet-control-layers-custom-container').css('display') == 'none') {
                $('.leaflet-control-layers-custom-container').css('display', 'block');
                $('#leaflet-control-layers-button').hide();
            }
        });
        var html = '<button id="btn-close-layers-container" type="button" class="close-map-container" aria-label="Close">&times;</button>';
        $('.leaflet-control-layers-custom-container').append(html);
        $('#btn-close-layers-container').click(function () {
            $('.leaflet-control-layers-custom-container').hide();
            $('#leaflet-control-layers-button').show();
        });
        $('[data-toggle="tooltip"]').tooltip();
    },

    addLayerToControl: function (map, layer, color) {
        // console.log(layer);
        if (typeof this.layers == 'undefined') {
            this.layers = [];
        }
        var name = layer.name;//.replaceAll(' ', '-');

        var html = '<div style="width: 100%; display: inline-flex; justify-content: space-around;align-items: center"><input type="checkbox" class="leaflet-custom-checkbox" id="checkbox-' + name + '" value="' + name + '" name="' + name + '" data-toggle="tooltip" title="Set visibility." data-placement="top" checked>' + name + '&nbsp;';
        html += '<select id="weight-' + name + '" class="leaflet-custom-weight" data-toggle="tooltip" title="Set line weight." data-placement="top">';
        for (var i = 1; i < 11; i++) {
            if (i != 4) {
                html += '<option>' + i + '</option>';
            } else {
                html += '<option selected>' + i + '</option>';
            }
        }
        ;
        html += '</select>';
        html += '<select id="opacity-' + name + '" class="leaflet-custom-opacity" data-toggle="tooltip" title="Set line opacity." data-placement="top">';
        var i = 0.1;
        while (i < 1.1) {
            i = Math.round(i * 100) / 100
            if (i != 1.0) {
                html += '<option>' + i + '</option>';
            } else {
                html += '<option selected>' + i + '</option>';
            }
            i += 0.1;
        }
        ;
        html += '</select>';
        html += '<select id="fill-opacity-' + name + '" class="leaflet-custom-opacity" data-toggle="tooltip" title="Set fill opacity." data-placement="top">';
        i = 0.1;
        while (i < 1.1) {
            i = Math.round(i * 100) / 100
            if (i != 0.5) {
                html += '<option>' + i + '</option>';
            } else {
                html += '<option selected>' + i + '</option>';
            }
            i += 0.1;
        }
        ;
        html += '</select>';
        html += '<input type="color" class="leaflet-custom-color" id="color-' + name + '"  data-toggle="tooltip" title="Set color." data-placement="bottom">&nbsp;';
        html += '</div> <br />';

        $('.leaflet-control-layers-custom-container').append(html);

        console.log(color);
        console.log('color-' + name);
        let obj = document.getElementById('color-' + name);
        console.log(obj);
        obj.value = '#FFFFFF';
        obj.defaultValue = color;
        obj.value = obj.defaultValue;
        obj.style.color = color;
        console.log(obj);
        $('#checkbox-' + name).click(function () {

            if ($('#checkbox-' + name).is(':checked')) {
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                }
            } else {
                map.removeLayer(layer);
            }

        });
        $('#color-' + name).on('change', function () {
            var new_color = $(this).val();
            $(this).addClass('changed');
            // console.log(new_color);
            layer.setStyle({color: new_color})
        });
        $('#weight-' + name).change(function () {
            var new_weight = $(this).val();
            layer.setStyle({weight: new_weight})
        });
        $('#opacity-' + name).change(function () {
            var new_opacity = $(this).val();
            layer.setStyle({opacity: new_opacity})
        });
        $('#fill-opacity-' + name).change(function () {
            var new_opacity = $(this).val();
            layer.setStyle({fillOpacity: new_opacity})
        });
        $('#color-' + name).trigger('input');

        console.log(layer);
        var leaflet_layer = layer.addTo(map);
        this.layers.push(layer);
        $('#color-' + name).trigger('input');
        },

    // clearControlLayers: function (map){
    //     console.log(this.layers);
    //     for (var i = 0; i < this.layers.lenght; i++){
    //         map.removeLayer(this.layers[i]);
    //     }

    // }
});

L.control.ControlLayers = function (options) {
    return new L.Control.ControlLayers(options);
};
