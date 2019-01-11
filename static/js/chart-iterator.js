//Original method taken from:https://stackoverflow.com/questions/53764367/how-to-trigger-hover-programmatically-in-chartjs

function trigger_chart_hover(idx) {
    let chart_points = [];
    let datasets = line_chart.data.datasets;
    for (let x = 0; x < datasets.length; x++) {
        if (!datasets[x].label.includes('Average')) {
            chart_points = chart_points.concat(line_chart.getDatasetMeta(x).data);
        }
    }
    var rect = line_chart.canvas.getBoundingClientRect(),
        point = chart_points[idx].getCenterPoint();
    var evt = new MouseEvent('mousemove', {
            clientX: rect.left + point.x,
            clientY: rect.top + point.y
        }),
        node = line_chart.canvas;
    node.dispatchEvent(evt);
}