import type {
  PropertyAddress,
  PropertyAmenities,
  PropertyHost,
  PropertyOperational,
  PropertyRules,
} from "../lib/types/property";

export interface SeedProperty {
  code: string;
  name: string;
  propertyType: string;
  bedroomQuantity: number;
  bathroomQuantity: number;
  guestCapacity: number;
  address: PropertyAddress;
  operational: PropertyOperational;
  rules: PropertyRules;
  amenities: PropertyAmenities;
  images: string[];
  host: PropertyHost;
}

// All four properties are fictional. Locations stop at neighborhood level and
// phone numbers are placeholders. The mix of rules and amenities is deliberate,
// so the chat is tested against different answers (pets, parking, pool, events).
export const properties: SeedProperty[] = [
  {
    code: "MAO001",
    name: "Apartamento Largo de São Sebastião",
    propertyType: "Apartamento",
    bedroomQuantity: 1,
    bathroomQuantity: 1,
    guestCapacity: 3,
    address: { neighborhood: "Centro Histórico", city: "Manaus", state: "AM" },
    operational: {
      wifi_network: "Igapo_Centro",
      wifi_password: "largo1896",
      is_self_checkin: true,
      property_access_type: "smart_lock",
      property_access_instructions:
        "O apartamento fica no 4º andar. Use o código 2718 na fechadura eletrônica da porta.",
      property_password: "2718",
      has_parking_spot: false,
    },
    rules: {
      check_in_time: "14:00",
      check_out_time: "11:00",
      allow_pet: false,
      smoking_permitted: false,
      suitable_for_children: true,
      suitable_for_babies: true,
      events_permitted: false,
    },
    amenities: {
      wifi: true,
      tv: true,
      air_conditioning: true,
      kitchen: true,
      washing_machine: true,
      elevator: true,
      balcony: true,
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600",
    ],
    host: { name: "Lúcia", phone: "+5592900000001" },
  },
  {
    code: "ADC001",
    name: "Casa Beira-Lago",
    propertyType: "Casa",
    bedroomQuantity: 3,
    bathroomQuantity: 2,
    guestCapacity: 6,
    address: { neighborhood: "Centro", city: "Alter do Chão", state: "PA" },
    operational: {
      wifi_network: "Igapo_Alter",
      wifi_password: "praiadorio24",
      is_self_checkin: true,
      property_access_type: "keybox",
      property_access_instructions:
        "A chave fica no cofre ao lado do portão. Código do cofre: 5190.",
      property_password: "5190",
      has_parking_spot: true,
      parking_spot_instructions: "Vaga em frente à casa para 1 carro.",
    },
    rules: {
      check_in_time: "15:00",
      check_out_time: "11:00",
      allow_pet: true,
      smoking_permitted: false,
      suitable_for_children: true,
      suitable_for_babies: true,
      events_permitted: true,
    },
    amenities: {
      wifi: true,
      air_conditioning: true,
      kitchen: true,
      washing_machine: true,
      bbq_grill: true,
      balcony: true,
    },
    images: [
      "https://images.unsplash.com/photo-1556751003-a249a53dc9b7?w=1600",
    ],
    host: { name: "Rui", phone: "+5593900000002" },
  },
  {
    code: "PFG001",
    name: "Chalé das Cachoeiras",
    propertyType: "Chalé",
    bedroomQuantity: 2,
    bathroomQuantity: 1,
    guestCapacity: 4,
    address: { neighborhood: "Centro", city: "Presidente Figueiredo", state: "AM" },
    operational: {
      wifi_network: "Igapo_Chale",
      wifi_password: "cachoeira#7",
      is_self_checkin: false,
      property_access_type: "in_person",
      property_access_instructions:
        "O anfitrião entrega as chaves no chalé. Avise o horário de chegada com 1 hora de antecedência.",
      property_password: "",
      has_parking_spot: true,
      parking_spot_instructions: "Estacionamento gramado dentro do terreno, sem vaga marcada.",
    },
    rules: {
      check_in_time: "14:00",
      check_out_time: "12:00",
      allow_pet: true,
      smoking_permitted: false,
      suitable_for_children: true,
      suitable_for_babies: false,
      events_permitted: false,
    },
    amenities: {
      wifi: true,
      kitchen: true,
      bbq_grill: true,
      balcony: true,
    },
    images: [
      "https://images.unsplash.com/photo-1780686222657-1ba6a42ee4d8?w=1600",
    ],
    host: { name: "Tiago", phone: "+5592900000003" },
  },
  {
    code: "NAI001",
    name: "Pousada Orla do Rio Negro",
    propertyType: "Pousada",
    bedroomQuantity: 4,
    bathroomQuantity: 4,
    guestCapacity: 8,
    address: { neighborhood: "Orla", city: "Novo Airão", state: "AM" },
    operational: {
      wifi_network: "Igapo_Pousada",
      wifi_password: "anavilhanas22",
      is_self_checkin: false,
      property_access_type: "host_greeting",
      property_access_instructions:
        "A anfitriã recebe os hóspedes na entrada da pousada entre 13h e 20h.",
      property_password: "",
      has_parking_spot: true,
      parking_spot_identifier: "Pátio da pousada",
      parking_spot_instructions: "Vagas por ordem de chegada.",
    },
    rules: {
      check_in_time: "13:00",
      check_out_time: "11:00",
      allow_pet: false,
      smoking_permitted: false,
      suitable_for_children: true,
      suitable_for_babies: true,
      events_permitted: false,
    },
    amenities: {
      wifi: true,
      tv: true,
      air_conditioning: true,
      pool: true,
      balcony: true,
    },
    images: [
      "https://images.unsplash.com/photo-1761950116791-8bfc445e5186?w=1600",
    ],
    host: { name: "Marta", phone: "+5592900000004" },
  },
];
