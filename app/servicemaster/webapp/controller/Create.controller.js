sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/format/DateFormat",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",
        "sap/ui/model/FilterType",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Filter"
    ],
    function (Controller, JSONModel, DateFormat, MessageBox, MessageToast, Fragment, FilterType, FilterOperator, Filter) {
        "use strict";

        return Controller.extend(
            "com.mdg.deloitte.servicemaster.controller.Create",
            {
                onInit: function () {
                    this.i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                    //comment model
                    var oComments = new JSONModel();
                    var aComments = [];
                    oComments.setData(aComments);
                    this.getOwnerComponent().setModel(oComments, "commentModel");

                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.getRoute("Create").attachPatternMatched(this.onEntry, this);
                    oRouter.getRoute("Change").attachPatternMatched(this.onEntry, this);
                    // oRouter.getRoute("extendRoute").attachPatternMatched(this.onEntry, this);
                    // oRouter.getRoute("deleteRoute").attachPatternMatched(this.onEntry, this);
                    this.logonLanguage = sap.ui.getCore().getConfiguration().getLanguage().toUpperCase();
                    this.getOwnerComponent().busyDialog.close();
                    //   let exclmodel = new JSONModel(sap.ui.require.toUrl('com/deloitte/asset/mdg/srv/create/model/ExcelTemplate.json'));
                    //   this.getView().setModel(exclmodel, "MulExclTemplate"); 

                },
                navBack: function () {
                    var that = this;

                    var sText = "Unsaved data will be lost. Do you want to continue?";

                    MessageBox.warning(sText, {
                        title: "Confirm",
                        styleClass: "",
                        actions: [
                            "Yes", MessageBox.Action.CANCEL
                        ],
                        emphasizedAction: "Yes",        // default
                        onClose: function (sAction) {
                            if (sAction === "Yes") {
                                that.onNavBack();
                            }
                        }
                    });
                },
                onNavBack: function () {
                    this.getOwnerComponent().getRouter().navTo("RouteOverview");
                },
                onEntry: function (oEvent) {
                    // Gets route name and route arguments
                    let routeName = oEvent.getParameter("name");
                    let routeArguments = oEvent.getParameter("arguments");
                    this.initModels(routeName);
                    if (routeName === "Change") {
                        let service = routeArguments.sServiceNumber;
                        this.updateServiceRequestModel(service);
                    }
                },
                initModels: function (routeName) {
                    // Sets Resource Bundle
                    this._oBundle = this.getView().getModel("i18n").getResourceBundle();
                    this.createCommentModel();
                    this.createWFModel();
                    this.materialCollectionModelReset(routeName);
                    // this.createMessageModel();

                    // Create other models
                    this.getView().setModel(new JSONModel({}), "ServiceRequestModel");

                    // Create JSON Model for Excel Column Config
                    // var oModel = new JSONModel(sap.ui.require.toUrl("materialmaster/model/excelHdr.json"));
                    // let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    // let appPath = appId.replaceAll(".", "/");
                    // let sExcelHdrPath = `${jQuery.sap.getModulePath(appPath)}/model/excelHdr.json`;
                    // let oExcelHdr = new JSONModel(sExcelHdrPath);
                    // this.getView().setModel(oExcelHdr, "excelHdr");
                    this.isDisplayonly = routeName;
                },
                createCommentModel: function () {
                    var oComments = new JSONModel();
                    var aComments = [];
                    oComments.setData(aComments);

                    // Set Model to Owner Component
                    this.getOwnerComponent().setModel(oComments, "commentModel");
                },
                materialCollectionModelReset: function (routeName) {
                    let requestType = "";
                    switch (routeName) {
                        case "Create":
                            requestType = "Create";
                            break;
                        case "Change":
                            requestType = "Change";
                            break;
                        // case "extendRoute":
                        //     requestType = "Extend";
                        //     break;
                        // case "deleteRoute":
                        //     requestType = "Delete";
                        //     break;
                        // case "viewRoute":

                        //     break;
                        default:
                            break;
                    }
                    var oData = {
                        RequestId: "",
                        RequestType: requestType,
                        WorkflowInstanceId: "",
                        ServiceCollection: []
                    };
                    this.getView().setModel(new JSONModel(oData), "serviceModel");
                    this.getView().getModel("serviceModel").refresh(true);
                },

                getServiceObject: function () {
                    let objService = {
                        ServiceType: "",
                        ServiceTypeText: "",
                        ServiceTypeKeyText: "",
                        ServiceTypeSuggestionItems: [],
                        Division: "",
                        ServiceCategory: "",
                        BaseUnitOfMeasure: "",
                        BaseUnitOfMeasureText: "",
                        BaseUnitOfMeasureKeyText: "",
                        BaseUnitOfMeasureSuggestionItems: [],
                        ServiceGroup: "",
                        ServiceGroupText: "",
                        ServiceGroupKeyText: "",
                        ServiceGroupSuggestionItems: [],
                        LongText: '',
                        ServiceDescriptions: [{
                            ActivityNumber: "",
                            Description: ""
                        }],
                        UPC: "",
                        EANCategory: "",
                        EANCategoryText: "",
                        EANCategoryKeyText: "",
                        EANCategorySuggestionItems: [],
                        ShortTextAllowed: false,
                        ValuationClass: "",
                        TaxIndicator: "",
                        Formula: "",
                        Graphic: "",
                        SSC: "",
                        HierarchyServiceNumber: "",
                        Wagetype: "",
                        PurchasingStatus: "",
                        ValidityDate: "",
                        Numberator: "",
                        Denominator: "",
                        SubContractorGroup: "",
                        CoastingModel: "",
                        UnitOfWork: "",
                        TaxTraiffCode: "",
                        Edition: ""


                    };

                    return objService;
                },
                createServiceRequestModel: function (oView, logonLanguage) {
                    let objService = this.getServiceObject(logonLanguage);
                    let oModel = new JSONModel(objService);
                    oView.setModel(oModel, "ServiceRequestModel");
                },
                createServiceMessageModel: function (oView) {
                    let oModel = new JSONModel({
                        messagesLength: 0,
                        messages: []
                    });
                    oView.setModel(oModel, "ServiceMessageModel");
                },
                onSelectionChange: function (oEvent) {
                    let blEnabled = false;
                    let oSelectedItem = this.byId("srvTable").getSelectedItem();

                    if (oSelectedItem) {
                        blEnabled = true;
                    }


                    this.byId("btndele").setEnabled(blEnabled);
                    this.byId("btnedit").setEnabled(blEnabled);

                },
                deleteObj: function () {
                    var oSelectedItem = this.byId("srvTable").getSelectedItem();

                    if (oSelectedItem) {
                        var oMatModel = this.getView().getModel("serviceModel");
                        var oMatModelData = oMatModel.getData();
                        var oTable = this.byId("srvTable");
                        var that = this;
                        MessageBox.show(
                            this._oBundle.getText("del_confirm"), {
                            icon: MessageBox.Icon.INFORMATION,
                            title: this._oBundle.getText("del_confirm_title"),
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            emphasizedAction: MessageBox.Action.YES,
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    let sPath = oSelectedItem.getBindingContext("serviceModel").getPath();
                                    let deleteIndex = sPath.replace("/ServiceCollection/", "");
                                    oMatModel.getProperty("/ServiceCollection").splice(deleteIndex, 1);
                                    oMatModel.refresh(true);
                                    oTable.removeSelections(true);
                                    that.byId("btndele").setEnabled(false);
                                    that.byId("btnedit").setEnabled(false);
                                }
                            }
                        });
                    }
                    else {
                        MessageBox.information("Please select the record !")
                    }
                },
                onAddNew: function (oEvent) {
                    this._mode = "A"; // Add
                    this.createServiceRequestModel(this.getView(), this.logonLanguage);
                    this.displayDialog("Add");
                },
                editObj: function (oEvent) {
                    this._mode = "E"; // Add
                    this.displayDialog("Edit");
                },
                displayDialog: function (viewType) {
                    this.getOwnerComponent().busyDialog.open();

                    let dialogTitle = viewType + " Service Details";

                    // Checks Service item selected for view type - View, Edit
                    var oSelectedItem = this.byId("srvTable").getSelectedItem();
                    if (viewType === "View" || viewType === "Edit") {
                        if (oSelectedItem) {
                            var oBindingContext = oSelectedItem.getBindingContext("serviceModel");
                            this._editServicePath = oBindingContext.getPath();

                            let objService = JSON.parse(JSON.stringify(oBindingContext.getObject()));
                            this.getView().getModel("ServiceRequestModel").setData(objService);
                            this.getView().getModel("ServiceRequestModel").refresh(true);


                        } else {
                            MessageBox.information("Please select the record !")
                            this.getOwnerComponent().busyDialog.close();
                            return;
                        }
                    }

                    if (!this._ServiceObject) {
                        this._ServiceObject = this.loadFragment({
                            name: "com.mdg.deloitte.servicemaster.fragments.Data"
                        });
                    }

                    // Displays Service dialog
                    this._ServiceObject.then((oDialog) => {
                        this.getView().addDependent(oDialog);
                        // this.clearServiceUIValueState();
                        this.createServiceMessageModel(this.getView());
                        this.updateServiceUIFields(viewType);
                        oDialog.setTitle(dialogTitle);
                        oDialog.open();
                        this.getOwnerComponent().busyDialog.close();
                    });

                },
                updateServiceUIFields: function (viewType) {
                    let requestType = this.getView().getModel("serviceModel").getProperty("/RequestType");
                    let blEditable = false;
                    let blVisible = false;

                    if (viewType === "Add" || viewType === "Edit") {
                        blEditable = true;
                        blVisible = true;
                    }
                    // this.byId("srvDescripitonLanguage").setEditable(blEditable);
                    this.byId("srvdesc").setEditable(blEditable);
                    this.byId("idLongDesc").setEditable(blEditable);
                    this.byId("uom").setEditable(blEditable);
                    this.byId("idshort").setEditable(blEditable);
                    this.byId("srvgrp").setEditable(blEditable);
                    this.byId("inptformula").setEditable(blEditable);
                    this.byId("inptGraphic").setEditable(blEditable);
                    this.byId("inptauth").setEditable(blEditable);
                    this.byId("inpttaxind").setEditable(blEditable);
                    this.byId("srvtype").setEditable(blEditable);
                    this.byId("srvcat").setEditable(blEditable);
                    this.byId("ssc").setEditable(blEditable);
                    this.byId("inptEdition").setEditable(blEditable);
                    this.byId("inptHierarchyServiceNumber").setEditable(blEditable);
                    this.byId("inptpurstatus").setEditable(blEditable);
                    this.byId("inptdate").setEditable(blEditable);
                    this.byId("inptUPC").setEditable(blEditable);
                    this.byId("inptEANCategory").setEditable(blEditable);
                    this.byId("In1").setEditable(blEditable);
                    this.byId("In3").setEditable(blEditable);
                    this.byId("In4").setEditable(blEditable);
                    this.byId("inptsub").setEditable(blEditable);
                    this.byId("inptcost").setEditable(blEditable);
                    this.byId("In4").setEditable(blEditable);


                },
                cancelService: function () {
                    this._ServiceObject.then((oDialog) => {
                        if (this.attribFieldIDs) {
                            this.attribFieldIDs.forEach(id => {
                                this.byId(id).destroy()
                            });
                            this.attribFieldIDs = [];
                        }
                        oDialog.close()
                    });
                },
                validateInputSuggestionField: function (oData, section, ctrl, propValue) {
                    let oEntry = {},
                        fieldKey = ctrl?.data("i18nFieldKey"),
                        required = ctrl?.getRequired();

                    if (ctrl)
                        if (ctrl.getValue() === "" && propValue === "" && required === true) {
                            oEntry.type = "Error";
                            oEntry.title = this._oBundle.getText("field_mandt", [this._oBundle.getText(fieldKey)]);
                            oEntry.description = this._oBundle.getText("field_mandt_desc", [this._oBundle.getText(fieldKey), this._oBundle.getText(section)]);

                            ctrl.setValueState("Error");
                            ctrl.setValueStateText(oEntry.title);

                            oData.messages.push(oEntry);
                        } else if (ctrl.getValue() !== "" && propValue === "") {
                            oEntry.type = "Error";
                            oEntry.title = this._oBundle.getText("field_invalid", [this._oBundle.getText(fieldKey)]);
                            oEntry.description = this._oBundle.getText("field_invalid_desc", [this._oBundle.getText(fieldKey), this._oBundle.getText(section)]);

                            ctrl.setValueState("Error");
                            ctrl.setValueStateText(oEntry.title);

                            oData.messages.push(oEntry);
                        } else {
                            ctrl.setValueState("None");
                            ctrl.setValueStateText();
                        }

                    return oData;
                },


                validateMaterialFrag: async function () {
                    let ctrl,
                        propValue = "",
                        serviceRequestModel = this.getView().getModel("ServiceRequestModel"),
                        oData = {
                            messagesLength: 0,
                            messages: []
                        };

                    // Material Type
                    ctrl = this.getView().byId("srvtype");
                    propValue = serviceRequestModel.getProperty("/ServiceType");
                    this.validateInputSuggestionField(oData, "Standard Service Category", ctrl, propValue);

                    // Base Unit of Measure
                    ctrl = this.getView().byId("uom");
                    propValue = serviceRequestModel.getProperty("/BaseUnitOfMeasure");
                    this.validateInputSuggestionField(oData, "General Data", ctrl, propValue);

                    //Division
                    ctrl = this.getView().byId("inptDivision");
                    propValue = serviceRequestModel.getProperty("/Division");
                    this.validateInputSuggestionField(oData, "Basic Data", ctrl, propValue);


                    // Material Group
                    ctrl = this.getView().byId("srvgrp");
                    propValue = serviceRequestModel.getProperty("/ServiceGroup");
                    this.validateInputSuggestionField(oData, "Basic Data", ctrl, propValue);

                    this.getView().getModel("ServiceMessageModel").setProperty("/", oData);

                    let mPopover = this.getView().byId("bMsgRecEditService").getDependents()[0];
                    let bMsgRecEditService = this.getView().byId("bMsgRecEditService");

                    if (oData.messages.length > 0) {
                        bMsgRecEditService.setType("Reject");
                        if (!mPopover.isOpen()) {
                            mPopover.openBy(bMsgRecEditService);
                        }
                        return false;
                    } else {
                        bMsgRecEditService.setType("Default");
                        return true;
                    }
                },
                submitsrv: async function () {
                    // this.getOwnerComponent().busyDialog.open();

                    let bValidate = await this.validateMaterialFrag();
                    console.log(bValidate);
                    if (bValidate) {
                        let oTable = this.byId("srvTable");
                        let oMatModel = this.getView().getModel("serviceModel");

                        let objService = Object.assign({}, this.getView().getModel("ServiceRequestModel").getData());


                        if (this._mode === "A") {
                            var oCollection = oMatModel.getProperty("/ServiceCollection");
                            var hIndex = 0;
                            if (oCollection.length > 0) {
                                hIndex = oCollection[oCollection.length - 1].ItemId;
                            }
                            objService.ItemId = (parseInt(hIndex) + 1);

                            oMatModel.getProperty("/ServiceCollection").push(objService);

                        } else if (this._mode === "E") {
                            var oExistingObj = oMatModel.getProperty(this._editServicePath);

                            if (oExistingObj) {
                                Object.assign(oExistingObj, objService);
                            }

                        }

                        oMatModel.refresh();

                        oTable.removeSelections(true);
                        this.byId("btndele").setEnabled(false);
                        this.byId("btnedit").setEnabled(false);

                        this._ServiceObject.then(function (oDialog) { oDialog.close() });
                        this.getOwnerComponent().busyDialog.close();
                    } else {
                        this.getOwnerComponent().busyDialog.close();
                    }
                },

                createWFModel: function () {
                    this.getView().setModel(new JSONModel({
                        initialContext: JSON.stringify({ someProperty: "some value" }, null, 4),
                        apiResponse: "",
                    }), "workflowModel");
                },
                onCommentPost: function (oEvent) {
                    var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                    var oComments = this.getView().getModel("commentModel");
                    var oDate = new Date();
                    var sDate = oFormat.format(oDate);
                    // create new entry
                    var sValue = oEvent.getParameter("value");
                    var aComments = oComments.getData();
                    var oEntry = {
                        UserName: this.getOwnerComponent().currentUser,
                        Date: "" + sDate,
                        Text: sValue,
                    };
                    aComments.unshift(oEntry);
                    oComments.setData(aComments);
                },
                getComments: function () {
                    let comments = this.getView().getModel("commentModel").getData();
                    if (comments.length <= 0) {
                        return MessageToast.show("Comments are mandatory!");
                    }

                    const currentUser = this.getOwnerComponent().currentUser || "defaultUser";
                    let finalComments = [];

                    comments.forEach(comment => {
                        finalComments.push({
                            "Comment": comment.Text,
                            "UserName": currentUser
                        });
                    });

                    return finalComments;
                },
                initiateApprovalProcess: async function () {
                    try {
                        if (!this._oBusyDialog) {
                            this._oBusyDialog = new sap.m.BusyDialog({ text: "Initiating approval process..." });
                        }
                        this._oBusyDialog.open();

                        // Ensure mandatory comments are provided
                        let commentModel = this.getView().getModel("commentModel");
                        let comments = commentModel.getData();
                        if (comments.length === 0) {
                            this._oBusyDialog.close();
                            MessageBox.information("Comments are mandatory!");
                            return;
                        }

                        // Post data to generate Request ID
                        this._oBusyDialog.setText("Posting data...");
                        let reqid = await this.postData();
                        if (!reqid) throw new Error("Failed to generate Request ID.");

                        // Initiate workflow instance with the generated Request ID
                        this._oBusyDialog.setText("Starting workflow...");
                        let workflowSuccess = await this.startWorkflowInstance(reqid);
                        if (!workflowSuccess) throw new Error("Failed to initiate workflow.");

                        // Update backend with the workflow instance ID
                        this._oBusyDialog.setText("Updating workflow header...");
                        let workflowData = this.getView().getModel("workflowModel").getData();
                        let workflowInstanceId = workflowData.apiResponse.id;
                        await this.updateWorkflowHeader(reqid, workflowInstanceId);

                        // Close BusyDialog and show success message
                        this._oBusyDialog.close();
                        this.showSuccessMessage(reqid);

                    } catch (error) {
                        // Handle errors gracefully
                        if (this._oBusyDialog) {
                            this._oBusyDialog.close();
                        }
                        MessageBox.error(error.message || "An error occurred during the process.");
                        console.error("Error:", error);
                    }
                },
                PayloadData: function () {
                    let serviceModel = this.getView().getModel("serviceModel");
                    let Comments = this.getComments();
                    let requestType = serviceModel.getProperty("/RequestType");
                    let serviceCollection = serviceModel.getProperty("/ServiceCollection");

                    var oData = {};
                    var arrObj = {};

                    oData.workflowStatus = "In Approval";
                    oData.type = requestType;
                    oData.serviceMasterItems = [];
                    // oData.CommentData = Comments;
                    oData.requestId = "NEWREQUEST";
                    for (let i = 0; i < serviceCollection?.length; i++) {
                        const convert = (dateStr) => {
                            if (dateStr == null) return "";
                            if (dateStr == undefined) return "";
                            if (dateStr && dateStr != null && JSON.stringify(dateStr) != "null") {
                                const [dd, mm, yyyy] = dateStr.split("-");
                                return `${mm}-${dd}-${yyyy}`;
                            }
                            return "";
                        };
                        arrObj = {};
                        arrObj.ServiceType = serviceCollection[i].ServiceType;
                        arrObj.ServiceCategory = serviceCollection[i].ServiceCategory;
                        arrObj.BaseUnitOfMeasure = serviceCollection[i].BaseUnitOfMeasure;
                        arrObj.ServiceGroup = serviceCollection[i].ServiceGroup;
                        arrObj.Division = serviceCollection[i].Division;
                        arrObj.LongText = serviceCollection[i].LongText;
                        arrObj.UPC = serviceCollection[i].UPC;
                        arrObj.EANCategory = serviceCollection[i].EANCategory;
                        arrObj.ShortTextAllowed = serviceCollection[i].ShortTextAllowed;
                        arrObj.ValuationClass = serviceCollection[i].ValuationClass;
                        arrObj.TaxIndicator = serviceCollection[i].TaxIndicator;
                        arrObj.Formula = serviceCollection[i].Formula;
                        arrObj.Graphic = serviceCollection[i].Graphic;
                        arrObj.SSC = serviceCollection[i].SSC;
                        arrObj.HierarchyServiceNumber = serviceCollection[i].HierarchyServiceNumber;
                        arrObj.Wagetype = serviceCollection[i].Wagetype;
                        arrObj.PurchasingStatus = serviceCollection[i].PurchasingStatus;
                        arrObj.ValidityDate = new Date(convert(serviceCollection[i].ValidityDate));
                        arrObj.Numberator = serviceCollection[i].Numberator;
                        arrObj.Denominator = serviceCollection[i].Denominator;
                        arrObj.SubContractorGroup = serviceCollection[i].SubContractorGroup;
                        arrObj.CoastingModel = serviceCollection[i].CoastingModel;
                        arrObj.UnitOfWork = serviceCollection[i].UnitOfWork;
                        arrObj.TaxTraiffCode = serviceCollection[i].TaxTraiffCode;
                        arrObj.Edition = serviceCollection[i].Edition;


                        arrObj.ServiceDescriptions = [];

                        for (let j = 0; j < serviceCollection[i]?.ServiceDescriptions?.length; j++) {
                            let arrservice_description = {
                                ActivityNumber: serviceCollection[i].ServiceDescriptions[j].ActivityNumber,
                                Description: serviceCollection[i].ServiceDescriptions[j].Description
                                // toBeDeleted: serviceCollection[i].ServiceDescriptions[j].ToBeDeleted,
                                // isNew: serviceCollection[i].serviceDescriptions[j].IsNew
                            }
                            arrObj.ServiceDescriptions.push(arrservice_description);
                        }
                        oData.serviceMasterItems.push(arrObj);

                    }

                    // if (requestType === "Change") {
                    //     this.identifyChanges(that.changeservices, oData, this.ServiceModelData);
                    // } 
                    console.log(oData);
                    return oData;
                },
                postData: function () {
                    let that = this;
                    return new Promise((resolve, reject) => {
                        let payload = that.PayloadData();
                        let model = that.getView().getModel("mainServiceModel");
                        model.create("/ServiceMasterRequests", payload, {
                            success: function (data) {
                                resolve(data.requestId);
                            },
                            error: function (response) {
                                reject(response);
                            }
                        });
                    });
                },

                startWorkflowInstance: function (reqid) {
                    return new Promise((resolve, reject) => {
                        let definitionId = "servicemasterapproval.workflowservicemaster";
                        let commentModel = this.getView().getModel("commentModel");
                        let comments = commentModel.getData();
                        let initialContext = { reqId: reqid, Type: "Create", Comment: comments };
                        let url = this.getBaseURL() + "/workflow-instances";

                        $.ajax({
                            url: url,
                            method: "POST",
                            contentType: "application/json",
                            headers: { "X-CSRF-Token": this.tokenRefresh() },
                            data: JSON.stringify({ definitionId, context: initialContext }),
                            success: function (result) {
                                let workflowModel = this.getView().getModel("workflowModel");
                                workflowModel.setData({ apiResponse: result });
                                resolve(true);
                            }.bind(this),
                            error: function (error) {
                                reject(error);
                            }
                        });
                    });
                },

                updateWorkflowHeader: function (reqid, workflowInstanceId) {
                    return new Promise((resolve, reject) => {
                        let payload = {};
                        payload.workflowInstanceId = workflowInstanceId;

                        let model = this.getView().getModel("mainServiceModel");

                        model.update(`/ServiceMasterRequests('${reqid}')`, payload, {
                            success: function () {
                                resolve();
                            },
                            error: function (error) {
                                reject(error);
                            }
                        });
                    });
                },

                getBaseURL: function () {
                    let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    let appPath = appId.replaceAll(".", "/");
                    return jQuery.sap.getModulePath(appPath) + "/bpmworkflowruntime/v1";
                },

                tokenRefresh: function () {
                    let token;
                    let url = this.getBaseURL() + "/xsrf-token";

                    $.ajax({
                        url: url,
                        method: "GET",
                        async: false,
                        headers: { "X-CSRF-Token": "Fetch" },
                        success: function (_, __, xhr) {
                            token = xhr.getResponseHeader("X-CSRF-Token");
                        },
                        error: function () {
                            console.error("Failed to fetch CSRF token.");
                        }
                    });
                    return token;
                },
                showSuccessMessage: function (reqid) {
                    var that = this;
                    MessageBox.success("Workflow initiated successfully for Request ID: " + reqid, {
                        onClose: function () {
                            var oView = that.getView();
                            var oFeedInput = oView.byId("fIC");
                            if (oFeedInput) {
                                oFeedInput.setValue("");
                            }
                            var oCommentList = oView.byId("flist");
                            if (oCommentList) {
                                var oCommentModel = oCommentList.getModel("commentModel");
                                if (oCommentModel) {
                                    oCommentModel.setData([]);
                                    oCommentModel.updateBindings(true);
                                }
                            }
                            var osrvTable = oView.byId("srvTable");
                            if (osrvTable) {
                                var osrvModel = osrvTable.getModel("serviceModel");
                                if (osrvModel) {
                                    osrvModel.setData({ ServiceCollection: [] });
                                    osrvModel.updateBindings(true);
                                }
                            }
                            var oRouter = that.getOwnerComponent().getRouter();
                            oRouter.navTo("RouteOverview");
                        }
                    });
                },
                getF4Data: function (model, entityset, oFilters) {
                    return new Promise((resolve, reject) => {
                        model.read(entityset, {
                            filters: oFilters,
                            success: data => resolve(data),
                            error: err => reject(err)
                        });
                    });
                },

                openF4Dialog: function (F4Title, formattedData, inputId) {
                    this.inputId = inputId;
                    if (!this.F4Dialog) {
                        // Only load the fragment once
                        Fragment.load({
                            id: this.getView().getId(),
                            name: "com.mdg.deloitte.servicemaster.fragments.F4Dialog"
                        }).then(oDialog => {
                            this.F4Dialog = oDialog;
                            let view = this.getView();
                            view.addDependent(oDialog);
                            const oModel = new sap.ui.model.json.JSONModel(formattedData);
                            view.setModel(oModel, "F4Model");

                            oDialog.setTitle(F4Title);

                            // Attach event handlers
                            oDialog.attachSearch(this._handleValueHelpSearch, this);
                            oDialog.attachLiveChange(this._handleValueHelpSearch, this);
                            oDialog.attachConfirm(this._handleValueHelpClose, this);
                            oDialog.attachCancel(this._handleValueHelpClose, this);

                            oDialog.open();
                        }).catch(err => {
                            MessageBox.error("Failed to load F4 dialog: " + err.message);
                        });
                    } else {
                        // Reuse the existing dialog
                        const oModel = new sap.ui.model.json.JSONModel(formattedData);
                        this.getView().setModel(oModel, "F4Model");
                        this.F4Dialog.setTitle(F4Title);

                        // Attach event handlers again in case the dialog was reused
                        this.F4Dialog.attachSearch(this._handleValueHelpSearch, this);
                        this.F4Dialog.attachLiveChange(this._handleValueHelpSearch, this);
                        this.F4Dialog.attachConfirm(this._handleValueHelpClose, this);
                        this.F4Dialog.attachCancel(this._handleValueHelpClose, this);

                        this.F4Dialog.open();
                    }

                },
                _handleValueHelpSearch: function (oEvent) {
                    var sValue = oEvent.getParameter("value");
                    var oFilter = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sValue),
                            new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sValue)
                        ],
                        and: false
                    });

                    // Apply the filter to the model
                    var oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter(oFilter);
                },
                _handleValueHelpClose: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");
                    if (!oSelectedItem) {
                        return;
                    }

                    let inputField = this.getView().byId(this.inputId);
                    if (inputField) {
                        inputField.setValue(oSelectedItem.getTitle());
                    }


                },
                onValueHelpRequestUOM: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_BASEUOM",
                        filters = [new sap.ui.model.Filter("language", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.weightUnit,
                                "description": item.weightUnitText
                            });
                        });
                        this.openF4Dialog("Unit Of Measure", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Unit Of Measure: " + err.message);
                    });
                },
                onValueHelpRequestMatGrp: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/I_MaterialGroup"
                    this.getF4Data(model, entityset).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.MaterialGroup,
                                "description": item.MaterialGroup_Text
                            });
                        });
                        this.openF4Dialog("Material Group", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Material Group: " + err.message);
                    });
                },
                onValueHelpRequestDivision: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_DIVISION",
                        filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.DIVISION,
                                "description": item.NAME
                            });
                        });
                        this.openF4Dialog("Division", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Division: " + err.message);
                    });
                },
                onValueHelpRequestValClass: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/I_Prodvaluationclasstxt",
                        filters = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.ValuationClass,
                                "description": item.ValuationClassDescription
                            });
                        });
                        this.openF4Dialog("Valuation Class", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Valuation Class: " + err.message);
                    });
                },
                onValueHelpRequestFormula: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_FORMULANO",
                        filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.FormulaNumber,
                                "description": item.DESCRIPTION
                            });
                        });
                        this.openF4Dialog("Formula", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Formula: " + err.message);
                    });
                },
                onValueHelpRequestTaxTraiffCode: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/I_AE_CNSMPNTAXCTRLCODETXT",
                        filters = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.ConsumptionTaxCtrlCode,
                                "description": item.ConsumptionTaxCtrlCodeText1,
                                "info": item.CountryCode
                            });
                        });
                        this.openF4Dialog("Tax Traiff Code", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Tax Traiff Code: " + err.message);
                    });
                },
                onValueHelpRequestHierarchyServiceNumber: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_HIERSERVNO"
                    this.getF4Data(model, entityset).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.SERVNO,
                                "description": item.HIERARCHYSRVNO
                            });
                        });
                        this.openF4Dialog("Hierarchy Service Number", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Hierarchy Service Number: " + err.message);
                    });
                },
                onValueHelpRequestEANcat: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_EANCATEGORY",
                        filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.EAN,
                                "description": item.DESCRIPTION
                            });
                        });
                        this.openF4Dialog("Ean Category", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Ean Category: " + err.message);
                    });
                },
                onValueHelpRequestCoastingModel: function (oEvent) {
                    let model = this.getOwnerComponent().getModel("masterServiceModel"),
                        entityset = "/ZI_COSTMODEL",
                        filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
                    this.getF4Data(model, entityset, filters).then(data => {
                        let formattedData = [];
                        data?.results.forEach(item => {
                            formattedData.push({
                                "title": item.COSTMODEL,
                                "description": item.DESCRIPTION,
                                "info": item.SEQNO
                            });
                        });
                        this.openF4Dialog("Costing Model", formattedData, oEvent.getSource().getId());
                    }).catch(err => {
                        MessageBox.error("Failed to load data for Costing Model: " + err.message);
                    });
                },
                onValueHelpRequestServiceCategory: function (oEvent) {
                    var model = this.getOwnerComponent().getModel("masterServiceModel");
                    var entityset = "/ZI_SERVCAT";
                    var filters = [
                        new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")
                    ];

                    return this.getF4Data(model, entityset, filters)
                        .then(function (data) {
                            var formattedData = [];

                            (data.results || []).forEach(function (item) {
                                formattedData.push({
                                    ServiceType: item.SERVICECATEGORY,
                                    ServiceTypeName: item.DESCRIPTION,
                                    title: item.SERVICECATEGORY,
                                    description: item.DESCRIPTION
                                });
                            });
                            if (oEvent) {
                                this.openF4Dialog(
                                    "Service Category",
                                    formattedData,
                                    oEvent.getSource().getId()
                                );
                            }

                            return formattedData;
                        }.bind(this))
                        .catch(function (err) {
                            MessageBox.error(
                                "Failed to load data for Service Type"
                            );
                            return [];
                        });
                },
                onCopySrv: async function () {
                    if (!this.CopyPopup) {
                        const oDialog = await Fragment.load({
                            id: this.getView().getId(),
                            name: "com.mdg.deloitte.servicemaster.fragments.srvRequest",
                            controller: this
                        });
                        this.getView().addDependent(oDialog);
                        this.CopyPopup = oDialog;
                    }
                    this.CopyPopup.open();
                },
                onServiceSearch: function (oEvent) {
                    var sValue = oEvent.getParameter("value");
                    var oSource = oEvent.getSource();
                    var oBinding = oSource.getBinding("items");

                    if (!oBinding) {
                        return;
                    }
                    if (!sValue) {
                        oBinding.filter([]);
                        return;
                    }

                    var aFilters = [];
                    aFilters.push(new sap.ui.model.Filter(
                        "PoServiceNumber",
                        sap.ui.model.FilterOperator.Contains,
                        sValue
                    ));
                    aFilters.push(new sap.ui.model.Filter(
                        "POServiceDesc",
                        sap.ui.model.FilterOperator.Contains,
                        sValue
                    ));
                    var oCombinedFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: false
                    });

                    oBinding.filter([oCombinedFilter]);
                },
                onServiceClose: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }
                    var sServiceNumber = oSelectedItem.getBindingContext("masterServiceModel").getProperty("PoServiceNumber");

                    sServiceNumber = sServiceNumber.replace(/\D/g, "").padStart(18, "0");


                    this.updateServiceRequestModel(sServiceNumber);
                },


                onServiceCancel: function () {
                    if (this.CopyPopup) {
                        this.CopyPopup.close();
                    }
                },
                updateServiceRequestModel: function (sServiceNumber) {
                    var oView = this.getView();
                    var that = this;

                    that.onOpenBusyDialog();

                    var oMasterModel = this.getOwnerComponent().getModel("masterServiceModel");

                    var aFilters = [
                        new sap.ui.model.Filter(
                            "SERVICENUMBER",
                            sap.ui.model.FilterOperator.EQ,
                            sServiceNumber
                        )
                    ];

                    oMasterModel.read("/ETY_GETDETAILSSet", {
                        filters: aFilters,
                        success: function (oData) {

                            if (!oData.results || oData.results.length === 0) {
                                that.onCloseBusyDialog();
                                return;
                            }

                            var serviceCollection =
                                that.getChangeExtendServiceRequestObject(oView, oData);

                            that.updateModel(oView, serviceCollection);

                            that.ServiceModelData = JSON.parse(
                                JSON.stringify(oView.getModel("serviceModel").getData())
                            );

                            that.onCloseBusyDialog();
                        },
                        error: function () {
                            that.onCloseBusyDialog();
                            MessageBox.error("Failed to fetch service details");
                        }
                    });
                },

                onOpenBusyDialog: function () {
                    if (!this._busyDialog) {
                        this._busyDialog = new sap.m.BusyDialog();
                        this.getView().addDependent(this._busyDialog);
                    }
                    this._busyDialog.open();
                },

                onCloseBusyDialog: function () {
                    if (this._busyDialog) {
                        this._busyDialog.close();
                    }
                },

                getChangeExtendServiceRequestObject: function (oView, oData) {
                    let requestType = oView.getModel("serviceModel").getProperty("/RequestType");
                    var productItems = oData.results || [];
                    var serviceCollection = [];

                    productItems.forEach(function (item) {
                        var objService = this.getServiceObject();
                        if (requestType !== "Change") {
                            objService.ServiceType = "";
                        } else {
                            objService.ServiceType = item.SRVTYPE;
                        }
                        objService.ServiceCategory = item.SERVICECATEGORY || "";
                        objService.Division = item.DIVISION || "";
                        objService.ServiceGroup = item.MATERIALGROUP || "";
                        objService.HierarchyServiceNumber = item.HIERARCHYSRV || "";

                        objService.BaseUnitOfMeasure = item.BASEUOM || "";
                        objService.UnitOfWork = item.WORKUOM || "";

                        objService.LongText = item.SHORTTEXT || "";
                        objService.ServiceDescriptions = [{
                            ActivityNumber: (item.SERVICENUMBER || "").replace(/^0+(?!$)/, ""),
                            Description: item.SHORTTEXT || ""
                        }];

                        objService.UPC = item.EANUPC || "";
                        objService.EANCategory = item.EANCAT || "";
                        objService.ValuationClass = item.VALUATIONCLASS || "";
                        objService.TaxIndicator = item.TAXIND || "";
                        objService.TaxTraiffCode = item.TAXTARIFFCODE || "";

                        objService.Formula = item.FORMULA || "";
                        objService.Numberator = item.CONVNUM || "";
                        objService.Denominator = item.CONVDEN || "";

                        objService.Wagetype = item.WAGETYPE || "";
                        objService.PurchasingStatus = item.PURCHSTATUS || "";
                        objService.ValidityDate = item.VALIDFROM || "";
                        objService.Edition = item.EDITION || "";

                        objService.SSC = item.SSCITEM || "";
                        objService.SubContractorGroup = item.AUTHGROUP || "";

                        serviceCollection.push(objService);
                    }.bind(this));

                    return serviceCollection;
                },

                updateModel: function (oView, serviceCollection) {
                    var oServiceModel = oView.getModel("serviceModel");

                    var existingCollection =
                        oServiceModel.getProperty("/ServiceCollection") || [];

                    oServiceModel.setProperty(
                        "/ServiceCollection",
                        existingCollection.concat(serviceCollection)
                    );

                    oServiceModel.refresh(true);
                },
                exportTemplate: function () {
                    var sUrl = sap.ui.require.toUrl(
                        "com/mdg/deloitte/servicemaster/template/ServiceMasterTemplate.xlsx"
                    );

                    window.open(sUrl, "_blank");
                },
                uploadFile: function () {
                    var that = this;
                    var sText = this._oBundle.getText("unsaved_data");

                    MessageBox.warning(sText, {
                        title: that._oBundle.getText("confirm_title"),
                        emphasizedAction: that._oBundle.getText("confirm_yes"),
                        actions: [
                            that._oBundle.getText("confirm_yes"),
                            MessageBox.Action.CANCEL
                        ],
                        onClose: function (sAction) {
                            if (sAction !== that._oBundle.getText("confirm_yes")) {
                                return;
                            }

                            var oBusy = that.getOwnerComponent().busyDialog;
                            oBusy.open();

                            var oUploader = that.getView().byId("fileUploader");
                            var oFileInput = document.getElementById(oUploader.getId() + "-fu");
                            var file = oFileInput && oFileInput.files && oFileInput.files[0];

                            if (!file) {
                                MessageBox.error("Please select a file first.");
                                return;
                            }

                            var oReader = new FileReader();

                            oReader.onload = function (oEvent) {
                                try {
                                    var data = oEvent.target.result;
                                    var workbook = XLSX.read(data, { type: "binary" });
                                    var bValidName = /^ServiceMasterTemplate(?:\s*\(\d+\))?\.xlsx$/i.test(file.name);
                                    if (!bValidName) {
                                        throw new Error("Invalid file name");
                                    }

                                    that.handleUpload(workbook, file.name);

                                } catch (e) {
                                    MessageBox.error(that._oBundle.getText("file_parse_error"));
                                } finally {
                                    oBusy.close();
                                }
                            };

                            oReader.onerror = function () {
                                oBusy.close();
                                MessageBox.error(that._oBundle.getText("file_read_error"));
                            };

                            oReader.readAsBinaryString(file);
                        }
                    });
                },
                handleUpload: async function (workbook) {
                    var oComponent = this.getOwnerComponent();
                    var oView = this.getView();

                    try {
                        var oServiceModel = oView.getModel("serviceModel");
                        oServiceModel.setSizeLimit(1000);

                        oComponent.busyDialog.open();

                        var excelRows = { basicDataRows: [] };

                        if (!workbook.SheetNames.includes("Basic Data")) {
                            MessageBox.error("Sheet 'Basic Data' is missing in the uploaded file.");
                            return;
                        }

                        var sheetData = XLSX.utils.sheet_to_row_object_array(
                            workbook.Sheets["Basic Data"]
                        );

                        if (!sheetData || sheetData.length === 0) {
                            MessageBox.error("The uploaded file is empty.");
                            return;
                        }

                        excelRows.basicDataRows = sheetData;

                        var excelData = this.readDataFromExcel(excelRows, oView);

                        var serviceRequest = oServiceModel.getData();
                        serviceRequest = this.getBulkUploadServiceRequestObject(
                            excelData,
                            serviceRequest
                        );

                        oServiceModel.setData(serviceRequest);

                       // this.updateModel(oView, serviceRequest, true, oComponent);

                    } catch (e) {
                        MessageBox.error(e?.message || "Error while processing uploaded file.");
                    } finally {
                        oComponent.busyDialog.close();
                    }
                },

                readDataFromExcel: function (excelRows) {
                    sap.ui.core.BusyIndicator.show(0);

                    try {
                        const getRowItemValue = function (rowItems, key) {
                            return rowItems?.[key]?.toString().trim() || "";
                        };

                        let serviceItems = [];
                        let basicDataRows = excelRows.basicDataRows || [];

                        basicDataRows.forEach((rowItems, index) => {
                            let recordNo =
                                getRowItemValue(rowItems, "Record No*") ||
                                (index + 1).toString();

                            let objService = this.getServiceObject();

                            objService.RecordNo = recordNo;

                            objService.ServiceDescriptions = [{
                                ActivityNumber: recordNo,
                                Description: getRowItemValue(rowItems, "Short Description*").toUpperCase()
                            }];

                            objService.LongText = getRowItemValue(rowItems, "Long Description*");
                            objService.ServiceCategory = getRowItemValue(rowItems, "Service Category*");
                            objService.BaseUnitOfMeasure = getRowItemValue(rowItems, "Unit Of Measure*").toUpperCase();
                            objService.ServiceGroup = getRowItemValue(rowItems, "Service Group*").toUpperCase();
                            objService.Division = getRowItemValue(rowItems, "Division").toUpperCase();
                            objService.ValuationClass = getRowItemValue(rowItems, "Valuation Class*");
                            objService.Formula = getRowItemValue(rowItems, "Formula");
                            objService.Graphic = getRowItemValue(rowItems, "Graphic");
                            objService.TaxTraiffCode = getRowItemValue(rowItems, "Tax Traiff Code");
                            objService.AuthorizationGroup = getRowItemValue(rowItems, "Authorization Group");
                            objService.TaxIndicator = getRowItemValue(rowItems, "Tax Indicator");
                            objService.ServiceType = getRowItemValue(rowItems, "Service Type*");
                            objService.SSC = getRowItemValue(rowItems, "SSC");
                            objService.Edition = getRowItemValue(rowItems, "Edition");
                            objService.HierarchyServiceNumber = getRowItemValue(rowItems, "Hierarchy Service Number");
                            objService.Wagetype = getRowItemValue(rowItems, "Wage type");
                            objService.PurchasingStatus = getRowItemValue(rowItems, "Purchasing Status");

                            serviceItems.push(objService);
                        });

                        return { serviceItems };

                    } finally {
                        sap.ui.core.BusyIndicator.hide();
                    }
                },

                getBulkUploadServiceRequestObject: function (excelData, serviceRequest) {

                    let serviceCollection = [];

                    (excelData.serviceItems || []).forEach((serviceData) => {

                        let objService = this.getServiceObject();

                        objService.ServiceType = serviceData.ServiceType;
                        objService.ServiceCategory = serviceData.ServiceCategory;
                        objService.Division = serviceData.Division;
                        objService.BaseUnitOfMeasure = serviceData.BaseUnitOfMeasure;
                        objService.ServiceGroup = serviceData.ServiceGroup;
                        objService.ValuationClass = serviceData.ValuationClass;
                        objService.Formula = serviceData.Formula;
                        objService.Graphic = serviceData.Graphic;
                        objService.TaxTraiffCode = serviceData.TaxTraiffCode;
                        objService.TaxIndicator = serviceData.TaxIndicator;
                        objService.SSC = serviceData.SSC;
                        objService.Edition = serviceData.Edition;
                        objService.HierarchyServiceNumber = serviceData.HierarchyServiceNumber;
                        objService.Wagetype = serviceData.Wagetype;
                        objService.PurchasingStatus = serviceData.PurchasingStatus;
                        objService.LongText = serviceData.LongText;

                        objService.ServiceDescriptions = [{
                            ActivityNumber: serviceData.RecordNo,
                            Description: serviceData.ServiceDescriptions?.[0]?.Description || ""
                        }];

                        serviceCollection.push(objService);
                    });

                    serviceRequest.ServiceCollection = serviceCollection;
                    return serviceRequest;
                },

            }
        );
    }
);