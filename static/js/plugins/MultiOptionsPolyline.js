(function () {
'use strict';

/*
 * L.MultiOptionsPolyline is a MultiPolyLine which parts can be styled differently.
 * options: {
 *     multiOptions: {
 *         optionIdxFn: function (latLng, prevLatLng, index, allLatlngs),
 *         fnContext: ctx, // the context to call optionIdxFn (optional)
 *         options: [{}, {}, {}] or function, // options for the index returned by optionIdxFn. If supplied with a function then it will be called with the index
 *         copyBaseOptions: true
 *     },
 *     // other options from Polyline
 * }
 */
L.MultiOptionsPolyline = L.FeatureGroup.extend({
    _getMin: function (latlngs){
        var min = {};
        // console.log(latlngs[0]);
        for (key in latlngs[0].meta){
            latlngs.forEach(function (element, index, array){
                if (typeof min[key] == 'undefined'){
                    min[key] = element.meta[key];   
                } else if (element.meta[key] < min[key]) { 
                    min[key] = element.meta[key];
                }
                
            });
        }
        this.min = min;
    },
    _getMax: function (latlngs){
        var max = {};
        for (key in latlngs[0].meta){
            latlngs.forEach(function (element, index, array){
                if (typeof max[key] == 'undefined'){
                    max[key] = element.meta[key];   
                } else if (element.meta[key] > max[key]) { 
                    max[key] = element.meta[key];
                }
                
            });
        }
        this.max = max;
    },

    initialize: function (latlngs, options) {
        var copyBaseOptions = options.multiOptions.copyBaseOptions;

        this._layers = {};
        this._options = options;
        if (copyBaseOptions === undefined || copyBaseOptions) {
            this._copyBaseOptions();

        }
        this._getMin(latlngs);
        this._getMax(latlngs);
        this.setLatLngs(latlngs);
        
    },

    _copyBaseOptions: function () {
        var multiOptions = this._options.multiOptions,
            baseOptions,
            optionsArray = multiOptions.options,
            i, len = optionsArray.length;

        baseOptions = L.extend({}, this._options);
        delete baseOptions.multiOptions;

        for (i = 0; i < len; ++i) {
            optionsArray[i] = L.extend({}, baseOptions, optionsArray[i]);
        }
    },

    setLatLngs: function (latlngs) {
        var i, len = latlngs.length,
            multiOptions = this._options.multiOptions,
            optionIdxFn = multiOptions.optionIdxFn,
            fnContext = multiOptions.fnContext || this,
            prevOptionIdx, optionIdx,
            segmentLatlngs;

        this._originalLatlngs = latlngs;

        this.eachLayer(function (layer) {
            this.removeLayer(layer);
        }, this);

        for (i = 1; i < len; ++i) {
            optionIdx = optionIdxFn.call(
                fnContext, latlngs[i], latlngs[i - 1], i, latlngs);
            
            if (i === 1) {
                segmentLatlngs = [latlngs[0]];
                prevOptionIdx = optionIdxFn.call(fnContext, latlngs[0], latlngs[0], 0, latlngs);
            }

            segmentLatlngs.push(latlngs[i]);

            // is there a change in options or is it the last point?
            // if (prevOptionIdx !== optionIdx || i === len - 1) {
                //Check if options is a function or an array
                if(typeof multiOptions.options == "function"){
                    this.addLayer(new L.Polyline(segmentLatlngs, multiOptions.options(prevOptionIdx)));
                }else{
                    this.addLayer(new L.Polyline(segmentLatlngs, multiOptions.options[prevOptionIdx]));
                }

                prevOptionIdx = optionIdx;
                segmentLatlngs = [latlngs[i]];
            // }
        }

        return this;
    },

    getLatLngs: function () {
        return this._originalLatlngs;
    },

    getLatLngsSegments: function () {
        var latlngs = [];

        this.eachLayer(function (layer) {
            latlngs.push(layer.getLatLngs());
        });

        return latlngs;
    }
});

L.multiOptionsPolyline = function (latlngs, options) {
    return new L.MultiOptionsPolyline(latlngs, options);
};

}());