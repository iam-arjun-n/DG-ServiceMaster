namespace com.sap.servicemaster;

using {
    cuid,
    managed
} from '@sap/cds/common';

@assert.range
type RequestStatus  : String enum {
    Draft;
    Submitted;
    ![service Master Created];
    Cancelled;
    Error;
    Rejected;
    Rework;
}

@assert.range
type WorkflowStatus : String enum {
    Draft;
    Rejected;
    Rework;
    Completed;
    Initiator;
    ![In Approval];
}

type Type           : String enum {
    Create;
    Change;
    Extend;
    Draft;
}

entity ServiceMasterRequests : managed {
    key requestId          : String(11);
        workflowStatus     : WorkflowStatus;
        requestIdSequence  : Integer;
        type               : Type;
        workflowInstanceId : String(50) null;
        CreatedOn          : Date;
        ApprovedOn         : Date;
        ApprovedBy         : String;
        serviceMasterItems : Composition of many ServiceMasterItems
                                 on serviceMasterItems.serviceMasterRequest = $self;
}

entity ServiceMasterItems : cuid {
    key serviceMasterRequest   : Association to ServiceMasterRequests;
        ServiceCategory        : String;
        ServiceType            : String;
        ServiceDescriptions    : Composition of many ServiceDescriptions
                                     on ServiceDescriptions.serviceMasterItems = $self;
        BaseUnitOfMeasure      : String;
        ServiceGroup           : String;
        Division               : String;
        TaxIndicator           : String;
        ShortTextAllowed       : Boolean;
        LongText               : String;
        ValuationClass         : String;
        Formula                : String;
        Graphic                : String;
        SSC                    : String;
        HierarchyServiceNumber : String;
        Wagetype               : String;
        UPC                    : String;
        EANCategory            : String;
        PurchasingStatus       : String;
        ValidityDate           : Date;
        Numberator             : String;
        Denominator            : String;
        SubContractorGroup     : String;
        CoastingModel          : String;
        UnitOfWork             : String;
        TaxTraiffCode          : String;
        Edition                : String;
}

entity ServiceDescriptions : cuid {
        ActivityNumber     : String;
        Description        : String;
        toBeDeleted        : Boolean;
        isNew              : Boolean;
    key serviceMasterItems : Association to ServiceMasterItems;
}