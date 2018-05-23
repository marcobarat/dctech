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

                IDs: [],

                renderer: {},

                onAfterRendering: function () {
                    if (this.IDs.indexOf(this.getId()) === -1) {
                        this.expandToLevel(20);
                        var that = this;
                        this.IDs.push(this.getId());
                        setTimeout(function () {
                            var num = that.getBinding("rows").getLength();
                            var temp;
                            for (var i = num - 1; i >= 0; i--) {
                                temp = that.getBinding("rows").getContextByIndex(i).getObject();
                                if (typeof temp !== "undefined") {
                                    if (temp.expand === 0) {
                                        that.collapse(i);
                                    }
                                }
                            }
                        }, 0);
                    }
                    if (sap.ui.table.TreeTable.prototype.onAfterRendering) {
                        sap.ui.table.TreeTable.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
                    }
                }
            });
        });