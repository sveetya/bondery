import { PUBLIC_ROADMAP_PLANE_URL } from "@bondery/helpers";
import { redirect } from "next/navigation";

export function GET() {
  redirect(PUBLIC_ROADMAP_PLANE_URL);
}
