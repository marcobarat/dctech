sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSPC", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                fase: {type: "string", defaultValue: ""},
                nCamp: {type: "string", defaultValue: ""},
                allarme: {type: "string", defaultValue: ""}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "SPCButtonEmpty", "DualSPCButtonContent"];
            var fase = this.getFase();
            var nCamp = this.getNCamp();
            var allarme = this.getAllarme();
            for (var k = 0; k < CSS_classesButton.length; k++) {
                this.removeStyleClass(CSS_classesButton[k]);
            }
            switch (fase) {
                case "1":
                    this.setEnabled(true);
                    if (this.getIcon() !== "img/triangolo_buco.png") {
                        this.setIcon("img/triangolo_buco.png");
                    }
                    this.setText(nCamp);
                    this.addStyleClass("SPCButtonPhase1");
                    this.addStyleClass("SPCButtonColorYellow");
                    this.addStyleClass("DualSPCButtonContent");
                    break;
                case "2":
                    this.setEnabled(true);
                    this.setIcon("");
                    this.setText("");
                    if (allarme === "0") {
                        this.addStyleClass("SPCButtonColorGreen");
                    } else if (allarme === "1") {
                        this.addStyleClass("SPCButtonColorYellow");
                    }
                    break;
                default:
                    this.setText("");
                    this.addStyleClass("SPCButtonEmpty");
                    this.setIcon("");
                    this.setEnabled(false);
                    break;
            }
        }
    });
});