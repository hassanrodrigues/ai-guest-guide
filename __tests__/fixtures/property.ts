import type { ExperienceGuide } from "@/lib/ai/schemas";
import type { TypedProperty } from "@/lib/types/property";

/** MAO001 fixture (pets NOT allowed, no parking). */
export const maoProperty: TypedProperty = {
  code: "MAO001",
  name: "Apartamento Largo de São Sebastião",
  propertyType: "Apartamento",
  bedroomQuantity: 1,
  bathroomQuantity: 1,
  guestCapacity: 3,
  images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600"],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
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
  amenities: { wifi: true, tv: true, air_conditioning: true, kitchen: true },
  host: { name: "Lúcia", phone: "+5592900000001" },
};

/** ADC001 fixture (pets allowed): for cross-property assertions. */
export const adcProperty: TypedProperty = {
  ...maoProperty,
  code: "ADC001",
  name: "Casa Beira-Lago",
  propertyType: "Casa",
  address: { neighborhood: "Centro", city: "Alter do Chão", state: "PA" },
  rules: { ...maoProperty.rules, allow_pet: true },
  host: { name: "Rui", phone: "+5593900000002" },
};

/** A schema-valid generated guide for grounding tests. */
export const sampleGuide: ExperienceGuide = {
  welcomeMessage: "Bem-vindos ao Centro Histórico de Manaus, a poucos passos do Teatro Amazonas.",
  restaurants: [
    { name: "Restaurante Exemplo Um", cuisine: "Regional", distance: "Aprox. 0,3 km", priceRange: "$$", description: "Peixes da região." },
    { name: "Restaurante Exemplo Dois", cuisine: "Brasileira", distance: "Aprox. 0,8 km", priceRange: "$", description: "Almoço por quilo." },
    { name: "Restaurante Exemplo Três", cuisine: "Contemporânea", distance: "Aprox. 1,2 km", priceRange: "$$$", description: "Cozinha autoral." },
    { name: "Restaurante Exemplo Quatro", cuisine: "Lanches", distance: "Aprox. 0,5 km", priceRange: "$", description: "Tacacá e lanches." },
  ],
  attractions: [
    { name: "Teatro Amazonas", category: "cultural", distance: "Aprox. 0,2 km", description: "Teatro histórico de 1896." },
    { name: "Largo de São Sebastião", category: "cultural", distance: "Aprox. 0,1 km", description: "Praça em frente ao teatro." },
    { name: "Encontro das Águas", category: "natureza", distance: "Aprox. 10 km", description: "Passeio de barco." },
  ],
  essentials: [
    { name: "Farmácia Exemplo", type: "pharmacy", distance: "Aprox. 0,4 km", description: "Aberta até 22h." },
    { name: "Mercado Exemplo", type: "supermarket", distance: "Aprox. 0,7 km", description: "Mercado completo." },
  ],
  seasonalTip: "Novembro é fim da seca: leve protetor solar e água.",
};
