import type { FilterId } from "@/shared/filters";

export type City = {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [lon, lat]
  story: string;
  filterId: FilterId;
};

export const cities: City[] = [
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    coordinates: [-0.1276, 51.5072],
    story: "I always walk home with my keys between my fingers just to feel a little safer.",
    filterId: "safety-care",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    country: "India",
    coordinates: [77.5946, 12.9716],
    story:
      "The auto driver waits until my gate closes before he leaves. We have never spoken about it.",
    filterId: "walking-us",
  },
  {
    id: "new-york",
    name: "New York",
    country: "United States",
    coordinates: [-74.006, 40.7128],
    story: "I know exactly which subway car to take: the one with the conductor in it.",
    filterId: "after-dark",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    coordinates: [139.6917, 35.6895],
    story: "My mother still calls me at midnight, and I still pick up on the first ring.",
    filterId: "known-distance",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    country: "Brazil",
    coordinates: [-46.6333, -23.5505],
    story: "I share my live location with three friends. One of them always watches the dot move.",
    filterId: "safety-care",
  },
  {
    id: "lagos",
    name: "Lagos",
    country: "Nigeria",
    coordinates: [3.3792, 6.5244],
    story: "The market women know my face now. That is the whole security system on my street.",
    filterId: "walking-us",
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    coordinates: [13.405, 52.52],
    story: "There is one underpass I will walk ten extra minutes to avoid after eleven.",
    filterId: "after-dark",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    coordinates: [151.2093, -33.8688],
    story: "I take my headphones out at the last corner. That is my version of locking a door.",
    filterId: "safety-care",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    coordinates: [-99.1332, 19.4326],
    story: "My sister and I send a single emoji. It means I am inside, you can sleep.",
    filterId: "known-distance",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    coordinates: [31.2357, 30.0444],
    story: "The bakery light on the corner is the reason I choose that street at night.",
    filterId: "after-dark",
  },
  {
    id: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    coordinates: [18.4241, -33.9249],
    story: "We walk each other to the car. Nobody decided this, it just became the rule.",
    filterId: "walking-us",
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    coordinates: [126.978, 37.5665],
    story: "I pretend to be on a call for the last two hundred metres. It usually works.",
    filterId: "random-incident",
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    coordinates: [2.3522, 48.8566],
    story: "A stranger once walked twenty steps behind me until my building, then waved and left.",
    filterId: "random-incident",
  },
  {
    id: "toronto",
    name: "Toronto",
    country: "Canada",
    coordinates: [-79.3832, 43.6532],
    story: "Night bus, front seat, near the driver. Everyone I know does the same thing.",
    filterId: "after-dark",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    coordinates: [72.8777, 19.076],
    story: "The last local is crowded and that is exactly why it feels safe.",
    filterId: "safety-care",
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    coordinates: [-58.3816, -34.6037],
    story: "My phone goes in my sock on the way back from work. A habit, not a fear.",
    filterId: "random-incident",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Türkiye",
    coordinates: [28.9784, 41.0082],
    story: "The shopkeeper leaves his shutter half open till I pass. Twelve years now.",
    filterId: "walking-us",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    coordinates: [100.5018, 13.7563],
    story: "I photograph the number plate before I get in. Then I text it to my flatmate.",
    filterId: "safety-care",
  },
  {
    id: "nairobi",
    name: "Nairobi",
    country: "Kenya",
    coordinates: [36.8219, -1.2921],
    story: "We share a group chat just for reaching home. Nobody types more than one word.",
    filterId: "known-distance",
  },
  {
    id: "melbourne",
    name: "Melbourne",
    country: "Australia",
    coordinates: [144.9631, -37.8136],
    story: "The tram stop is lit. The four minutes after it are not. That is the whole story.",
    filterId: "after-dark",
  },
];
