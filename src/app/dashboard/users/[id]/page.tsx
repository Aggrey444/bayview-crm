import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Pencil, User, Mail, Calendar, Briefcase, Activity } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

const roleColors: Record<string, string> = {
  Admin: "bg-violet-100 text-violet-700",
  Manager: "bg-blue-100 text-blue-700",
  Staff: "bg-zinc-100 text-zinc-600",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: user ? `User — ${user.name || user.email}` : "User Not Found" };
}

export default async function UserDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { id: true, name: true } },
      image: true,
      createdAt: true,
      _count: {
        select: { assignedLeads: true, activities: true, bookings: true, assignedBookings: true },
      },
    },
  });

  if (!user) notFound();

  const roleName = user.role?.name || "No Role";

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name || "Unnamed User"}
        description={user.email}
        actions={
          <Link
            href={`/dashboard/users/${user.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <User className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Role</p>
              <Badge variant="secondary" className={`text-[10px] ${roleColors[roleName] || "bg-zinc-100 text-zinc-600"}`}>
                {roleName}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Mail className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Briefcase className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Assigned Leads</p>
              <p className="text-sm font-medium">{user._count.assignedLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Activity className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Activities</p>
              <p className="text-sm font-medium">{user._count.activities}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Briefcase className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Bookings</p>
              <p className="text-sm font-medium">
                {user._count.bookings} owned, {user._count.assignedBookings} assigned
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
