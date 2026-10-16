import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserTicketsData } from "@/utils/userTickets";
import AccountTicketsClient from "./AccountTicketsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountTicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialData = await getUserTicketsData({
    id: user.id,
    email: user.email,
  });

  return (
    <AccountTicketsClient
      initialData={initialData}
      userId={user.id}
      userEmail={user.email || ""}
    />
  );
}
