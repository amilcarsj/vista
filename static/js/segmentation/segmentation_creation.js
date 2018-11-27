segmentation_control = null;
player_control = null;
layer_control = null;



function create_segmentation_control(labels){
    segmentation_control = new L.Control.SegmentationControl({position:'topleft','bind':true,'icon':'map_marker_font_awesome.png'}).addTo(map);
    segmentation_control.labels = labels;
    segmentation_control.initializeComponents();
    //console.log(visible_trajectory.main.getLayers()[0].getLayers());
    segmentation_control.Trajectory_Layer = trajectory;

}