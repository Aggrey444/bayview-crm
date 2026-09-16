import { db } from "@/lib/prisma"

export interface ServiceItem {
  id: string
  title: string
  description: string
  price: string
  features: string[]
  image: string
}

export interface PackageItem {
  id: string
  name: string
  price: string
  duration: string
  popular?: boolean
  features: string[]
  image: string
}

export interface GalleryItem {
  id: string
  src: string
  title: string
  category: string
}

export interface TestimonialItem {
  id: string
  name: string
  event: string
  rating: number
  comment: string
  image: string
}

export interface WebsiteContent {
  hero: {
    title: string
    subtitle: string
    description: string
    location: string
    phone: string
    whatsapp: string
    images: string[]
  }
  services: ServiceItem[]
  packages: PackageItem[]
  gallery: GalleryItem[]
  testimonials: TestimonialItem[]
  contact: {
    phone1: string
    phone2: string
    whatsapp: string
    email: string
    address: string
  }
}

export const defaultWebsiteContent: WebsiteContent = {
  hero: {
    title: "BAYVIEW VILLAGE",
    subtitle: "Accra's Premier Event Destination & Luxury Stay",
    description: "Hotel Accommodation • Event Venues • Fine Dining • Pool Facilities • Live Sports",
    location: "Atomic Junction, Accra, Ghana",
    phone: "0204 473 577",
    whatsapp: "233204473577",
    images: [
      "/lovable-uploads/valentines-single.jpg",
      "/lovable-uploads/valentines-couple.jpg",
      "/lovable-uploads/valentines-share.jpg",
      "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
      "/lovable-uploads/9fc66a82-86aa-49af-b5d0-fc00907aeaf8.png",
      "/lovable-uploads/9a6b974b-e7c5-442d-8ce9-af2ea29bfab8.png",
      "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
      "/lovable-uploads/9921387a-aaa7-46ec-8f5d-b3de8d0089de.png",
      "/lovable-uploads/0727c477-1203-4e01-b294-d5fa76822bb5.png",
      "/lovable-uploads/9b546d19-2c65-4d97-afec-45e7b80a748a.png",
      "/lovable-uploads/778bd79a-be65-492c-bfa0-3b810e0d634f.png",
      "/lovable-uploads/58842caf-a39a-4c3a-87ab-5132b49327b8.png",
    ],
  },
  services: [
    {
      id: "srv-1",
      title: "Hotel Rooms",
      description: "Comfortable accommodation with modern amenities, AC, and breakfast.",
      price: "Starting at GH₵800",
      features: ["Wi-Fi", "DSTV", "Air Conditioning", "Complimentary Breakfast"],
      image: "/lovable-uploads/71a1b072-04d6-4b2a-b1aa-f1d4402f5563.png",
    },
    {
      id: "srv-2",
      title: "Event Venues",
      description: "Perfect spaces for weddings, corporate events & celebrations.",
      price: "From GH₵2,000",
      features: ["Forecourt (800 capacity)", "Cold Rooms (50-70 capacity)", "Conference Hall (150 capacity)"],
      image: "/lovable-uploads/6b548797-ebbb-4409-a4e9-093bee371898.png",
    },
    {
      id: "srv-3",
      title: "Pool Area",
      description: "Relaxing pool facilities for daytime leisure and private night parties.",
      price: "GH₵4,000 - GH₵7,000",
      features: ["200 capacity", "8 hours rental", "Swimming pool", "Pool beds available"],
      image: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
    },
    {
      id: "srv-4",
      title: "Dining & Menu",
      description: "Exquisite local and international cuisine prepared by culinary chefs.",
      price: "À la carte & Buffets",
      features: ["Sunday Special: Omo-Tuo/Fufu", "Local delicacies", "International dishes", "Beverages & cocktails"],
      image: "/lovable-uploads/31f3683b-3848-44dd-8571-6f66fba2f2cc.png",
    },
    {
      id: "srv-5",
      title: "Live Sports",
      description: "Watch Premier League, Champions League and El Clasico in style.",
      price: "Special game packages",
      features: ["Giant screens", "Surround audio", "Ice-cold drinks", "Barbecue & bites"],
      image: "/lovable-uploads/8c01461a-e118-4d6c-9a1b-e4335a38e460.png",
    },
    {
      id: "srv-6",
      title: "Event Planning",
      description: "End-to-end event setup, sound, lighting, decor, and MC management.",
      price: "Custom quotes",
      features: ["Weddings", "Birthday parties", "Corporate retreats", "Full service planning"],
      image: "/lovable-uploads/2a8a35b6-2291-4ae8-a49f-6df42e7095a6.png",
    },
  ],
  packages: [
    {
      id: "pkg-1",
      name: "Essential Package",
      price: "GH₵4,000",
      duration: "Full Day Event",
      image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
      features: [
        "Full event access till 02:00",
        "Light refreshments setup",
        "Ambient lighting system",
        "DJ service - 4 hours",
        "Spacious parking space",
      ],
    },
    {
      id: "pkg-2",
      name: "Premium Package (Weddings & Parties)",
      price: "GH₵35,000",
      duration: "Full Day Event",
      image: "/lovable-uploads/1287ed52-2c9c-4eaa-b93a-8af2c591fe5b.png",
      popular: true,
      features: [
        "Grand entrance with MC (up to 300 guests)",
        "Photography & videography coverage",
        "Bridal suite access & changing room",
        "Professional sound and stage lighting",
        "DJ service - 6 hours",
        "20 banquet tables and chairs",
        "Floral & theme decoration",
        "Secured parking & on-site security personnel",
      ],
    },
    {
      id: "pkg-3",
      name: "Luxury VIP Package",
      price: "GH₵65,000",
      duration: "Full Day + Overnight Suite",
      image: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
      features: [
        "Overnight Luxury Suite included",
        "Pool venue rental & night illumination",
        "Full luxury decor & centerpiece setup",
        "Complimentary VIP English breakfast",
        "Full sound, DJ & lighting rigging",
        "Dedicated event manager & team",
        "Full security & valet support",
      ],
    },
  ],
  gallery: [
    {
      id: "gal-1",
      src: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
      title: "Pool & Recreation",
      category: "Venues",
    },
    {
      id: "gal-2",
      src: "/lovable-uploads/6b548797-ebbb-4409-a4e9-093bee371898.png",
      title: "Grand Forecourt",
      category: "Events",
    },
    {
      id: "gal-3",
      src: "/lovable-uploads/71a1b072-04d6-4b2a-b1aa-f1d4402f5563.png",
      title: "Hotel Suites",
      category: "Accommodation",
    },
    {
      id: "gal-4",
      src: "/lovable-uploads/31f3683b-3848-44dd-8571-6f66fba2f2cc.png",
      title: "Gourmet Dining",
      category: "Cuisine",
    },
    {
      id: "gal-5",
      src: "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
      title: "Premium Bar",
      category: "Beverages",
    },
    {
      id: "gal-6",
      src: "/lovable-uploads/2a8a35b6-2291-4ae8-a49f-6df42e7095a6.png",
      title: "Live Entertainment",
      category: "Events",
    },
    {
      id: "gal-7",
      src: "/lovable-uploads/1287ed52-2c9c-4eaa-b93a-8af2c591fe5b.png",
      title: "Wedding Ceremonies",
      category: "Weddings",
    },
    {
      id: "gal-8",
      src: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
      title: "Birthday Celebrations",
      category: "Parties",
    },
    {
      id: "gal-9",
      src: "/lovable-uploads/d8df34eb-246d-436a-a217-1d2dd0da08f6.png",
      title: "Corporate Events",
      category: "Business",
    },
  ],
  testimonials: [
    {
      id: "test-1",
      name: "Sarah & Michael Thompson",
      event: "Wedding Reception",
      rating: 5,
      comment:
        "Bayview Village made our wedding day absolutely perfect! The forecourt was beautifully decorated, the food was exceptional, and the staff went above and beyond. Our guests are still talking about it!",
      image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
    },
    {
      id: "test-2",
      name: "David Mensah",
      event: "Corporate Retreat",
      rating: 5,
      comment:
        "We hosted our annual company retreat at Bayview Village. The conference facilities were top-notch, the accommodation was comfortable, and the pool area was perfect for team building. Highly recommended!",
      image: "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
    },
    {
      id: "test-3",
      name: "Grace Asante",
      event: "Birthday Celebration",
      rating: 5,
      comment:
        "My 40th birthday party was amazing! The pool area was perfect for our celebration, the DJ setup was professional, and the Sunday special food was delicious. Thank you for making it memorable!",
      image: "/lovable-uploads/962eeda5-72ea-47b8-9193-c6b28b9cfc4f.png",
    },
  ],
  contact: {
    phone1: "0204 473 577",
    phone2: "0545 477 777",
    whatsapp: "233204473577",
    email: "info@bayviewvillageltd.com",
    address: "Atomic Junction, Accra, Ghana",
  },
}

export async function getWebsiteContent(): Promise<WebsiteContent> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "website_content" },
    })

    if (setting?.value && typeof setting.value === "object") {
      return {
        ...defaultWebsiteContent,
        ...(setting.value as Partial<WebsiteContent>),
      }
    }
  } catch (error) {
    console.warn("Could not load website_content from db, using defaults:", error)
  }

  return defaultWebsiteContent
}

export async function saveWebsiteContent(content: WebsiteContent): Promise<void> {
  await db.systemSetting.upsert({
    where: { key: "website_content" },
    update: { value: content as any },
    create: {
      key: "website_content",
      value: content as any,
    },
  })
}
