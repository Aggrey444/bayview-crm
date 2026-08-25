import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { FollowUpList } from "@/components/shared/follow-up-list";
import { AddActivityForm } from "@/components/shared/add-activity-form";
import { getLeadById } from "@/lib/queries/leads";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Phone, Mail, Building, Calendar, DollarSign, Tag, User, Zap, Globe } from "lucide-react";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";
import { LeadStatusChanger } from "@/components/leads/lead-status-changer";
import { LeadAssigner } from "@/components/leads/lead-assigner";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLeadById(id);
  return { title: lead ? `${lead.name} — Leads` : "Lead Not Found" };
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-zinc-100 text-zinc-600",
};

export default async function LeadDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const [allStatuses, allStaff] = await Promise.all([
    db.leadStatus.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalBookings = lead.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        description={lead.company || lead.email || `Lead #${lead.id.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/leads/${lead.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </Link>
          </div>
        }
      />

      {/* Quick Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Tag className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-sm font-medium">{lead.status?.name || "Unassigned"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Zap className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Priority</p>
              <Badge variant="secondary" className={`text-[10px] ${priorityColors[lead.priority] || ""}`}>{lead.priority}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <User className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Assigned To</p>
              <p className="text-sm font-medium">{lead.assignedTo?.name || "Unassigned"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <DollarSign className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Expected Value</p>
              <p className="text-sm font-medium">
                {lead.expectedValue ? formatCurrency(Number(lead.expectedValue)) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact + Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lead.email && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Mail className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Email</p><p className="text-sm font-medium">{lead.email}</p></div></CardContent></Card>
        )}
        {lead.phone && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Phone className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Phone</p><p className="text-sm font-medium">{lead.phone}</p></div></CardContent></Card>
        )}
        {lead.company && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Building className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Company</p><p className="text-sm font-medium">{lead.company}</p></div></CardContent></Card>
        )}
        <Card><CardContent className="flex items-center gap-3 pt-4"><Calendar className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Created</p><p className="text-sm font-medium">{formatDate(lead.createdAt)}</p></div></CardContent></Card>
        {lead.source && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Tag className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Source</p><p className="text-sm font-medium">{lead.source.name}</p></div></CardContent></Card>
        )}
        {lead.service && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Zap className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Service</p><p className="text-sm font-medium">{lead.service}</p></div></CardContent></Card>
        )}
      </div>

      {/* UTM Tracking Data */}
      {(lead.utmSource || lead.utmMedium || lead.utmCampaign || lead.utmContent || lead.utmTerm) && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> UTM Tracking</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {lead.utmSource && <div><p className="text-xs text-zinc-500">Source</p><p className="text-sm font-medium">{lead.utmSource}</p></div>}
              {lead.utmMedium && <div><p className="text-xs text-zinc-500">Medium</p><p className="text-sm font-medium">{lead.utmMedium}</p></div>}
              {lead.utmCampaign && <div><p className="text-xs text-zinc-500">Campaign</p><p className="text-sm font-medium">{lead.utmCampaign}</p></div>}
              {lead.utmContent && <div><p className="text-xs text-zinc-500">Content</p><p className="text-sm font-medium">{lead.utmContent}</p></div>}
              {lead.utmTerm && <div><p className="text-xs text-zinc-500">Term</p><p className="text-sm font-medium">{lead.utmTerm}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Changer + Assigner */}
      <div className="grid gap-4 sm:grid-cols-2">
        <LeadStatusChanger leadId={lead.id} currentStatusId={lead.statusId} statuses={allStatuses} />
        <LeadAssigner leadId={lead.id} currentAssignedId={lead.assignedToId} staff={allStaff} />
      </div>

      {/* Notes */}
      {lead.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-600 whitespace-pre-wrap">{lead.notes}</p></CardContent>
        </Card>
      )}

      {/* Linked Customer */}
      {lead.customer && (
        <Card>
          <CardContent className="flex items-center justify-between pt-4">
            <div>
              <p className="text-xs text-zinc-500">Linked Customer</p>
              <p className="text-sm font-medium">{lead.customer.name}</p>
            </div>
            <Link href={`/dashboard/customers/${lead.customer.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              View Customer
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Activity + Follow-ups */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activity ({lead.activities.length})</CardTitle>
              <AddActivityForm leadId={lead.id} onSuccess={() => {}} />
            </div>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={lead.activities as unknown as { id: string; type: string; subject: string; description: string | null; createdAt: Date; user: { id: string; name: string | null }; lead?: { id: string; name: string } | null; customer?: { id: string; name: string } | null }[]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowUpList
              initialFollowUps={lead.followUps as unknown as { id: string; title: string; description: string | null; dueDate: Date; completed: boolean; completedAt: Date | null; createdAt: Date; lead: { id: string; name: string }; assignedTo: { id: string; name: string | null } }[]}
              leadId={lead.id}
              staff={allStaff}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      {lead.bookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Bookings ({lead.bookings.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lead.bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{b.propertyName}</span>
                    <p className="text-xs text-zinc-500">{formatDate(b.checkInDate)} — {formatDate(b.checkOutDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(Number(b.totalAmount))}</span>
                    <Badge variant="secondary" className="text-[10px]">{b.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
