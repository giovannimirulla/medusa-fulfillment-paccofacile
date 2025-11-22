export type Address = {
    iso_code: string;
    postal_code: string;
    city: string;
    StateOrProvinceCode: string;
};

export type Parcel = {
    shipment_type: number;
    dim1: number;
    dim2: number;
    dim3: number;
    weight: number;
};

export type Account = {
    customer_id: number;
    first_name: string;
    last_name: string;
    contact: {
        email: string;
        telephone: string;
    },
    account: {
        service: string;
        company: string;
    }
}

export type Credit = {
    cashback:{
        total: number;
    },
    credit: {
        value: string;
        currency: string;
    }
}
