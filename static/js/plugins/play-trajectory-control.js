point_selected_from_pf_chart = null;

function angleFromCoordinate(lat1, lon1, lat2, lon2) {
    lat1 = toRadians(lat1);
    lat2 = toRadians(lat2);
    lon1 = toRadians(lon1);
    lon2 = toRadians(lon2);

    var longDiff = lon2 - lon1;
    var y = Math.sin(longDiff) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(longDiff);

    var res = (toDegrees(Math.atan2(y, x)) + 360) % 360;
    return res;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
};

/**
 * Converts an angle in radians to degrees
 * @param rad Angle in radians
 * @returns {number} Angle in degrees
 */
function toDegrees(rad) {
    return rad * (180 / Math.PI);
};


function setMarkerIconWithDirection(p_lat_lon, angle) {

    if (map.hasLayer(point_selected_from_pf_chart)) {
        map.removeLayer(point_selected_from_pf_chart);
    }

    var icon = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.0" width="700" height="700"><rect id="backgroundrect" width="100%" height="100%" x="0" y="0" fill="none" stroke="none"/><defs id="defs9"/><g class="currentLayer"><title>Layer 1</title><g id="g4" class="selected" transform="rotate(-89.93659973144531 350.3506469726563,349.46508789062506) " stroke="#000000" stroke-opacity="1" stroke-width="4" fill="#ffffff" fill-opacity="1"><path d="M0.7127809999999997,-0.8547001342010496 C2.5712110000000017,-0.8547001342010496 700.7013,349.13757986579895 699.99948,349.71741986579895 C697.64471,351.66290986579895 0.5386209999999991,699.784939865799 0.28021100000000126,699.1444198657989 C0.11143099999999961,698.7260498657989 33.97113,619.847169865799 75.52398199999999,523.858019865799 L151.07464,349.33227986579897 L75.537317,175.09017986579894 C33.991804,79.25700986579895 0.000011000000000649384,0.4649398657989503 0.000011000000000649384,-0.0033201342010507062 C0.000011000000000649384,-0.4715801342010513 0.32076100000000096,-0.8547001342010496 0.7127809999999997,-0.8547001342010496 z" id="path6" style="" stroke="#000000" stroke-opacity="1" stroke-width="25" fill="red" fill-opacity="1"/></g></g></svg>';
    var svgURL = "data:image/svg+xml;base64," + btoa(icon);

    var myIcon = L.icon({
        iconUrl: svgURL,
        iconSize: [20, 20], // size of the icon
        iconAnchor: [10, 10],// point of the icon which will correspond to marker's location
    });
    //console.log(p_lat_lon);
    point_selected_from_pf_chart = L.marker(p_lat_lon, {icon: myIcon, rotationAngle: angle});
    point_selected_from_pf_chart.addTo(map);
};


L.Control.PlayTrajectoryControl = L.Control.extend({

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-play-trajectory-control-custom');
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
        $('.leaflet-play-trajectory-control-custom').empty();
        $('.leaflet-play-trajectory-control-custom').append('<button id="leaflet-control-play-button" class="leaflet-control-button-custom"><img id="play-image" src="/media/play-icon.png" data-toggle="tooltip" title="Play the trajectory track on map." data-placement="right"></img></button>');
        $('.leaflet-play-trajectory-control-custom').append('<div class="leaflet-play-trajectory-control-custom-container"></div>');
        $('#leaflet-control-play-button').click(function () {
            if ($('.leaflet-play-trajectory-control-custom-container').css('display') == 'none') {
                $('.leaflet-play-trajectory-control-custom-container').css('display', 'block');
                $('#leaflet-control-play-button').hide();
            }
        });
        var html = '<button id="btn-close-play-container" type="button" class="close-map-container" aria-label="Close"><span aria-hidden="true">&times;</span></button><br />';
        $('.leaflet-play-trajectory-control-custom-container').append(html);
        $('#btn-close-play-container').click(function () {
            $('.leaflet-play-trajectory-control-custom-container').hide();
            $('#leaflet-control-play-button').show();
        });
        html = '<div style="display:inline-flex; align-items: center; margin-bottom: 5px; margin-left: 5px">\n' +
            '   <div style="font-weight: bolder">Total time(seconds):&nbsp;</div>\n' +
            '   <input id="input-play-seconds" type="text" value="10"></input>\n' +
            '   <div style="margin-left: 5px; margin-right: 5px">\n' +
            '       <i id="play-trajectory-on-map-button" class="fa fa-play-circle fa-2x" aria-hidden="true" role="button" aria-haspopup="true" aria-expanded="false" style="color:orange;"></i>'
        '   </div>\n' +
        '</div>';

        $('.leaflet-play-trajectory-control-custom-container').append(html);
        $('[data-toggle="tooltip"]').tooltip();

    },

    _addLayerAfterSometime: function (layers, timestep, callback) {

        var all_layers = [];
        //console.log(line_chart);
        let count = 1;
        set_chart_points();


        console.log(layers);
        for (let i = 0; layers < layers.length; i++) {
            map.removeLayer(layers[i]);

        }
        console.log(trajectory.decorator);
        map.removeLayer(trajectory.decorator);
        line_chart.options.tooltips.enabled = false;
        line_chart.update();
        let control = this;
        //condolr.log(layers);
        var myInterval = setInterval(function () {

            if (layers.length == 0) {
                clearInterval(myInterval);
                for (var index = 0; index < all_layers.length; index++) {
                    map.removeLayer(all_layers[index]);
                }
                console.log(control);
                control.playing = false;
                unset_chart_points();
                line_chart.options.tooltips.enabled = true;
                line_chart.update();
                return callback();
            }
            trigger_chart_hover(count++);

            var l = layers.splice(0, 1);
            l[0].addTo(map);
            all_layers.push(l[0]);
            var lat_lngs = l[0].getLatLngs();
            let angle = angleFromCoordinate(lat_lngs[0].lat, lat_lngs[0].lng, lat_lngs[1].lat, lat_lngs[1].lng);
            setMarkerIconWithDirection(lat_lngs[1], angle);


        }, timestep);

    },

    play: function (layer, time, callback) {
        console.log(this.playing);
        if (this.playing) {
            return;
        }
        var all_lat_lng = layer.getLatLngs();
        var timestep = (time * 1000.) / all_lat_lng.length;
        map.removeLayer(layer);
        map.removeLayer(trajectory.decorator);
        var inner_layers = layer.getLayers();
        this.playing = true;
        this._addLayerAfterSometime(inner_layers, timestep, callback);

    },
    playing: false

});

L.control.PlayTrajectoryControl = function (options) {
    return new L.Control.PlayTrajectoryControl(options);
};