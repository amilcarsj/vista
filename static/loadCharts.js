function loadBarChart(containerid,t, d) {
    console.log(d);
    line_chart = new Chart($(containerid), {
        type: 'bar',
        data: d,
        options: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                text: t
            },
            responsive: true,
            maintainAspectRatio: true,

        },

    });
}