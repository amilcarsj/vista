line_chart = null;
scatter_chart = null;

function loadLineChart(containerid, d) {
    resizeCanvas($(containerid));

    console.log(containerid);
    line_chart = new Chart($(containerid), {
        type: 'line',
        title: "Point Feature Chart",
        data: d,
        options: {
            legend: {
                display: false
            },
            title: {
                display: false,
                text: 'Point Feature Chart'
            },
            elements: {
                point: {
                    radius: 0
                },
                line: {
                    tension: 0, // disables bezier curves
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: true //this will remove only the label
                    }
                }]
            },
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
                mode: 'nearest',
                intersect: false
            },
            onClick: function (evt, points) {
                let p = points[0];
                console.log(p);
                let coord_index = line_chart.data.datasets[p._datasetIndex].data[p._index].x;
                let latlng = trajectory.getLatLngs()[coord_index];
                let prevp = trajectory.getLatLngs()[coord_index - 1];
                let angle = null;
                if (prevp == null) {
                    prevp = trajectory.getLatLngs()[coord_index+ 1];
                    angle = angleFromCoordinate(latlng[0], latlng[1],prevp[0], prevp[1]);
                } else {
                    angle = angleFromCoordinate(prevp[0], prevp[1],latlng[0], latlng[1]);
                }
                console.log(latlng);
                setMarkerIconWithDirection(latlng,angle);
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            responsive: false,
            maintainAspectRatio: false
        }
    });

}

function loadScatterPlot(containerid, d) {
    resizeCanvas($(containerid));

    //console.log(containerid);
    scatter_chart = new Chart($(containerid), {
        type: 'scatter',
        data: {
            datasets: d,
        },
        options: {

            legend: {
                display: true
            },
            title: {
                display: true,
                text: 'Point Feature Comparison'
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: true //this will remove only the label
                    }
                }]
            },
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            responsive: false,
            maintainAspectRatio: false
        }
    });
}

function update_point_feature(e) {
    var oid = e.target.value;
    //console.log(oid);
    $.get("/management/get/point_feature/" + oid + "/").done(function (data) {
        //console.log(data);
        curr_pf = data.point_feature;
        var d = data.point_feature.values;
        segmentation_control.line_chart_data = d;
        setStats(data.point_feature);
        let new_traj = createTrajectory(trajectory._originalLatlngs, d);

        //console.log(trajectory);
        if (trajectory != null) {
            let old_traj = trajectory;
            trajectory = null;
            map.removeLayer(old_traj);
        }
        //console.log(trajectory);
        trajectory = new_traj;
        trajectory.addTo(map);
        addArrows(trajectory._originalLatlngs);
        let labels = [];

        for (let i = 0; i < d.length; i++) {
            labels.push(i);
        }

        let chart_data =
            {
                'datasets':
                    [{
                        'data': d,
                        'label': data.point_feature.name,
                        'borderColor': 'red'
                    }],
                'labels': labels
            };

        if (line_chart == null) {
            //console.log("New line_chart");
            loadLineChart("#pf-chart", chart_data);
        } else {
            //console.log("Update line_chart");
            line_chart.data.datasets = chart_data.datasets;
            line_chart.data.labels = chart_data.labels;
            line_chart.update();
        }
        if (segmentation_control != 'undefined' && segmentation_control != null) {
            if (segmentation_control.Point_Labels.length != 0) {
                console.log("Generate graph");
                segmentation_control.generateLineChart();
                segmentation_control.generateSegmentation();

            }
        }

    }).fail(function(jqXHR,textStatus,errorThrown){
        alert("An error occured when trying to load the point features. Attempting to load again.");
        update_point_feature(e);
    });
}

$(function () {
    $("#ddl-pf").change(update_point_feature);
    $("#btn-swap").click(function (e) {
        let btn = $(e.target);
        if (btn.val() == 'scatter') {
            btn.val('line');
            btn.html("Display Line Chart");
            $("#line-graph").hide();
            $("#scatter-graph").show();
            resizeCanvas($("#scatter-chart"));

        } else {
            btn.html("Display Scatter Plot");
            btn.val('scatter');
            $("#line-graph").show();
            $("#scatter-graph").hide();
        }
    });

});

function resizeCanvas(canvas) {
    canvas.width($("#charts-section").innerWidth());
    canvas.height($("#charts-section").height() - $("#xy-section").height() + $("#pf-section").height() + $("#top-section"));
    //console.log("Width: " + canvas.width() + " Height: " + canvas.height());
}

function createTrajectory(line_lat_lon_seq, feature_values) {
    let trajectory_red_colors = [{'color': '#ffe5e5'}, {'color': '#ffcccc'}, {'color': '#ffb2b2'}, {'color': '#ff9999'}, {'color': '#ff7f7f'},
        {'color': '#ff6666'}, {'color': '#ff4c4c'}, {'color': '#ff3232'}, {'color': '#ff1919'}, {'color': '#FF0000'}];
    let count = -1;

    let i;
    let thresholds = [];
    let max = Math.max.apply(null, feature_values);
    let min = Math.min.apply(null, feature_values);
    let increment = (max - min) / 9.;
    let initial = (min + increment) / 2.;

    thresholds.push(initial);
    for (let index = 1; index < 9; index++) {
        initial += increment;
        thresholds.push(initial);
    }
    //console.log(thresholds);
    //console.log(line_lat_lon_seq);
    var options = {position: 'bottomright'};
    let color_list = [];
    for (let i = 0; i < trajectory_red_colors.length; i++) {
        color_list.push(trajectory_red_colors[i].color);
    }
    if (typeof decorator_legend !== 'undefined') {
        $('.leaflet-control-decorator-legend-custom').remove();
    }
    decorator_legend = new L.Control.DecoratorLegend(options).addTo(map);
    //console.log(feature_values);

    decorator_legend.initializeComponents(color_list, thresholds);
    return L.multiOptionsPolyline(line_lat_lon_seq, {
        multiOptions: {
            optionIdxFn: function (latLng) {
                count++;
                for (i = 0; i < thresholds.length; ++i) {
                    if (feature_values[count] <= thresholds[i]) {
                        return i;
                    }
                }
                return thresholds.length - 1;
            },
            options: trajectory_red_colors
        },
        weight: 5,
        opacity: 1.,
        fillOpacity: 1.,
    });

}

function setStats(curr_pf) {
    $("#pf-mean").html(curr_pf.mean);
    $("#pf-median").html(curr_pf.median);
    $("#pf-min").html(curr_pf.min);
    $("#pf-max").html(curr_pf.max);
    $("#pf-10p").html(curr_pf.percentile_10);
    $("#pf-25p").html(curr_pf.percentile_25);
    $("#pf-50p").html(curr_pf.percentile_50);
    $("#pf-75p").html(curr_pf.percentile_75);
    $("#pf-90p").html(curr_pf.percentile_90);
    $("#pf-std").html(curr_pf.std);
}