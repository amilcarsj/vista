map = null;
trajectory = null;

function loadMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }).addTo(map);
}


$(function () {
    loadMap("map")
    create_layers_control();
    create_play_control();
    //loadChart("#pf-chart", []);

    $("#ddlDatabase").change(function () {
        console.log("New Database selected");
        $.get('/management/get/trajectories/' + $("#ddlDatabase").val() + "/", function (data) {
            console.log(data);
            for (let i = 0; i < data.semantic_layers.length; i++) {
                console.log(data.semantic_layers[i].geojson);
                addSemanticLayerToMap(data.semantic_layers[i].geojson, data.semantic_layers[i].name);
            }
            let trajectories = data.trajectories;

            $("#tblTrajectories tbody").html("");

            let rows = "";
            for (let i = 0; i < trajectories.length; i++) {
                rows += `<tr><td>${trajectories[i]._id}</td><td>${trajectories[i].total_points}</td><td>${trajectories[i].average_sampling}</td><td>${trajectories[i].total_distance_traveled}</td><td><button value="${trajectories[i]._id}" class="btn btn-success btn-view">Select</button></td></tr>`;
            }
            $("#tblTrajectories tbody").html(rows);
            $(".btn-view").click(btn_view_click);
        });
    });


    $(".btn-view").click(btn_view_click);
    $("#ddlDatabase").trigger('change');
});



function btn_view_click(e) {
    let oid = e.target.value;
    console.log(oid);
    $.get("/management/get/trajectory/" + oid + "/", function (data) {
        $("#traj-id").html(oid);
        console.log(data);
        if (trajectory != null) {
            map.removeLayer(trajectory);
        }
        let select_options = "";
        $("#ddl-pf").html("");
        for (let i = 0; i < data.point_features.length; i++) {
            select_options += `<option value="${data.point_features[i]._id}">${data.point_features[i].name}</option>`;
        }
        $("#ddl-pf").append(select_options);

        trajectory = createTrajectory(data.trajectory.geometry.coordinates, data.current_pf.values);
        setStats(data.current_pf);

        trajectory.addTo(map);
        console.log(trajectory);
        map.fitBounds(trajectory.getBounds());
        let d = data.current_pf.values;
        let labels = [];
        for (let i = 0; i < d.length; i++) {
            labels.push(i);
        }
        let chart_data =
            {
                'datasets':
                    [{
                        'data': d,
                        'label': data.current_pf.name,
                        'borderColor': 'red'
                    }],
                'labels': labels
            };
        if (chart == null) {
            console.log("New chart");
            loadChart("#pf-chart", chart_data);
        }
        else {
            console.log("Update chart");
            chart.data.datasets = chart_data.datasets;
            chart.data.labels = chart_data.labels;
            chart.update();
        }
    });

}
