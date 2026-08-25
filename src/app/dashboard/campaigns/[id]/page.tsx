import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { Pencil, Calendar, DollarSign, FileText, Trash2 } from "lucide-react";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id }, select: { name: true } });
  return { title: campaign ? `Campaign — ${campaign.name}` : "Campaign Not Found" };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-violet-100 text-violet-700",
};

export default async function CampaignDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { source: true, status: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: { leads: true, messages: true },
      },
    },
  });

  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={campaign.description || "Marketing campaign"}
        actions={
          <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <FileText className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <Badge variant="secondary" className={`text-[10px] ${statusColors[campaign.status] || ""}`}>
                {campaign.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <DollarSign className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Budget</p>
              <p className="text-sm font-medium">{campaign.budget != null ? formatCurrency(Number(campaign.budget)) : "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Dates</p>
              <p className="text-sm font-medium">{campaign.startDate ? formatDate(campaign.startDate) : "—"}</p>
              {campaign.endDate && <p className="text-xs text-zinc-400">to {formatDate(campaign.endDate)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <FileText className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm font-medium">{formatDateTime(campaign.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {campaign.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-600 whitespace-pre-wrap">{campaign.description}</p></CardContent>
        </Card>
      )}

      {campaign.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-600 whitespace-pre-wrap">{campaign.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Leads ({campaign._count.leads})</CardTitle></CardHeader>
        <CardContent>
          {campaign.leads.length === 0 ? (
            <p className="text-sm text-zinc-500">No leads linked to this campaign.</p>
          ) : (
            <div className="space-y-2">
              {campaign.leads.map((lead) => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div>
                    <span className="text-sm font-medium">{lead.name}</span>
                    {lead.company && <span className="ml-2 text-xs text-zinc-500">{lead.company}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.status && <Badge variant="secondary" className="text-[10px]">{lead.status.name}</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Messages ({campaign._count.messages})</CardTitle></CardHeader>
        <CardContent>
          {campaign.messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages linked to this campaign.</p>
          ) : (
            <div className="space-y-2">
              {campaign.messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{msg.channel}</Badge>
                    {msg.subject && <span className="text-sm font-medium">{msg.subject}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{msg.body}</p>
                  {msg.sentAt && <p className="text-xs text-zinc-400 mt-0.5">Sent {formatDateTime(msg.sentAt)}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
