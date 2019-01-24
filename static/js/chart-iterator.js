//Original method taken from:https://stackoverflow.com/questions/53764367/how-to-trigger-hover-programmatically-in-chartjs
function set_chart_points(){
    chart_points = [];
    let datasets = line_chart.data.datasets;
    let first = true;
    for (let x = 0; x < datasets.length; x++) {

        if (!datasets[x].label.includes('Average')) {
            if (first){
                first=false;
                chart_points = chart_points.concat(line_chart.getDatasetMeta(x).data);
            }
            else{
                let points = line_chart.getDatasetMeta(x).data;
                points.shift();
                chart_points = chart_points.concat(points);
            }

        }
    }
    for (let i=0;i<chart_points.length;i++){
        chart_points[i] = chart_points[i].getCenterPoint();
    }
    rect = line_chart.canvas.getBoundingClientRect();
}
function unset_chart_points(){
    chart_points = null;
    rect = null;
}
function trigger_chart_hover(idx) {
    var point = chart_points[idx];
    console.log(point);
    var evt = new MouseEvent('mousemove', {
            clientX: rect.left + point.x,
            clientY: rect.top + point.y
        }),
        node = line_chart.canvas;
    node.dispatchEvent(evt);
}