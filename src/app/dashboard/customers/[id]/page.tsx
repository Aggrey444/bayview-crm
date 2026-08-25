import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCustomerById } from "@/lib/queries/customers";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Pencil, Phone, Mail, Building, MapPin, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return { title: customer ? `${customer.name} — Customers` : "Customer Not Found" };
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-zinc-100 text-zinc-600",
};

const bookingStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-emerald-100 text-emerald-700",
  CHECKED_OUT: "bg-zinc-100 text-zinc-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function CustomerDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.company || customer.email || undefined}
        actions={
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Link>
        }
      />

      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {customer.email && (
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <Mail className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm font-medium">{customer.email}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {customer.phone && (
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <Phone className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Phone</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {customer.company && (
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <Building className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Company</p>
                <p className="text-sm font-medium">{customer.company}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Customer Since</p>
              <p className="text-sm font-medium">{formatDate(customer.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {customer.address && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Address</p>
              <p className="text-sm font-medium">{customer.address}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      <Card>
        <CardContent className="flex items-start gap-3 pt-4">
          <Tag className="h-4 w-4 text-zinc-400 mt-0.5" />
          <div>
            <p className="text-xs text-zinc-500">Subscribed Services</p>
            {customer.services.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {customer.services.map((s) => (
                  <Badge key={s.id} variant="secondary" className="text-xs">
                    {s.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 mt-1">No services assigned.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({customer.leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.leads.length === 0 ? (
            <p className="text-sm text-zinc-500">No leads for this customer.</p>
          ) : (
            <div className="space-y-2">
              {customer.leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{lead.name}</span>
                    {lead.email && (
                      <span className="ml-2 text-xs text-zinc-500">{lead.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.source && (
                      <Badge variant="secondary" className="text-[10px]">
                        {lead.source.name}
                      </Badge>
                    )}
                    {lead.status && (
                      <Badge variant="secondary" className="text-[10px]">
                        {lead.status.name}
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${priorityColors[lead.priority] || ""}`}
                    >
                      {lead.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({customer.bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.bookings.length === 0 ? (
            <p className="text-sm text-zinc-500">No bookings for this customer.</p>
          ) : (
            <div className="space-y-2">
              {customer.bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{b.propertyName}</span>
                    {b.roomNumber && (
                      <span className="ml-2 text-xs text-zinc-500">Room {b.roomNumber}</span>
                    )}
                    <p className="text-xs text-zinc-500">
                      {formatDate(b.checkInDate)} — {formatDate(b.checkOutDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(b.totalAmount))}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${bookingStatusColors[b.status] || ""}`}
                    >
                      {b.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity ({customer.activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.activities.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity recorded.</p>
          ) : (
            <div className="space-y-2">
              {customer.activities.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{a.type.replace("_", " ")}</span>
                    {a.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{a.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500">{formatDate(a.createdAt)}</p>
                    {a.user && (
                      <p className="text-xs text-zinc-400">{a.user.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
