import { AdminLogin } from "@/components/admin-login";

// Read ADMIN_PASSWORD at request time, not at build time.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />;
}
