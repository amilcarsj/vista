function loadBarChart(containerid, t, d) {

    return new Chart($(containerid), {
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
            maintainAspectRatio: true
        }
    });
}