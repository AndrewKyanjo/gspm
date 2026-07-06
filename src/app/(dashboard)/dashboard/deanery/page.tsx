import { redirect } from "next/navigation";

export default async function DeaneryIndexPage() {
  redirect("/dashboard/deanery/dashboard");
}
