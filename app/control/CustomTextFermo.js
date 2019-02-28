sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    return Text.extend("myapp.control.CustomTextFermo", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                origine: {type: "string"}
            }
        },
        renderer: {},

        getSize: function (txt, font) {
            this.element = document.createElement('canvas');
            this.context = this.element.getContext("2d");
            this.context.font = font;
            return this.context.measureText(txt).width;
        },
        onAfterRendering: function () {
            if (sap.m.Text.prototype.onAfterRendering) {
                sap.m.Text.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
            }
            if (this.getText().length > 0) {
                var jqueryObj = jQuery.sap.byId(this.getId());
//                var limit = 0.92 * document.documentElement.clientWidth;
                var limit = jqueryObj.parent().parent().width();
                if (Number(limit) > 10) {
                    var fontSize = 75;
                    var param = this.getSize(this.getText(), String(fontSize) + "px Arial");
                    while (Number(param) >= limit && fontSize >= 20) {
                        fontSize -= 1;
                        param = this.getSize(this.getText(), String(fontSize) + "px Arial");
                    }
                    var padTop = Math.max(-(1.3 / 36) * fontSize + ((1.3 * 25) / 12), 0);
                    jqueryObj.css("font-size", String(fontSize) + "px");
                    jqueryObj.css("padding-top", String(padTop) + "rem");
                }
            }
        }
    });
});