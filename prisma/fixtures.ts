/**
 * Données de fixtures (villes françaises, événements cohérents).
 * Poussées en base via `npm run db:seed` (voir prisma/seed.ts).
 */

import type { EventCategory, TicketStatus } from "../generated/prisma/enums.js";

export type FixtureUser = {
  email: string;
  name: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
};

/** Comptes énoncé + utilisateurs de test FR */
export const FIXTURE_USERS: FixtureUser[] = [
  { email: "organisateur@example.com", name: "Camille Bernard (organisateur)", role: "ORGANIZER" },
  { email: "utilisateur@example.com", name: "Julien Martin", role: "USER" },
  { email: "admin@example.com", name: "Admin plateforme", role: "ADMIN" },
  { email: "sophie.durand@fixture.eventhub.fr", name: "Sophie Durand", role: "USER" },
  { email: "lucas.rousseau@fixture.eventhub.fr", name: "Lucas Rousseau", role: "USER" },
  { email: "amelie.leroy@fixture.eventhub.fr", name: "Amélie Leroy (asso culturelle)", role: "ORGANIZER" },
];

export type FixtureEvent = {
  title: string;
  description: string;
  city: string;
  venue: string;
  category: EventCategory;
  price: number;
  totalSeats: number;
  /** Jours par rapport à « maintenant » (négatif = événement passé, pour tests détail / historique) */
  daysFromNow: number;
  hourLocal: number;
  coverImageUrl?: string;
  /** 0 = premier organisateur (énoncé), 1 = second organisateur */
  organizerIndex: 0 | 1;
};

