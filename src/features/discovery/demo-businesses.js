export const discoveryCategories = [
  "Gym",
  "Salon",
  "Clinic",
  "Coaching Center",
  "Wellness Studio",
  "Consultant"
];

export const demoBusinesses = [
  {
    slug: "elite-fitness-gym",
    name: "Elite Fitness Gym",
    category: "Gym",
    serviceFocus: "Strength training, HIIT classes, personal coaching",
    description:
      "A polished fitness studio with coached strength sessions, small-group classes, and flexible membership options.",
    rating: 4.9,
    reviews: 286,
    location: "Austin, TX",
    address: "210 Congress Ave, Austin, TX",
    price: "From $28",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    services: ["Personal training", "HIIT class", "Mobility assessment"],
    featured: true
  },
  {
    slug: "glow-beauty-salon",
    name: "Glow Beauty Salon",
    category: "Salon",
    serviceFocus: "Hair styling, color, bridal beauty",
    description:
      "A neighborhood beauty destination for precision cuts, color refreshes, blowouts, and event-ready styling.",
    rating: 4.8,
    reviews: 194,
    location: "Los Angeles, CA",
    address: "812 Melrose Ave, Los Angeles, CA",
    price: "From $45",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    services: ["Haircut", "Color consult", "Blowout"],
    featured: true
  },
  {
    slug: "prime-dental-clinic",
    name: "Prime Dental Clinic",
    category: "Clinic",
    serviceFocus: "Dental checkups, whitening, preventive care",
    description:
      "A modern dental practice offering preventive appointments, cosmetic consults, and family-friendly care.",
    rating: 4.9,
    reviews: 341,
    location: "Chicago, IL",
    address: "55 W Lake St, Chicago, IL",
    price: "From $80",
    imageUrl:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=80",
    services: ["Dental cleaning", "Whitening", "Consultation"],
    featured: true
  },
  {
    slug: "smart-coaching-academy",
    name: "Smart Coaching Academy",
    category: "Coaching Center",
    serviceFocus: "Academic tutoring, exam prep, career coaching",
    description:
      "A focused coaching center for students and professionals who need structured learning plans and measurable progress.",
    rating: 4.7,
    reviews: 122,
    location: "New York, NY",
    address: "44 W 28th St, New York, NY",
    price: "From $35",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    services: ["Math tutoring", "SAT prep", "Career coaching"],
    featured: true
  },
  {
    slug: "wellness-therapy-center",
    name: "Wellness Therapy Center",
    category: "Wellness Studio",
    serviceFocus: "Massage therapy, recovery sessions, mindfulness",
    description:
      "A calming wellness studio for massage therapy, guided recovery sessions, and restorative bodywork.",
    rating: 4.8,
    reviews: 208,
    location: "Seattle, WA",
    address: "907 Pine St, Seattle, WA",
    price: "From $65",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    services: ["Massage therapy", "Recovery session", "Mindfulness class"],
    featured: true
  },
  {
    slug: "clarity-growth-consultants",
    name: "Clarity Growth Consultants",
    category: "Consultant",
    serviceFocus: "Business strategy, finance planning, growth workshops",
    description:
      "A boutique consulting team helping founders refine operations, pricing, finance plans, and growth systems.",
    rating: 4.9,
    reviews: 76,
    location: "Denver, CO",
    address: "1550 Market St, Denver, CO",
    price: "From $120",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    services: ["Strategy session", "Pricing review", "Operations audit"],
    featured: true
  },
  {
    slug: "pulse-pilates-studio",
    name: "Pulse Pilates Studio",
    category: "Wellness Studio",
    serviceFocus: "Pilates, posture coaching, private movement sessions",
    description:
      "A boutique movement studio with reformer classes, private instruction, and strength-focused wellness programs.",
    rating: 4.8,
    reviews: 163,
    location: "Miami, FL",
    address: "230 NE 4th St, Miami, FL",
    price: "From $40",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    services: ["Reformer class", "Private pilates", "Posture coaching"],
    featured: false
  },
  {
    slug: "citycare-physio-clinic",
    name: "CityCare Physio Clinic",
    category: "Clinic",
    serviceFocus: "Physiotherapy, sports rehab, injury recovery",
    description:
      "A practical rehab clinic helping clients recover from sports injuries, posture issues, and recurring pain.",
    rating: 4.7,
    reviews: 149,
    location: "Boston, MA",
    address: "18 Boylston St, Boston, MA",
    price: "From $95",
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    services: ["Physio consult", "Sports rehab", "Mobility plan"],
    featured: false
  }
];

export const featuredBusinesses = demoBusinesses.filter(
  (business) => business.featured
);

export function getDemoBusinessBySlug(slug) {
  return demoBusinesses.find((business) => business.slug === slug) || null;
}

export function filterDemoBusinesses({ business = "", service = "", category = "", location = "" } = {}) {
  const businessQuery = business.trim().toLowerCase();
  const serviceQuery = service.trim().toLowerCase();
  const categoryQuery = category.trim().toLowerCase();
  const locationQuery = location.trim().toLowerCase();

  return demoBusinesses.filter((item) => {
    const businessMatch =
      !businessQuery ||
      item.name.toLowerCase().includes(businessQuery) ||
      item.category.toLowerCase().includes(businessQuery) ||
      item.location.toLowerCase().includes(businessQuery);
    const serviceMatch =
      !serviceQuery ||
      item.serviceFocus.toLowerCase().includes(serviceQuery) ||
      item.services.some((demoService) =>
        demoService.toLowerCase().includes(serviceQuery)
      );
    const categoryMatch =
      !categoryQuery || item.category.toLowerCase() === categoryQuery;
    const locationMatch =
      !locationQuery || item.location.toLowerCase().includes(locationQuery);

    return businessMatch && serviceMatch && categoryMatch && locationMatch;
  });
}
