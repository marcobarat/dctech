sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button"
], function (Control, Button) {
    "use strict";

    var CustomSPCButton = Button.extend("myapp.control.CustomSPCButton", {

        renderer: {},

        onAfterRendering: function () {
            this.addStyleClass('SPCButtonHeight');
        }
    });

    return CustomSPCButton;
});