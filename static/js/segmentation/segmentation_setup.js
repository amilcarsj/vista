function loadMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }).addTo(map);
}

$(function () {
    loadMap("map");
    create_layers_control();
    for (let i = 0; i < layers.length; i++) {
        addSemanticLayerToMap(layers[i].geojson, layers[i].name);
    }
    loadLineChart("#pf-chart", curr_pf.values);
    create_play_control();
    setup();
    create_segmentation_control(segmentation_labels);
    loadScatterPlot("#scatter-chart", []);
    segmentation_control.scatter_chart = scatter_chart;
    $("#ddl-xaxis").change(getXYValues);
    $("#ddl-yaxis").change(getXYValues);
    $("#ddl-yaxis").children().eq(1).attr('selected', 'selected');
    $("#ddl-xaxis").trigger('change');
    $("#ddl-pf").trigger('change');
});

function setup() {
    setStats(curr_pf);
    $("#traj-id").html(traj_original._id);

    let coords = traj_original.geojson.geometry.coordinates;
    let vals = curr_pf.values;
    console.log(coords);
    console.log(vals);
    trajectory = createTrajectory(coords, vals);
    trajectory.addTo(map);
    map.fitBounds(trajectory.getBounds());
    console.log(traj_original);

    $("#traj-tp").html(round(traj_original.total_points));
    $("#traj-td").html(round(traj_original.total_distance_traveled));
    $("#traj-as").html(round(traj_original.average_sampling));

}

function round(num) {
    return Math.round((num + 0.00001) * 100) / 100;
}

function getXYValues(e) {
    let xaxis = $("#ddl-xaxis").val();
    let yaxis = $("#ddl-yaxis").val();
    $.get('/management/get/xy/' + xaxis + "/" + yaxis + "/", function (data) {
        segmentation_control.scatter_chart_x_data=data.xvals;
        segmentation_control.scatter_chart_y_data=data.yvals;
        segmentation_control.generateScatterChart();
    });
}

function addArrows(line_lat_lon_seq) {

    var polyArrowStyle = L.polyline(line_lat_lon_seq, {});
    var decorator = L.polylineDecorator(polyArrowStyle, {
        patterns: [{
            offset: '5%',
            repeat: '5%',
            symbol: L.Symbol.arrowHead({
                pixelSize: 12,
                polygon: false,
                pathOptions: {
                    stroke: true,
                    color: '#ff0000',
                    weight: 3
                }
            })
        }]
    });
    selected_trajectory_arrows = decorator;
    decorator.addTo(map);
    trajectory.decorator = decorator;

}