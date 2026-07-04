import { redirect } from "next/navigation";
import { getDashboardHomeForCurrentUser } from "../layout";

export default async function DashboardPage() {
  const destination = await getDashboardHomeForCurrentUser();
  redirect(destination);
}
