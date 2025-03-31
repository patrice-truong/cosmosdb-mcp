import { redirect } from "next/navigation";

export default function Home() {
  redirect("http://localhost:3002/products");
}
