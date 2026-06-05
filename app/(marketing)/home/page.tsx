import { redirect } from "next/navigation";

/** Logged-in home lives on `/` — keep `/home` as a stable alias. */
export default function HomeAliasPage() {
  redirect("/");
}
