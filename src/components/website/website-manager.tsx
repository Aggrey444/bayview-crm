"use client"

import { useState } from "react"
import {
  type WebsiteContent,
  type ServiceItem,
  type PackageItem,
  type GalleryItem,
  type TestimonialItem,
} from "@/lib/website-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Star,
  Phone,
  Sparkles,
  Loader2,
} from "lucide-react"

interface WebsiteManagerProps {
  initialContent: WebsiteContent
}

export function WebsiteManager({ initialContent }: WebsiteManagerProps) {
  const [content, setContent] = useState<WebsiteContent>(initialContent)
  const [activeTab, setActiveTab] = useState<"services" | "packages" | "hero" | "gallery" | "testimonials" | "contact">("services")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState("")

  // Editing modals / state
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null)

  // Upload helper
  async function handleFileUpload(file: File): Promise<string | null> {
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      return data.url
    } catch (err: any) {
      setError(err.message || "Failed to upload image")
      return null
    } finally {
      setUploading(false)
    }
  }

  // Save changes to API
  async function handleSaveAll() {
    setSaving(true)
    setError("")
    setSaveSuccess(false)

    try {
      const res = await fetch("/api/website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save website changes")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err: any) {
      setError(err.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-white">Website CMS</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Update services, packages, images, and texts in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            Preview Live Website
          </a>

          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl px-4 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-1.5 text-green-950" /> Saved Successfully!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" /> Publish Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 text-sm rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-100/80 dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-white/5">
        {[
          { id: "services", label: "Services", count: content.services.length, icon: Layers },
          { id: "packages", label: "Event Packages", count: content.packages.length, icon: Sparkles },
          { id: "hero", label: "Hero & Carousel", count: content.hero.images.length, icon: ImageIcon },
          { id: "gallery", label: "Gallery", count: content.gallery.length, icon: ImageIcon },
          { id: "testimonials", label: "Testimonials", count: content.testimonials.length, icon: Star },
          { id: "contact", label: "Contact Info", icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─────────────────── TAB 1: SERVICES ─────────────────── */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Services Section</h3>
              <p className="text-xs text-zinc-500">Manage all services displayed on the homepage.</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingService({
                  id: `srv-${Date.now()}`,
                  title: "",
                  description: "",
                  price: "Starting at GH₵",
                  features: ["Wi-Fi", "Air Conditioning"],
                  image: "/lovable-uploads/71a1b072-04d6-4b2a-b1aa-f1d4402f5563.png",
                })
              }
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add New Service
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.services.map((srv) => (
              <Card key={srv.id} className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="relative h-40 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setEditingService(srv)}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 hover:bg-white text-zinc-700 dark:text-zinc-300 shadow-xs"
                        title="Edit Service"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            services: prev.services.filter((s) => s.id !== srv.id),
                          }))
                        }
                        className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-xs"
                        title="Delete Service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">{srv.title}</CardTitle>
                    <p className="text-xs text-zinc-500 line-clamp-2">{srv.description}</p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">{srv.price}</p>
                  </CardHeader>
                </div>

                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-1 mt-2">
                    {srv.features.map((f, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 2: PACKAGES ─────────────────── */}
      {activeTab === "packages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Celebration Packages</h3>
              <p className="text-xs text-zinc-500">Manage event packages (Essential, Premium, Luxury VIP).</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingPackage({
                  id: `pkg-${Date.now()}`,
                  name: "",
                  price: "GH₵",
                  duration: "Full Day Event",
                  popular: false,
                  features: ["Event access", "Security"],
                  image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
                })
              }
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add New Package
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {content.packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="relative h-40 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                    {pkg.popular && (
                      <Badge className="absolute bottom-2 left-2 bg-amber-500 text-black text-[10px] font-bold">
                        Most Popular
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setEditingPackage(pkg)}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 hover:bg-white text-zinc-700 dark:text-zinc-300 shadow-xs"
                        title="Edit Package"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            packages: prev.packages.filter((p) => p.id !== pkg.id),
                          }))
                        }
                        className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-xs"
                        title="Delete Package"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">{pkg.name}</CardTitle>
                    <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">{pkg.price}</p>
                    <p className="text-xs text-zinc-500">{pkg.duration}</p>
                  </CardHeader>
                </div>

                <CardContent className="p-4 pt-0">
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 mt-2">
                    {pkg.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="line-clamp-1">✓ {f}</li>
                    ))}
                    {pkg.features.length > 4 && (
                      <li className="text-[10px] text-zinc-400">+ {pkg.features.length - 4} more features</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 3: HERO & CAROUSEL ─────────────────── */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-zinc-200/80 dark:border-white/10 p-5 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Hero Section Text</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Main Headline</Label>
                <Input
                  id="hero-title"
                  value={content.hero.title}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, title: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-sub">Subtitle</Label>
                <Input
                  id="hero-sub"
                  value={content.hero.subtitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subtitle: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hero-desc">Amenities / Tagline List</Label>
                <Input
                  id="hero-desc"
                  value={content.hero.description}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, description: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-zinc-200/80 dark:border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Background Carousel Images</h3>
                <p className="text-xs text-zinc-500">Slides that rotate in the hero background (5s interval).</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      const url = await handleFileUpload(f)
                      if (url) {
                        setContent((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, images: [...prev.hero.images, url] },
                        }))
                      }
                    }
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {content.hero.images.map((img, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800">
                  <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        hero: {
                          ...prev.hero,
                          images: prev.hero.images.filter((_, idx) => idx !== i),
                        },
                      }))
                    }
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Slide"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────── TAB 4: GALLERY ─────────────────── */}
      {activeTab === "gallery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Facility Gallery</h3>
              <p className="text-xs text-zinc-500">Manage photos shown in the "See Bayview Village" gallery.</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingGallery({
                  id: `gal-${Date.now()}`,
                  src: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
                  title: "New Photo",
                  category: "Venues",
                })
              }
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Photo
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.gallery.map((item) => (
              <Card key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
                <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setEditingGallery(item)}
                      className="p-1 rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() =>
                        setContent((prev) => ({
                          ...prev,
                          gallery: prev.gallery.filter((g) => g.id !== item.id),
                        }))
                      }
                      className="p-1 rounded-md bg-red-600 text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">{item.category}</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{item.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 5: TESTIMONIALS ─────────────────── */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Guest Reviews & Testimonials</h3>
              <p className="text-xs text-zinc-500">Stories and reviews from clients.</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingTestimonial({
                  id: `test-${Date.now()}`,
                  name: "",
                  event: "Wedding Reception",
                  rating: 5,
                  comment: "",
                  image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
                })
              }
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Review
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {content.testimonials.map((test) => (
              <Card key={test.id} className="p-5 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-500">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingTestimonial(test)} className="p-1 text-zinc-500 hover:text-zinc-900">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            testimonials: prev.testimonials.filter((t) => t.id !== test.id),
                          }))
                        }
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 italic mb-4">&ldquo;{test.comment}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2.5 border-t border-zinc-200/60 dark:border-white/10 pt-3">
                  <img src={test.image} alt={test.name} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{test.name}</p>
                    <p className="text-[10px] text-amber-600 font-medium">{test.event}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 6: CONTACT INFO ─────────────────── */}
      {activeTab === "contact" && (
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Business & Contact Details</h3>
            <p className="text-xs text-zinc-500">Official contact info displayed across the footer and contact cards.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="c-phone1">Primary Phone Number</Label>
              <Input
                id="c-phone1"
                value={content.contact.phone1}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone1: e.target.value },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-phone2">Secondary Phone Number</Label>
              <Input
                id="c-phone2"
                value={content.contact.phone2}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone2: e.target.value },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-whatsapp">WhatsApp Number (e.g. 233204473577)</Label>
              <Input
                id="c-whatsapp"
                value={content.contact.whatsapp || ""}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, whatsapp: e.target.value },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-email">Contact Email</Label>
              <Input
                id="c-email"
                type="email"
                value={content.contact.email}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-addr">Physical Address</Label>
              <Input
                id="c-addr"
                value={content.contact.address}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </Card>
      )}

      {/* ─────────────────── EDIT SERVICE MODAL ─────────────────── */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border shadow-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Edit Service</h3>
              <button onClick={() => setEditingService(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Service Title</Label>
                <Input
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  placeholder="e.g. Hotel Rooms"
                />
              </div>

              <div>
                <Label>Starting Price / Rate</Label>
                <Input
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                  placeholder="e.g. Starting at GH₵800"
                />
              </div>

              <div>
                <Label>Short Description</Label>
                <Textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Describe this service..."
                />
              </div>

              <div>
                <Label>Features (comma-separated)</Label>
                <Input
                  value={editingService.features.join(", ")}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Wi-Fi, Air Conditioning, Breakfast"
                />
              </div>

              <div>
                <Label>Service Image</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingService.image}
                    onChange={(e) => setEditingService({ ...editingService, image: e.target.value })}
                    placeholder="/lovable-uploads/..."
                  />
                  <label className="shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer hover:bg-zinc-200 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          const url = await handleFileUpload(f)
                          if (url) setEditingService({ ...editingService, image: url })
                        }
                      }}
                    />
                  </label>
                </div>
                {editingService.image && (
                  <img src={editingService.image} alt="Preview" className="mt-2 h-20 w-auto rounded-lg object-cover border" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingService(null)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  setContent((prev) => {
                    const exists = prev.services.some((s) => s.id === editingService.id)
                    return {
                      ...prev,
                      services: exists
                        ? prev.services.map((s) => (s.id === editingService.id ? editingService : s))
                        : [...prev.services, editingService],
                    }
                  })
                  setEditingService(null)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl"
              >
                Apply Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────── EDIT PACKAGE MODAL ─────────────────── */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border shadow-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Edit Event Package</h3>
              <button onClick={() => setEditingPackage(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Package Name</Label>
                <Input
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  placeholder="e.g. Premium Wedding Package"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price</Label>
                  <Input
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                    placeholder="e.g. GH₵35,000"
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={editingPackage.duration}
                    onChange={(e) => setEditingPackage({ ...editingPackage, duration: e.target.value })}
                    placeholder="e.g. Full Day Event"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pkg-pop"
                  checked={editingPackage.popular || false}
                  onChange={(e) => setEditingPackage({ ...editingPackage, popular: e.target.checked })}
                  className="rounded h-4 w-4 text-amber-500"
                />
                <Label htmlFor="pkg-pop" className="cursor-pointer">Mark as &quot;Most Popular&quot;</Label>
              </div>

              <div>
                <Label>Features / Inclusions (comma-separated)</Label>
                <Textarea
                  rows={3}
                  value={editingPackage.features.join("\n")}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="One feature per line..."
                />
              </div>

              <div>
                <Label>Package Banner Image</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingPackage.image}
                    onChange={(e) => setEditingPackage({ ...editingPackage, image: e.target.value })}
                  />
                  <label className="shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer hover:bg-zinc-200 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          const url = await handleFileUpload(f)
                          if (url) setEditingPackage({ ...editingPackage, image: url })
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingPackage(null)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  setContent((prev) => {
                    const exists = prev.packages.some((p) => p.id === editingPackage.id)
                    return {
                      ...prev,
                      packages: exists
                        ? prev.packages.map((p) => (p.id === editingPackage.id ? editingPackage : p))
                        : [...prev.packages, editingPackage],
                    }
                  })
                  setEditingPackage(null)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl"
              >
                Apply Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────── EDIT GALLERY MODAL ─────────────────── */}
      {editingGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Edit Gallery Photo</h3>
              <button onClick={() => setEditingGallery(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingGallery.title}
                  onChange={(e) => setEditingGallery({ ...editingGallery, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={editingGallery.category}
                  onChange={(e) => setEditingGallery({ ...editingGallery, category: e.target.value })}
                  placeholder="e.g. Venues, Accommodation, Weddings"
                />
              </div>
              <div>
                <Label>Photo</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingGallery.src}
                    onChange={(e) => setEditingGallery({ ...editingGallery, src: e.target.value })}
                  />
                  <label className="shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer hover:bg-zinc-200 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          const url = await handleFileUpload(f)
                          if (url) setEditingGallery({ ...editingGallery, src: url })
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingGallery(null)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  setContent((prev) => {
                    const exists = prev.gallery.some((g) => g.id === editingGallery.id)
                    return {
                      ...prev,
                      gallery: exists
                        ? prev.gallery.map((g) => (g.id === editingGallery.id ? editingGallery : g))
                        : [...prev.gallery, editingGallery],
                    }
                  })
                  setEditingGallery(null)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl"
              >
                Apply
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────── EDIT TESTIMONIAL MODAL ─────────────────── */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Edit Review</h3>
              <button onClick={() => setEditingTestimonial(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Guest Name</Label>
                <Input
                  value={editingTestimonial.name}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Event / Occasion</Label>
                  <Input
                    value={editingTestimonial.event}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, event: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={editingTestimonial.rating}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Review Quote</Label>
                <Textarea
                  rows={3}
                  value={editingTestimonial.comment}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, comment: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingTestimonial(null)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => {
                  setContent((prev) => {
                    const exists = prev.testimonials.some((t) => t.id === editingTestimonial.id)
                    return {
                      ...prev,
                      testimonials: exists
                        ? prev.testimonials.map((t) => (t.id === editingTestimonial.id ? editingTestimonial : t))
                        : [...prev.testimonials, editingTestimonial],
                    }
                  })
                  setEditingTestimonial(null)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl"
              >
                Apply
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
