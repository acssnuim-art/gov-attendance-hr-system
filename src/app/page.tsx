import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (
    userRecord?.account_status === "pending" ||
    userRecord?.account_status === "suspended"
  ) {
    redirect("/pending");
  }

  if (userRecord?.role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/dashboard");
}
