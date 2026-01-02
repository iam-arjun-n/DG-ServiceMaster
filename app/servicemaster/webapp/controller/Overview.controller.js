sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/Token",
    "sap/ui/model/FilterType",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "com/mdg/deloitte/servicemaster/model/formatter"
], (Controller, Fragment, FilterOperator, Filter, Token, FilterType, MessageBox, JSONModel, Spreadsheet, formatter) => {
    "use strict";

    return Controller.extend("com.mdg.deloitte.servicemaster.controller.Overview", {
        formatter: formatter,
        onInit: function () {
            let that = this;
            this.oBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
            this.getOwnerComponent().busyDialog.close();
            var globalModel = this.getOwnerComponent().getModel('mainServiceModel');
            this.getView().setModel(globalModel);
            var maxL = this.getView().byId("maxL").getValue();
            if (maxL == 0) {
                maxL = 50;
            }
            globalModel.setSizeLimit(maxL);

            this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            // this._myDelegate = {
            //     "onAfterRendering": function (oEvent) {
            //         let currUser = sap.ushell.Container.getService("UserInfo")?.getEmail()?.toLowerCase();
            //         if (currUser && currUser !== '') {
            //             this.byId("crBy").addToken(new sap.m.Token({
            //                 text: currUser
            //             }));
            //             oEvent?.srcControl?.fireSearch();
            //         }
            //     }
            // };
            // this.byId("filterbar").addEventDelegate(this._myDelegate, this);
        },
        onDefaultAction: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Create", {
                type: "C",
                key: "C"
            });

        },

        navTo: function (view) {
            this.getOwnerComponent().getRouter().navTo(view);
        },

        onCreate: function () {
            this.navTo("Create");
        },
        onRequestSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var oView = this.getView();
            var aSelectedItems = oTable.getSelectedItems();
            var oViewBtn = oView.byId("btnViewRequest");
            oViewBtn.setEnabled(aSelectedItems.length === 1);
        },

        onviewRequest: function () {
            var oTable = this.getView().byId("tblRequests");
            if (!oTable) {
                MessageBox.error("Table not found. Please check the ID.");
                return;
            }

            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                MessageBox.warning("Please select a record to view details.");
                return;
            }

            var oContext = oSelectedItem.getBindingContext("mainServiceModel");
            if (!oContext) {
                MessageBox.error("Binding context not found. Please check the model binding.");
                return;
            }

            var requestId = oContext.getProperty("requestId");
            if (!requestId) {
                MessageBox.error("Selected record does not contain a valid Request ID.");
                return;
            }
          this.getOwnerComponent().getRouter().navTo("View", { requestId: requestId });
        },
        ViewServiceNumber: function (oEvent) {
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext("mainServiceModel");

            if (!oContext) {
                sap.m.MessageBox.error("No request selected");
                return;
            }

            var sReqId = oContext.getObject().requestId;
            var oModel = this.getView().getModel("mainServiceModel");

            sap.ui.core.BusyIndicator.show(0);

            oModel.read("/ServiceMasterRequests('" + sReqId + "')", {
                urlParameters: {
                    "$expand": "serviceMasterItems,serviceMasterItems/ServiceDescriptions"
                },
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();

                    var aServiceNumbers = [];
                    (oData.serviceMasterItems?.results || []).forEach(function (item) {
                        (item.ServiceDescriptions?.results || []).forEach(function (desc) {
                            if (desc.ActivityNumber) {
                                aServiceNumbers.push({
                                    ActivityNumber: desc.ActivityNumber,
                                    Description: desc.Description || ""
                                });
                            }
                        });
                    });

                    if (!aServiceNumbers.length) {
                        sap.m.MessageToast.show("No Service Numbers found");
                        return;
                    }
                    this._openServiceNumberPopover(oSource, aServiceNumbers);

                }.bind(this),
                error: function () {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Failed to fetch Service Numbers");
                }
            });
        },
        _openServiceNumberPopover: function (oSource, aServiceNumbers) {

            if (!this._oServicePopover) {
                this._oServicePopover = new sap.m.Popover({
                    title: "Created Service Number(s)",
                    placement: sap.m.PlacementType.Auto,
                    contentWidth: "400px",
                    resizable: true,
                    draggable: true,
                    content: [
                        new sap.m.List({
                            items: {
                                path: "servicePopoverModel>/numbers",
                                template: new sap.m.StandardListItem({
                                    title: "{servicePopoverModel>ActivityNumber}",
                                    description: "{servicePopoverModel>Description}"
                                })
                            }
                        })
                    ]
                });

                this.getView().addDependent(this._oServicePopover);
            }
            var oPopoverModel = new sap.ui.model.json.JSONModel({
                numbers: aServiceNumbers
            });

            this._oServicePopover.setModel(oPopoverModel, "servicePopoverModel");
            this._oServicePopover.openBy(oSource);
        },
        onSearch: function (oEvent) {
            var sValue =
                oEvent.getParameter("newValue") ||
                oEvent.getParameter("query");
            var oList = sap.ui.core.Fragment.byId(
                this.getView().getId(),
                "serviceList"
            );

            if (!oList) {
                return;
            }

            var oBinding = oList.getBinding("items");

            if (!sValue) {
                oBinding.filter([]);
                return;
            }

            var oFilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter(
                        "PoServiceNumber",
                        sap.ui.model.FilterOperator.Contains,
                        sValue
                    ),
                    new sap.ui.model.Filter(
                        "POServiceDesc",
                        sap.ui.model.FilterOperator.Contains,
                        sValue
                    )
                ],
                and: false
            });

            oBinding.filter([oFilter]);
        },
        onDisplay: function () {
            const oModel = this.getOwnerComponent().getModel("masterServiceModel");

            const aFilters = [
                new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")
            ];

            oModel.read("/I_TripServiceNumberVH", {
                filters: aFilters,
                success: function (oData) {
                    if (!oData.results.length) {
                        MessageBox.warning("No Service Numbers found");
                        return;
                    }
                    const oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(oJsonModel, "serviceVH");
                    if (!this._oServiceDialog) {
                        this._oServiceDialog = sap.ui.xmlfragment(
                            this.getView().getId(),
                            "com.mdg.deloitte.servicemaster.fragments.ServiceDialog",
                            this
                        );
                        this.getView().addDependent(this._oServiceDialog);
                    }

                    this._oServiceDialog.open();

                }.bind(this),
                error: function () {
                    MessageBox.error("Failed to load Service Numbers");
                }
            });
        },
        onServiceConfirm: function () {
            const oList = this.byId("serviceList");
            const oSelectedItem = oList.getSelectedItem();
            if (!oSelectedItem) {
                MessageBox.warning("Please select a Service Number");
                return;
            }
            let sServiceNumber = oSelectedItem.getTitle();
            sServiceNumber = sServiceNumber.replace(/\D/g, "").padStart(18, "0");
            this._oServiceDialog.close();
            this.getOwnerComponent().getRouter().navTo("Change", { sServiceNumber: sServiceNumber });
        },

        onServiceCancel: function () {
            this._oServiceDialog.close();
        }
    });
});