export const FIXTURE_EVENTS: FixtureEvent[] = [
  // — Énoncé original (5 événements)
  {
    title: "Concert Jazz au Sunset",
    description:
      "Soirée jazz intimiste avec quartet parisien et invités. Cocktail possible en fin de première partie.",
    city: "Paris",
    venue: "Sunset Sunside",
    category: "CONCERT",
    price: 35,
    totalSeats: 100,
    daysFromNow: 14,
    hourLocal: 20,
    organizerIndex: 0,
  },
  {
    title: "Conférence Tech Leaders",
    description:
      "Une journée d'échanges sur l'architecture distribuée, le green IT et l'IA responsable. Keynotes et ateliers.",
    city: "Lyon",
    venue: "Centre de Congrès Cité Internationale",
    category: "CONFERENCE",
    price: 50,
    totalSeats: 200,
    daysFromNow: 21,
    hourLocal: 9,
    organizerIndex: 0,
  },
  {
    title: "Festival Électro Summer",
    description:
      "Deux scènes en plein air, line-up national et DJs invités. Bracelet cashless et restauration sur place.",
    city: "Marseille",
    venue: "Parc Borély",
    category: "FESTIVAL",
    price: 45,
    totalSeats: 500,
    daysFromNow: 60,
    hourLocal: 16,
    organizerIndex: 0,
  },
  {
    title: "Match de Gala",
    description:
      "Rencontre amicale caritative : anciens pros et personnalités locales. Bénéfices reversés à une association.",
    city: "Bordeaux",
    venue: "Matmut Atlantique",
    category: "SPORT",
    price: 25,
    totalSeats: 150,
    daysFromNow: 10,
    hourLocal: 18,
    organizerIndex: 0,
  },
  {
    title: "Hamlet - Comédie Française",
    description:
      "Mise en scène contemporaine du tragique shakespearien. Durée 3 h avec entracte.",
    city: "Paris",
    venue: "Salle Richelieu — Comédie-Française",
    category: "THEATER",
    price: 40,
    totalSeats: 80,
    daysFromNow: 7,
    hourLocal: 20,
    organizerIndex: 0,
  },
  // — Supplément : villes et scènes FR
  {
    title: "Indie Pop — Nantes en fête",
    description: "Groupe nantais en tête d'affiche + premières parties régionales.",
    city: "Nantes",
    venue: "Stereolux",
    category: "CONCERT",
    price: 28,
    totalSeats: 120,
    daysFromNow: 18,
    hourLocal: 20,
    organizerIndex: 0,
  },
  {
    title: "Salon du livre jeunesse",
    description: "Rencontres avec auteurs·ices, dédicaces et ateliers lecture pour les 3–12 ans.",
    city: "Toulouse",
    venue: "MEETT Parc des Expositions",
    category: "OTHER",
    price: 8,
    totalSeats: 400,
    daysFromNow: 25,
    hourLocal: 10,
    organizerIndex: 0,
  },
  {
    title: "Trail nocturne des Cévennes",
    description: "Parcours 12 km et 22 km, départ au crépuscule, ravitaillements bio partenaires.",
    city: "Alès",
    venue: "Départ Place de l'Hôtel de Ville",
    category: "SPORT",
    price: 32,
    totalSeats: 350,
    daysFromNow: 40,
    hourLocal: 19,
    organizerIndex: 0,
  },
  {
    title: "Cyrano de Bergerac",
    description: "Classique en alexandrins, costumes d'époque et musique live.",
    city: "Strasbourg",
    venue: "Théâtre national de Strasbourg",
    category: "THEATER",
    price: 38,
    totalSeats: 95,
    daysFromNow: 11,
    hourLocal: 20,
    organizerIndex: 0,
  },
  {
    title: "Product Conf France",
    description: "Product management, discovery et métriques : retours d'expérience grands comptes et startups.",
    city: "Paris",
    venue: "Dock Pullman — La Villette",
    category: "CONFERENCE",
    price: 120,
    totalSeats: 280,
    daysFromNow: 33,
    hourLocal: 8,
    organizerIndex: 0,
  },
  {
    title: "Reggae Sunsplash Nice",
    description: "Journée roots & dub face à la mer, stands artisans et cuisine caraïbéenne.",
    city: "Nice",
    venue: "Théâtre de verdure",
    category: "FESTIVAL",
    price: 42,
    totalSeats: 600,
    daysFromNow: 55,
    hourLocal: 15,
    organizerIndex: 0,
  },
  {
    title: "Lille Piano Festival — Récital",
    description: "Récital de musique française : Debussy, Ravel, Poulenc.",
    city: "Lille",
    venue: "Auditorium du Nouveau Siècle",
    category: "CONCERT",
    price: 22,
    totalSeats: 65,
    daysFromNow: 5,
    hourLocal: 19,
    organizerIndex: 1,
  },
  {
    title: "Meetup Rust Grenoble",
    description: "Soirée communautaire : async, wasm et embedded. Pizza sponsorisée.",
    city: "Grenoble",
    venue: "La Coopérative de Mai",
    category: "CONFERENCE",
    price: 5,
    totalSeats: 80,
    daysFromNow: 8,
    hourLocal: 18,
    organizerIndex: 1,
  },
  {
    title: "Semi-marathon de Rennes",
    description: "Courses 10 km et 21 km, parcours plat traversant le centre historique.",
    city: "Rennes",
    venue: "Village départ — Mail François-Mitterrand",
    category: "SPORT",
    price: 35,
    totalSeats: 5000,
    daysFromNow: 90,
    hourLocal: 8,
    organizerIndex: 0,
  },
  {
    title: "Opéra — La Traviata",
    description: "Production grand format, chœur et orchestre régional.",
    city: "Montpellier",
    venue: "Opéra Berlioz — Corum",
    category: "THEATER",
    price: 65,
    totalSeats: 200,
    daysFromNow: 45,
    hourLocal: 20,
    organizerIndex: 0,
  },
  {
    title: "Marché de Noël — Concert chorale",
    description: "Chants traditionnels alsaciens, entrée libre avec jauge.",
    city: "Colmar",
    venue: "Place des Dominicains",
    category: "OTHER",
    price: 3,
    totalSeats: 300,
    daysFromNow: 120,
    hourLocal: 17,
    organizerIndex: 1,
  },
  // — Passés (consultation / pas d'achat en liste publique)
  {
    title: "Tournoi interclubs — finale (replay)",
    description: "Finale déjà jouée ; archives et photos disponibles sur le site du club.",
    city: "Clermont-Ferrand",
    venue: "Maison des Sports",
    category: "SPORT",
    price: 15,
    totalSeats: 200,
    daysFromNow: -12,
    hourLocal: 15,
    organizerIndex: 0,
  },
  {
    title: "One-woman show — « Métro, boulot… »",
    description: "Humour sur le quotidien en open-space ; tournée terminée à Clermont.",
    city: "Clermont-Ferrand",
    venue: "Comédie de Clermont",
    category: "THEATER",
    price: 18,
    totalSeats: 150,
    daysFromNow: -45,
    hourLocal: 20,
    organizerIndex: 0,
  },
];

/** Billets : email acheteur, titre d'événement (match exact), statut */
export type FixtureTicket = {
  buyerEmail: string;
  eventTitle: string;
  status: TicketStatus;
};

export const FIXTURE_TICKETS: FixtureTicket[] = [
  { buyerEmail: "utilisateur@example.com", eventTitle: "Concert Jazz au Sunset", status: "VALIDE" },
  { buyerEmail: "utilisateur@example.com", eventTitle: "Conférence Tech Leaders", status: "VALIDE" },
  { buyerEmail: "utilisateur@example.com", eventTitle: "Match de Gala", status: "UTILISE" },
  { buyerEmail: "sophie.durand@fixture.eventhub.fr", eventTitle: "Concert Jazz au Sunset", status: "VALIDE" },
  { buyerEmail: "sophie.durand@fixture.eventhub.fr", eventTitle: "Indie Pop — Nantes en fête", status: "VALIDE" },
  { buyerEmail: "lucas.rousseau@fixture.eventhub.fr", eventTitle: "Product Conf France", status: "ANNULE" },
  { buyerEmail: "utilisateur@example.com", eventTitle: "Tournoi interclubs — finale (replay)", status: "UTILISE" },
];
