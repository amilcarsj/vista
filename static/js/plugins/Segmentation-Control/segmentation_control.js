check_labels = [];


L.Control.SegmentationControl = L.Control.extend({
    //adds the Control to a map
    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-segment-trajectory-control-custom');
        L.DomEvent.addListener(controlDiv, 'click', L.DomEvent.stopPropagation);
        this._controlDiv = controlDiv;
        return controlDiv;
    },
    //Initializes the component HTML
    initializeComponents: function () {
        var customcontrol = document.getElementsByClassName('leaflet-segment-trajectory-control-custom')[0];
        customcontrol.innerHTML = "<button id='btn-open-segment-control' class='btn-open-close leaflet-control-button-custom'><img src='/media/map_marker_font_awesome.png'/></button>";
        customcontrolcontent = L.DomUtil.create('div', 'leaflet-segment-trajectory-control-custom-container');
        customcontrolcontent.innerHTML = '<button id="btn-close-segment-control" type="button" class="close-map-container" aria-label="Close"><span aria-hidden="true">×</span></button><br>';

        var table = document.createElement('table');
        this.labels.forEach(label => {
            var tr = document.createElement('tr');
            var addtd = document.createElement('td');
            addtd.innerHTML = "<button value=" + label + " class='btn-add'>+</button>";
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
            this.Segmentation_Points[label] = [];
        });
        customcontrolcontent.appendChild(table);
        customcontrolcontent.style.display = "none";
        customcontrol.appendChild(customcontrolcontent);
        var control = this;

        var btnadd = document.getElementsByClassName("btn-add");
        var colorpickers = document.getElementsByClassName("leaflet-custom-color");
        for (var i = 0; i < colorpickers.length; i++) {
            colorpickers[i].addEventListener('change', changeColour, false);
            colorpickers[i].value = makeRandomColor();
            colorpickers[i].dispatchEvent(new Event("change"));
        }

        for (var i = 0; i < btnadd.length; i++) {
            btnadd[i].addEventListener('click', addMarker, false);
        }

        var btnopen = document.getElementById("btn-open-segment-control");
        btnopen.addEventListener('click', this.show, false);
        var btnclose = document.getElementById("btn-close-segment-control");
        btnclose.addEventListener('click', this.hide, false);

        function bindMarker(e) {
            clearSegmentation();
            var color = control.findColor(e.target.getPopup().getContent());
            if (control.Bind_Markers && control.Trajectory_Layer != null) {
                var minindex = 0, mindist = 0;
                var c = control.Trajectory_Layer.getLatLngs();
                var latlng = e.target.getLatLng();
                for (var i = 0; i < c.length; i++) {
                    var dist = Math.abs(calculateDistance(c[i][0], c[i][1], latlng.lat, latlng.lng));
                    if (dist < mindist || i == 0) {
                        minindex = i;
                        mindist = dist;
                    }
                }
                //this.dispatchEvent(event);

                e.target.setLatLng({'lon': c[minindex][1], 'lat': c[minindex][0]});
                control.generateSegmentation();

            }
        }

        /***
         * GENERATES A GRAPH
         */
        function addMarker(e) {
            let getMarker = function (color) {
                //var icon = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.0" width="700" height="700"><rect id="backgroundrect" width="100%" height="100%" x="0" y="0" fill="none" stroke="none"/><defs id="defs9"/><g class="currentLayer"><title>Layer 1</title><g id="g4" class="selected" transform="rotate(-89.93659973144531 350.3506469726563,349.46508789062506) " stroke="#000000" stroke-opacity="1" stroke-width="4" fill="#ffffff" fill-opacity="1"><path d="M44.7,50.6v24.9h3.4V50.6c8.2-0.8,14.5-7.8,14.5-16.1c0-8.9-7.3-16.2-16.2-16.2s-16.2,7.3-16.2,16.2   C30.2,42.8,36.6,49.7,44.7,50.6z" id="path6" style="" stroke="#000000" stroke-opacity="1" stroke-width="25" fill="' + color + '" fill-opacity="1"/></g></g></svg>';
                var icon = '<svg width="91" height="91" xmlns="http://www.w3.org/2000/svg">\n' +
                    '\n' +
                    ' <g>\n' +
                    '  <title>background</title>\n' +
                    '  <rect fill="none" id="canvas_background" height="402" width="582" y="-1" x="-1"/>\n' +
                    ' </g>\n' +
                    ' <g>\n' +
                    '  <title>Layer 1</title>\n' +
                    '  <ellipse stroke="#000" ry="18.833295" rx="18.833296" id="svg_5" cy="34.479191" cx="46.499999" stroke-width="1.5" fill="#000000"/>\n' +
                    '  <rect stroke="#000" id="svg_6" height="24.333285" width="7.333319" y="52.645822" x="42.666672" fill-opacity="null" stroke-opacity="null" stroke-width="1.5" fill="#000000"/>\n' +
                    '  <g id="svg_1">\n' +
                    '   <path fill="' + color + '" id="svg_2" d="m44.7,50.6l0,24.9l3.4,0l0,-24.9c8.2,-0.8 14.5,-7.8 14.5,-16.1c0,-8.9 -7.3,-16.2 -16.2,-16.2s-16.2,7.3 -16.2,16.2c0,8.3 6.4,15.2 14.5,16.1z"/>\n' +
                    '  </g>\n' +
                    ' </g>\n' +
                    '</svg>';
                var svgURL = "data:image/svg+xml;base64," + btoa(icon);
                var myIcon = L.icon({
                    iconUrl: svgURL,
                    iconSize: [60, 60], // size of the icon
                    iconAnchor: [30, 50], // point of the icon which will correspond to marker's location
                });
                return myIcon;
            };

            var colour = this.parentNode.parentNode.childNodes[2].childNodes[0].value;
            var label = this.parentNode.parentNode.childNodes[1].innerHTML;
            //console.log(colour);
            var marker = L.marker(map.getCenter(), {
                draggable: true,
                icon: getMarker(colour)
            });
            control.Marker_Groups[label].addLayer(marker);
            marker.bindPopup(label);
            marker.on('dragend', bindMarker);
        }

        function changeColour(e) {
            var label = this.parentNode.parentNode.childNodes[1].innerHTML;
            var btn = this.parentNode.parentNode.childNodes[0].childNodes[0];
            var colour = this.value;
            btn.style.background = colour;
            clearSegmentation();
            control.generateSegmentation();
            control.generateLineChart();
            control.generateScatterChart();
        }

        //Gets the colour for a segmentation control


        //Calculate the distance between two points
        function calculateDistance(lat1, lng1, lat2, lng2) {
            var lat1 = toRadian(lat1);
            var lat2 = toRadian(lat2);
            var lng1 = toRadian(lng1);
            var lng2 = toRadian(lng2);
            var dlat = lat2 - lat1;
            var dlng = lng2 - lng1;
            var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const EARTH_RADIUS = 9793000;
            return c * EARTH_RADIUS;
        }

        function toRadian(d) {
            return d * Math.PI / 180;
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
        function clearSegmentation() {
            control.labels.forEach(element => {
                control.Segmentation_Groups[element].clearLayers();
            });
        }
    },
    generateLineChart: function () {
        let avg_data = {};
        this.labels.forEach(label => {
            avg_data[label] = {'sum': 0, 'count': 0};
        });
        avg_data[null] = {'sum': 0, 'count': 0};
        let chart_data = {datasets: []};
        let labels = [];
        let points = [];
        let legend_labels = [];

        for (let i = 0; i < this.Point_Labels.length; i++) {
            labels.push(i);
            points.push({x: i, y: this.line_chart_data[i]});
            avg_data[this.Point_Labels[i]].sum += this.line_chart_data[i];
            avg_data[this.Point_Labels[i]].count++;
            if (i !== 0) {
                if (this.Point_Labels[i] !== this.Point_Labels[i - 1]) {
                    chart_data['datasets'].push({
                        'data': points,
                        'label': this.Point_Labels[i - 1],
                        'borderColor': this.findColor(this.Point_Labels[i - 1]),
                        fill: false
                    });
                    points = [{x: i, y: this.line_chart_data[i]}];
                }
            }
        }
        if (points.length !== 0) {
            let last = this.Point_Labels[this.Point_Labels.length - 1];
            let l = 'unlabelled';
            let c = 'red';
            if (last != null) {
                l = last;
                c = this.findColor(last);
            }
            chart_data['datasets'].push({'data': points, 'label': l, 'borderColor': c, fill: false});
        }
        for (let key in avg_data) {
            if (avg_data[key].count > 0 && key.toString() != 'null') {
                let avg = avg_data[key].sum / avg_data[key].count;
                let c = this.findColor(key);
                chart_data['datasets'].unshift({
                    'data': [{x: 0, y: avg}, {x: this.Point_Labels.length - 1, y: avg}],
                    'label': key + " Average",
                    'borderColor': c,
                    borderDash: [5, 5],
                    fill: false
                });
            }
        }
        line_chart.data.datasets = chart_data.datasets;
        line_chart.data.labels = labels;
        line_chart.update();
        for (let i = 0; i < chart_data.datasets.length; i++) {
            let exists = false;
            for (let j=0;j<legend_labels.length;j++){
                if (chart_data.datasets[i].label==legend_labels[j][0]){
                    exists= true;
                    break;
                }
            }
            if (!exists){
                legend_labels.push([chart_data.datasets[i].label, chart_data.datasets[i].borderColor]);
            }
        }

        $("#legend").html("");

            for (let i=0;i<legend_labels.length;i++){
                let borderType = legend_labels[i][0].indexOf('Average') !== -1 ? "dashed" : "solid";
                $("#legend").append(`<div class="label-box" style="border:3px ${borderType} ${legend_labels[i][1]};"></div>${legend_labels[i][0]}`);

            }
        },
        generateScatterChart: function () {
            let coords = [];
            let datasets = [];
            if (this.Point_Labels.length != 0) {
                //console.log("Updating");
                let plabels = this.Point_Labels;
                let data_lists = {};
                this.labels.forEach(label => {
                    data_lists[label] = [];
                });
                data_lists[null] = [];
                for (let i = 0; i < plabels.length; i++) {
                    data_lists[plabels[i]].push({
                        x: this.scatter_chart_x_data[i],
                        y: this.scatter_chart_y_data[i]
                    });
                }
                for (let key in data_lists) {

                    let c = this.findColor(key);
                    let label = key;
                    if (key.toString() == 'null') {
                        c = 'red';
                        label = "unlabelled"
                    }
                    if (data_lists[key].length > 0) {
                        datasets.push({'label': label, 'data': data_lists[key], 'borderColor': c});
                    }
                }
            }
            else {
                for (let i = 0; i < this.scatter_chart_x_data.length; i++) {
                    coords.push({x: this.scatter_chart_x_data[i], y: this.scatter_chart_y_data[i]})
                }
                datasets.push({
                    'label': 'Scatter',
                    'data': coords,
                    'borderColor': 'red'
                });
            }
            this.scatter_chart.data.datasets = datasets;
            this.scatter_chart.update();
        },
        findColor: function (label) {
            var table = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0].childNodes[2];
            for (var i = 0; i < table.childNodes.length; i++) {
                if (table.childNodes[i].childNodes[1].innerHTML == label) {
                    return table.childNodes[i].childNodes[2].childNodes[0].value;
                }
            }
            return null;
        },
        generateSegmentation: function () {
            let control = this;

            function addLine(points, label) {
                let color = control.findColor(label);
                return L.polyline(points, {
                    color: color,
                    weight: 3,
                    opacity: 1
                });
            }

            function getLabel(point) {
                let label_return = null;
                control.labels.forEach(label => {
                    var layers = control.Marker_Groups[label].getLayers();
                    for (var i = 0; i < layers.length; i++) {
                        if (layers[i].getLatLng().lat == point[0] && layers[i].getLatLng().lng == point[1]) {
                            label_return = label;
                        }
                    }
                });
                return label_return;
            }

            function hasMarker(point) {
                let found = false;
                control.labels.forEach(label => {
                    var layers = control.Marker_Groups[label].getLayers();
                    for (var i = 0; i < layers.length; i++) {
                        ////console.log(layers[i].getLatLng().lat +"==="+ point.lat);
                        ////console.log("Latitude: " + (layers[i].getLatLng().lat == point.lat) + " Longitude: " + (layers[i].getLatLng().lng == point.lng));
                        if ((layers[i].getLatLng().lat == point[0]) && (layers[i].getLatLng().lng == point[1])) {
                            //console.log("Return True");
                            found = true;
                        }
                    }
                });
                return found;
            }

            //console.log("Beginning Segmentation");
            this.Point_Labels = [];
            let coords=[]
            try{
                coords = this.Trajectory_Layer.getLatLngs();
            }
            catch(err){
              //console.log(err);
            }
            let marker_indexes = [];
            for (let i = 0; i < coords.length; i++) {
                this.Point_Labels.push(null);
                if (hasMarker(coords[i])) {
                    marker_indexes.push(i);
                }
            }
            if (marker_indexes.length == 0) {
                return;
            }
            //console.log(marker_indexes);
            let points = [];
            let label = getLabel(coords[marker_indexes[marker_indexes.length - 1]]);
            points.push(coords[marker_indexes[marker_indexes.length - 1]]);
            //console.log(label);
            this.Point_Labels[marker_indexes[marker_indexes.length - 1]] = label;
            for (let j = marker_indexes[marker_indexes.length - 1] - 1; j >= 0; j--) {
                points.push(coords[j]);
                if ((marker_indexes.includes(j) || j == 0) && points.length != 0) {
                    //console.log(label);
                    //console.log(points);
                    control.Segmentation_Groups[label].addLayer(addLine(points, label));
                    points = [coords[j]];
                }
                if (marker_indexes.includes(j)) {
                    label = getLabel(coords[j]);
                }
                this.Point_Labels[j] = label;
            }
            //console.log(this.Point_Labels);
            control.generateLineChart();
            control.generateScatterChart();
        },
        /**
         * Shows the control
         */
        show: function () {
            var container = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0];
            container.style.display = 'block';
            var btnopen = document.getElementById("btn-open-segment-control");
            btnopen.style.display = 'none';
        },
        /**
         * Hides the control
         */
        hide: function () {
            var container = document.getElementsByClassName("leaflet-segment-trajectory-control-custom-container")[0];
            container.style.display = 'none';
            var btnopen = document.getElementById("btn-open-segment-control");
            btnopen.style.display = 'block';
        },
        labels: [], //The labels
        Marker_Groups: {},
        Bind_Markers: true,//Determines whether markers are attached to the nearest point
        Trajectory_Layer: null,//Trajectory layer
        Segmentation_Groups: {},
        icon: "",//Icon image
        line_chart: null,
        line_chart_data: null,
        scatter_chart: null,
        scatter_chart_x_data: null,
        scatter_chart_y_data: null,
        Segmentation_Points: {},
        Point_Labels: []
    });
    /**
     * Creates the Segmentation control instance
     * icon: The image to use as an icon
     * options: Specifies options for the points
     */
    L.control.SegmentationControl = function (options) {
        ////console.log(options.icon);
        //this.icon = options.icon.length!=0 ? options.icon: "/media/map_marker_font_awesome.png";
        Bind_Markers = true;
        Trajectory_Layer = null;
        if (options["bind"] == false) {
            Bind_Markers = false;
        }
        if (options['line_chart'] != null && options['line_chart'] != 'undefined') {
            this.line_chart = options['line_chart'];
        }
        if (options['scatter_chart'] != null && options['scatter_chart'] != 'undefined') {
            this.scatter_chart = options['scatter_chart'];
        }

        return new L.Control.SegmentationControl(options);
    };