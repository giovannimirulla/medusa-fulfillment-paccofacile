export type Pagination = {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    first_item: number;
    last_item: number;
    last_page: number;
    on_first_page: boolean;
};

// Address-related types
export type Address = {
    iso_code: string;
    postal_code: string;
    city: string;
    StateOrProvinceCode: string;
};

export type DetailedAddress = Address & {
    header_name: string;
    address: string;
    building_number: string;
    phone: string;
    email: string;
    note: string;
    km_number?: string; // Optional for triangulation
};

export type Locality = Address & {
    address: string;
    country_name: string;
    capID: number;
    building_number: string;
    km_number?: string | null;
    intercom_name: string;
};

// Address book types
export type AddressBookItem = {
    address: {
        id: number;
        customer_id: number;
        name: string;
        alias: string;
        phone: string;
        email: string;
        category: string;
        locality: Locality;
        reference: string;
    };
};

// Shipment-related types
export type AccessoryAssuranceAmount = {
    amount: number;
    currency: string;
};

export type Parcel = {
    shipment_type: number;
    dim1: number;
    dim2: number;
    dim3: number;
    weight: number;
    accessory_assurance_amount?: AccessoryAssuranceAmount;
};

export type Accessory = {
    service_id: number;
    amount_total: {
        amount: number;
        currency: string;
    };
};

export type ShipmentService = {
    parcels: Parcel[];
    accessories: Accessory[];
    package_content_type: string;
    pickup_date?: string;
    pickup_range?: string;
    service_id?: number;
};

export type AdditionalInformation = {
    reference: string;
    note: string;
    content: string;
};

export type QuoteRequest = {
    shipment_service: ShipmentService;
    pickup: Address;
    triangulation: Address;
    destination: Address;
};

export type ShippingRequest = QuoteRequest & {
    additional_information: AdditionalInformation;
};

// Carrier-related types
export type Carrier = {
    service_id: number;
    carrier_id: number;
    dove: number;
    carrier_name: string;
    service_name: string;
    carrier_ship_time: string;
    pickup_type: number;
    to_consolid: number;
    image_url: string;
    box_type: string;
};

export type Product = {
    length: number; // Lunghezza in cm
    width: number;  // Larghezza in cm
    height: number; // Altezza in cm
    weight: number; // Peso in kg
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