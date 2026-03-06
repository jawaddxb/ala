import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={session.user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
// Force rebuild Fri Jan 30 19:50:50 +04 2026
