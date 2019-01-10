playControl = null;

function create_play_control() {
    var options = {position: 'topleft'};
    playControl = new L.Control.PlayTrajectoryControl(options).addTo(map);
    playControl.initializeComponents();
    $('#play-trajectory-on-map-button').click(function () {
        var secs = $('#input-play-seconds').val();
        playControl.play(trajectory, secs, function () {
            $('#ddl-pf').trigger('change');
        });
    });
}