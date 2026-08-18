import { redirect } from "next/navigation";

// O hub de doação virou a home do site (decisão: doação no hero).
export default function DoacaoPage() {
  redirect("/");
}
