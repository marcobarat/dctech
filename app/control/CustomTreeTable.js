//jQuery.sap.declare("myapp.control.CustomTreeTable");
//sap.ui.table.TreeTable.extend("myapp.control.CustomTreeTable", {
//    
//    renderer: {}
//});


sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/table/TreeTable"],
        function (Control, TreeTable) {
            "use strict";

            return TreeTable.extend("myapp.control.CustomTreeTable", {

                renderer: {},

                onAfterRendering: function () {
                    this.expandToLevel(100);
                    var that = this;
                    setTimeout(function () {
                        var num = that._iBindingLength;
                        var temp;
                        for (var i = num - 1; i >= 0; i--) {
                            temp = that.getContextByIndex(i).getObject();
                            if (temp.expand == 0) {
                                that.collapse(i);
                            }
                        }
                    }, 0);
                    if (sap.ui.table.TreeTable.prototype.onAfterRendering) {
                        sap.ui.table.TreeTable.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
                    }
                }
            });
        });