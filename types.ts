export interface Manufacturer {
  M_ID: number;
  M_Name: string;
  Country: string;
}

export interface Vehicle {
  V_ID: number;
  VIN: string;
  Reg_NO: string;
  REG_NO?: string;
  Price: number;
  PRICE?: number;
  Vehicle_type: string;
  VEHICLE_TYPE?: string;
  FUEL_TYPE?: string;
  Fuel_Type?: string;
  Year_of_Manufacture: number;
  YEAR_OF_MANUFACTURE?: number;
  Model: string;
  MODEL?: string;
  M_ID: number;
}

export interface Customer {
  C_ID: number;
  C_Name: string;
  C_NAME?: string;
  City: string;
  CITY?: string;
  State: string;
  STATE?: string;
  PIN: string;
  email?: string;
  password?: string;
}

export interface SalesRecord {
  S_ID: number;
  V_ID: number;
  SP_Name: string;
  S_Date: string;
  S_Price: number;
  Units_Sold: number;
  Units_Remain: number;
  M_Name: string;
}

export interface ServiceCentre {
  SC_ID: number;
  Reg_NO: string;
  REG_NO?: string;
  Mech_ID: number;
  MECH_ID?: number;
  Mech_Name: string;
  MECH_NAME?: string;
}

export interface ServiceRecord {
  V_ID: number;
  SC_ID: number;
  Cost: number;
  COST?: number;
  Date_of_Serv: string;
  DATE_OF_SERV?: string;
  Description: string;
  DESCRIPTION?: string;
  Next_Date?: string;
}

export interface OwnedBy {
  V_ID: number;
  C_ID: number;
}

export interface SocialMedia {
  M_ID: number;
  "Social Media"?: string;
  SOCIAL_MEDIA?: string;
}

export interface VehicleColor {
  V_ID: number;
  Color: string;
  COLOR?: string;
}

export interface SalesIdRecord {
  V_ID: number;
  S_ID: number;
}

export interface ServicePhone {
  SC_ID: number;
  "SC Phone": string;
  SC_PHONE?: string;
  "SC Locate": string;
  SC_LOCATE?: string;
}

export interface CustomerPhone {
  C_ID: number;
  "Ph No": string;
  PH_NO?: string;
  Ph_No?: string;
}

export interface SalesPhone {
  S_ID: number;
  "SP Phone": string;
  SP_PHONE?: string;
  Sp_Phone?: string;
}

// Structured catalog section specs for selected company (from user instructions)
export interface CatalogSpecification {
  engine: string;
  transmission: string;
  dimensions: string;
  fuelType: string;
}

export interface CatalogMetadata {
  resolution: string;
  fileType: string;
  dateAccessed: string;
  sourceType: string;
}

export interface DetailView {
  title: string;
  imageUrl: string;
  description: string;
}

export interface VehicleCatalogEntry {
  id: string;
  name: string; // Make + Model + Year
  modelName: string;
  category: string; // SUV, Sedan, Coupe, etc.
  imageUrl: string;
  specifications: CatalogSpecification;
  keyFeatures: {
    design: string[];
    safety: string[];
    technology: string[];
  };
  visibleBadges: string[];
  sourceOrigin: string; // manufacturer, archive, or database
  metadata: CatalogMetadata;
  priceRange: string;
  interiorExteriorDetails: DetailView[];
}

export interface CompanyCatalog {
  companyName: string;
  description: string;
  originCountry: string;
  bannerUrl: string;
  vehicles: VehicleCatalogEntry[];
}
