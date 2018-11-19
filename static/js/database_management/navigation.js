$(function () {
    $("#btn-next").click(function (e) {
        $('#upload-trajectories').hide();
        $("#upload-semantics").show();
        e.preventDefault();
    });
    $("#btn-next2").click(function(e){
        $("#upload-semantics").hide();
        $("#invite-users").show();
        e.preventDefault();
    });
    $("#btn-previous2").click(function(e){
        $("#invite-users").hide();
        $("#upload-semantics").show();
        e.preventDefault();

    });
    $("#btn-previous").click(function (e) {
        $("#upload-semantics").hide();
        $('#upload-trajectories').show();
        e.preventDefault();
    });
});