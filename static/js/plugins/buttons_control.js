L.Control.ButtonControl = L.Control.extend({
    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-button-control-custom');
        L.DomEvent.addListener(controlDiv, 'click', L.DomEvent.stopPropagation);
        this._controlDiv = controlDiv;
        return controlDiv;
    },
    initializeComponents: function () {
        console.log(this);
        $(".leaflet-button-control-custom").empty();
        if(this.options.prev!=null){
            $(".leaflet-button-control-custom").append(`<a id="btn-previous" href="${this.options.prev}" class="btn btn-primary"><<</a>`);
        }
        if(this.options.next!=null){
            $(".leaflet-button-control-custom").append(`<a id="btn-next" href="${this.options.next}" class="btn btn-primary">>></a>`);

        }
        //$(".leaflet-button-control-custom").append(`<button id="btn-finish" class="btn btn-success">Finish</button>`);
    },
    next_url: null,
    prev_url: null
});

L.control.ButtonControl = function (options) {
    return new L.Control.ButtonControl(options);
};