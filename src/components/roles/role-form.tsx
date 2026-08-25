"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULES, getPermissionsForModule } from "@/lib/permissions";

type Permission = {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string | null;
};

interface RoleFormProps {
  mode: "create" | "edit";
  roleId?: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
    viewAllData?: boolean;
    permissionIds?: string[];
  };
}

export function RoleForm({ mode, roleId, defaultValues = {} }: RoleFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(defaultValues.permissionIds || [])
  );
  const [viewAllData, setViewAllData] = useState(defaultValues.viewAllData || false);

  useEffect(() => {
    fetch("/api/roles?action=permissions")
      .then((res) => {
        if (!res.ok) {
          // Fallback: fetch permissions from a dedicated endpoint
          return fetch("/api/roles").then((r) => r.json());
        }
        return res.json();
      })
      .then((data) => {
        if (data.permissions) {
          setPermissions(data.permissions);
        }
      })
      .catch(() => {
        // If the action param doesn't work, we'll build permissions from the module definitions
        const allPerms: Permission[] = [];
        MODULES.forEach((mod) => {
          getPermissionsForModule(mod).forEach((p) => {
            allPerms.push({
              id: p.key,
              key: p.key,
              module: p.module,
              action: p.action,
              description: p.description,
            });
          });
        });
        setPermissions(allPerms);
      });
  }, []);

  // Fetch all permissions for the form
  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.allPermissions) {
          setPermissions(data.allPermissions);
        }
      })
      .catch((err) => console.error("Failed to fetch all permissions", err));
  }, []);

  function togglePermission(permId: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  }

  function toggleModule(module: string, modulePermIds: string[]) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      const allSelected = modulePermIds.every((id) => next.has(id));
      if (allSelected) {
        modulePermIds.forEach((id) => next.delete(id));
      } else {
        modulePermIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedPerms(new Set(permissions.map((p) => p.id)));
  }

  function deselectAll() {
    setSelectedPerms(new Set());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      viewAllData,
      permissionIds: Array.from(selectedPerms),
    };

    try {
      const url = mode === "edit" ? `/api/roles/${roleId}` : "/api/roles";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const role = await res.json();
      router.push(`/dashboard/roles/${role.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // Group permissions by module
  const permsByModule = MODULES.map((mod) => {
    const modPerms = permissions.filter((p) => p.module === mod);
    return {
      module: mod,
      permissions: modPerms,
      allSelected: modPerms.length > 0 && modPerms.every((p) => selectedPerms.has(p.id)),
      someSelected: modPerms.some((p) => selectedPerms.has(p.id)),
    };
  }).filter((g) => g.permissions.length > 0);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={defaultValues.name}
                  placeholder="e.g. Front Desk"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={defaultValues.description || ""}
                  placeholder="What can this role do?"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="viewAllData"
                checked={viewAllData}
                onCheckedChange={(checked) => setViewAllData(checked === true)}
              />
              <Label htmlFor="viewAllData" className="text-sm font-normal cursor-pointer">
                View all data (users with this role can see all records, not just assigned ones)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Permissions</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {permsByModule.map((group) => (
              <div key={group.module} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`module-${group.module}`}
                    checked={group.allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = group.someSelected && !group.allSelected;
                    }}
                    onCheckedChange={() =>
                      toggleModule(
                        group.module,
                        group.permissions.map((p) => p.id)
                      )
                    }
                  />
                  <Label
                    htmlFor={`module-${group.module}`}
                    className="text-sm font-semibold capitalize cursor-pointer"
                  >
                    {group.module.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
                <div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {group.permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPerms.has(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Label
                        htmlFor={perm.id}
                        className="text-sm font-normal capitalize cursor-pointer"
                      >
                        {perm.action}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Role"}
          </Button>
        </div>
      </div>
    </form>
  );
}
