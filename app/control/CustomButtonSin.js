sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSin", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                stato: {type: "string", defaultValue: "Good"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["buttonGood", "buttonWarning", "buttonError"];
            var stato = this.getStato();
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            switch (stato) {
                case "Warning":
                    this.addStyleClass("buttonWarning");
                    break;
                case "Error":
                    this.addStyleClass("buttonError");
                    break;
                case "Good":
                    this.addStyleClass("buttonGood");
                    break;
            }
        }
    });
});