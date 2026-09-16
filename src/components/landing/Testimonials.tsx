import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import type { TestimonialItem } from "@/lib/website-content"

const defaultTestimonials = [
  {
    name: "Sarah & Michael Thompson",
    event: "Wedding Reception",
    rating: 5,
    comment:
      "Bayview Village made our wedding day absolutely perfect! The forecourt was beautifully decorated, the food was exceptional, and the staff went above and beyond. Our guests are still talking about it!",
    image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
  },
  {
    name: "David Mensah",
    event: "Corporate Retreat",
    rating: 5,
    comment:
      "We hosted our annual company retreat at Bayview Village. The conference facilities were top-notch, the accommodation was comfortable, and the pool area was perfect for team building. Highly recommended!",
    image: "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
  },
  {
    name: "Grace Asante",
    event: "Birthday Celebration",
    rating: 5,
    comment:
      "My 40th birthday party was amazing! The pool area was perfect for our celebration, the DJ setup was professional, and the Sunday special food was delicious. Thank you for making it memorable!",
    image: "/lovable-uploads/962eeda5-72ea-47b8-9193-c6b28b9cfc4f.png",
  },
]

export const Testimonials = ({ testimonials }: { testimonials?: TestimonialItem[] }) => {
  const displayItems = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Quote className="h-3.5 w-3.5" />
            Client Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4">
            What Our Guests Say
          </h2>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Real experiences from real guests who chose Bayview Village for their milestone celebrations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {displayItems.map((testimonial, index) => (
            <Card
              key={index}
              className="border border-zinc-200/80 dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-zinc-50 dark:bg-zinc-900"
            >
              <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>

                  <blockquote className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.comment}&rdquo;
                  </blockquote>
                </div>

                <div className="flex items-center border-t border-zinc-200/60 dark:border-white/10 pt-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden mr-3.5 shrink-0 bg-zinc-200">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      {testimonial.event}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
