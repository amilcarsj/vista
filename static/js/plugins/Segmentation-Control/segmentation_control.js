L.Control.SegmentationControl = L.Control.extend({
    //adds the Control to a map
    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-segment-trajectory-control-custom');
        L.DomEvent.addListener(controlDiv, 'click', L.DomEvent.stopPropagation);
        this._controlDiv = controlDiv;
        return controlDiv;
    },
    //Initializes the component HTML
    initializeComponents: function(){   
        var customcontrol = document.getElementsByClassName('leaflet-segment-trajectory-control-custom')[0];
        customcontrol.innerHTML = "<button id='btn-open-segment-control' class='btn-open-close leaflet-control-button-custom'><img src='"+this.icon+"'/></button>";
        customcontrolcontent = L.DomUtil.create('div', 'leaflet-segment-trajectory-control-custom-container');
        customcontrolcontent.innerHTML = '<button id="btn-close-segment-control" type="button" class="close-map-container" aria-label="Close"><span aria-hidden="true">×</span></button><br>';
        
        var table = document.createElement('table');
        this.labels.forEach(label => {   
            var tr = document.createElement('tr');
            var addtd = document.createElement('td');
            addtd.innerHTML = "<button value="+label+" class='btn-add'>+</button>";
            var labeltd = document.createElement('td');
            labeltd.innerHTML = label;
            var colorpickertd = document.createElement('td');
            colorpickertd.innerHTML = '<input type="color" class="leaflet-custom-color" value="#c807c0">';
            tr.appendChild(addtd);
            tr.appendChild(labeltd);
            tr.appendChild(colorpickertd);
            table.appendChild(tr);
            this.Marker_Groups[label] = L.layerGroup().addTo(map);
            this.Segmentation_Groups[label] = L.layerGroup().addTo(map);
        });
        customcontrolcontent.appendChild(table);
        customcontrolcontent.style.display = "none";
        customcontrol.appendChild(customcontrolcontent);
        var control = this;
        
        var btnadd = document.getElementsByClassName("btn-add");   
        var colorpickers = document.getElementsByClassName("leaflet-custom-color");
        for(var i=0;i < colorpickers.length;i++){
            colorpickers[i].addEventListener('change',changeColour,false);
            colorpickers[i].value = makeRandomColor();
            colorpickers[i].dispatchEvent(new Event("change"));
        }

        for (var i = 0; i < btnadd.length; i++) {
            btnadd[i].addEventListener('click', addMarker, false);
        }

        var btnopen = document.getElementById("btn-open-segment-control");
        btnopen.addEventListener('click',this.show,false);
        var btnclose = document.getElementById("btn-close-segment-control");
        btnclose.addEventListener('click',this.hide,false);

        function bindMarker(e){
            clearSegmentation();
            var color = findColor(e.target.getPopup().getContent());
            if(control.Bind_Markers && control.Trajectory_Layer != null){
                var minindex=0, mindist=0;
                var c = control.Trajectory_Layer.getLayers()[0].getLatLngs();  
                var latlng = e.target.getLatLng();
                for (var i=0;i<c.length;i++){
                    var dist = Math.abs(calculateDistance(c[i].lat,c[i].lng,latlng.lat,latlng.lng));
                    if (dist<mindist || i==0){
                        minindex = i;
                        mindist = dist;
                    }
                }
                e.target.setLatLng({'lon':c[minindex].lng,'lat':c[minindex].lat});
                generateSegmentation();
            }
        }
       
        function addMarker(e){
            var colour = this.parentNode.parentNode.childNodes[2].childNodes[0].value;
            var label = this.parentNode.parentNode.childNodes[1].innerHTML;
            colour = colour.substr(1,colour.length);
            
           var marker = L.marker(map.getCenter(),{
                draggable:true
            });
            control.Marker_Groups[label].addLayer(marker);
            marker.bindPopup(label);
            marker.on('dragend',bindMarker);
        }
        function changeColour(e){
            var label = this.parentNode.parentNode.childNodes[1].innerHTML;
            var btn = this.parentNode.parentNode.childNodes[0].childNodes[0];
            var colour = this.value;
            btn.style.background = colour;
            clearSegmentation();
            generateSegmentation();
        }
        //Gets the colour for a segmentation control
        function findColor(label){
            var table = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0].childNodes[2];
            for(var i=0;i<table.childNodes.length;i++){
                if (table.childNodes[i].childNodes[1].innerHTML == label){
                    return table.childNodes[i].childNodes[2].childNodes[0].value;
                }
            }
            
        }
        //Calculate the distance between two points
        function calculateDistance(lat1,lng1,lat2,lng2){
            var lat1 = toRadian(lat1);
            var lat2 = toRadian(lat2);
            var lng1 = toRadian(lng1);
            var lng2 = toRadian(lng2);
            var dlat = lat2-lat1;
            var dlng = lng2-lng1;
            var a = Math.pow(Math.sin(dlat/2),2)+Math.cos(lat1)*Math.cos(lat2)*Math.pow(Math.sin(dlng/2),2);
            var c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
            const EARTH_RADIUS = 9793000;
            return c * EARTH_RADIUS;
        }
        function toRadian(d) {
            return d*Math.PI/180;
        }
        function generateSegmentation(){
            control.labels.forEach(label =>{
                control.Marker_Groups[label].getLayers().forEach(marker =>{
                    color = findColor(marker.getPopup().getContent())
                    var points = getPointsAfterLastMarker(marker.getLatLng());
                    addLine(points,marker.getLatLng(),color,marker.getPopup().getContent());    
                
                });
            });
        }
        function addLine(points, newmarkerloc,color,label){
            var newline = [];
            for(var i=0;i<points.length;i++){
                newline.push(points[i]);
                if (points[i].lat == newmarkerloc.lat && points[i].lng == newmarkerloc.lng){
                    break;
                }
            }
            control.Segmentation_Groups[label].addLayer(L.polyline(newline, {
                    color: color,
                    weight: 3,
                    opacity: 1
                }));    
            
                
        }
        function getPointsAfterLastMarker(currMarkerLoc){
            var points = [];
            lastElement = control.Trajectory_Layer.getLayers()[0].getLatLngs()[0];
            for(var i=0;i<control.Trajectory_Layer.getLayers().length;i++){
                var latlngs = control.Trajectory_Layer.getLayers()[i].getLatLngs();
                
                for(var j=0;j<latlngs.length;j++){
                    points.push(latlngs[j]);
                    if(currMarkerLoc.lat ==latlngs[j].lat && currMarkerLoc.lng ==latlngs[j].lng){
                        return points;
                    }
                    control.labels.forEach(label => {
                        var layers = control.Marker_Groups[label].getLayers();
                        for (var i=0;i<layers.length;i++){
                            if(layers[i].getLatLng().lat == latlngs[j].lat && layers[i].getLatLng().lng == latlngs[j].lng){
                                points = [latlngs[j]];
                            }
                        }
                    });
                }
            }
            return points;
        }
        /**
         * Function to make a random colour for the segmentation control
         */
        function makeRandomColor() {
            return '#' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6);
        }
        /**
         * Clears the segmentation
         */
        function clearSegmentation(){
            control.labels.forEach(element =>{
                control.Segmentation_Groups[element].clearLayers();
            });
        }
    },
    /**
     * Shows the control
     */
    show: function(){
        var container = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0];
        container.style.display = 'block';
        var btnopen = document.getElementById("btn-open-segment-control");
        btnopen.style.display = 'none';
    },
    /**
     * Hides the control
     */
    hide: function(){
        var container = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0];
        container.style.display = 'none';
        var btnopen = document.getElementById("btn-open-segment-control");
        btnopen.style.display = 'block';
    },
    labels: [], //The labels 
    Marker_Groups:{},
    Bind_Markers:true,//Determines whether markers are attached to the nearest point
    Trajectory_Layer:null,//Trajectory layer
    Segmentation_Groups:{},
    icon:""//Icon image
});
/**
 * Creates the Segmentation control instance
 * icon: The image to use as an icon
 * options: Specifies options for the points
 */
L.control.SegmentationControl = function(icon,options) {
    this.icon = icon ? icon: "Segmentation-Control/map_marker_font_awesome.png";
    Bind_Markers = true;
    Trajectory_Layer = null;
    if (options["bind"]==false){
        Bind_Markers=false;
    }
    return new L.Control.SegmentationControl(options);
};