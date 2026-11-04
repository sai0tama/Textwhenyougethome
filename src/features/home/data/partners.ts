export type Partner = {
  id: string;
  name: string;
  logo: string;
  href?: string;
};

export const partners: Partner[] = [
  {
    id: "deccan-herald",
    name: "Deccan Herald",
    logo: "/assets/partners/deccan-herald.svg",
    href: "https://www.deccanherald.com",
  },
];
