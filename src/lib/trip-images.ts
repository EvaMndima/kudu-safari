import serengeti from "@/assets/trip-serengeti.jpg";
import ngorongoro from "@/assets/trip-ngorongoro.jpg";
import mara from "@/assets/trip-mara.jpg";

export const tripImages: Record<string, string> = {
  serengeti,
  ngorongoro,
  mara,
};

export function tripImage(key: string): string {
  return tripImages[key] ?? serengeti;
}

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
