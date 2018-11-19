chart = null;

function loadChart(containerid, d) {
    console.log(d);
    chart = new Chart($(containerid), {
        type: 'line',
        title: "Point Feature Chart",
        data: d,
        options: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Point Feature Chart'
            },
            elements: {
                point: {radius: 0}
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
        }
    });
}

function update_point_feature(e) {
    var oid = e.target.value;
    console.log(oid);
    $.get("/management/get/point_feature/" + oid + "/", function (data) {
        console.log(data);
        var d = data.point_feature.values;
        setStats(data.point_feature);

        console.log(trajectory);
        map.removeLayer(trajectory);
        trajectory = createTrajectory(trajectory._originalLatlngs, d);
        console.log(trajectory);
        trajectory.addTo(map);
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

$(function () {
    $("#ddl-pf").change(update_point_feature);
});

function createTrajectory(line_lat_lon_seq, feature_values) {
    let trajectory_red_colors = [{'color': '#ffe5e5'}, {'color': '#ffcccc'}, {'color': '#ffb2b2'}, {'color': '#ff9999'}, {'color': '#ff7f7f'},
        {'color': '#ff6666'}, {'color': '#ff4c4c'}, {'color': '#ff3232'}, {'color': '#ff1919'}, {'color': '#FF0000'}];
    let count = -1;
    console.log(feature_values);

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
    console.log(thresholds);
    return L.multiOptionsPolyline(line_lat_lon_seq, {
        multiOptions: {
            optionIdxFn: function (latLng) {
                count++;
                //console.log(latLng);
                let temp = latLng[0];
                latLng[0] = latLng[1];
                latLng[1] = temp;
                for (i = 0; i < thresholds.length; ++i) {
                    if (feature_values[count] <= thresholds[i]) {
                        return i;
                    }
                }

                return thresholds.length-1;
            },
            options: trajectory_red_colors
        },
        weight: 5,
        opacity: 1.,
        fillOpacity: 1.,
    });

}
function setStats(curr_pf){
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