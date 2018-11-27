L.Control.DecoratorLegend = L.Control.extend({
	
	onAdd: function (map) {
		var controlDiv = L.DomUtil.create('div', 'leaflet-control-decorator-legend-custom');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            // .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        // .addListener(controlDiv, 'click', function () {
        //     showPanel();
        // });
        this._controlDiv = controlDiv;
        
        return controlDiv;
	},

	// initializeComponents: function(colors, values){
	initializeComponents: function(colors, values){
		$('.leaflet-control-decorator-legend-custom').append('<div id="decorator-legend-custom-container" class="float-left"></div>');
		var html = 	'<div style:"display: inline-flex">\n'+
					'</div>\n';
		$('#decorator-legend-custom-container').append(html);
		for (var i = 0; i < colors.length-1; i++){
			var v = Math.round(values[i]*1)/1;
			html = 	'<div style:"display: inline-flex">\n'+
					'	<div class="decorator-legend-color-value" style="background-color: '+colors[i]+'; color: black;"></div>\n'+
					'	<div>\>&nbsp;'+v+'</div>\n'+
					'</div>\n';
			$('#decorator-legend-custom-container').append(html);
		}
	},

});

L.control.DecoratorLegend = function(options) {
    return new L.Control.DecoratorLegend(options);
};