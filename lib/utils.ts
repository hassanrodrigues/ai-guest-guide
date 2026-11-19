import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "+5592900000001" -> "+55 92 90000-0001". Leaves other formats untouched. */
export function formatPhone(phone: string): string {
  const match = phone.match(/^\+55(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `+55 ${match[1]} ${match[2]}-${match[3]}` : phone;
}
