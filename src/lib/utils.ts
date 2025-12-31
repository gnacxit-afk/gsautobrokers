import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBonus(sales: number): number {
  if (sales >= 15) return 450;
  if (sales >= 10) return 250;
  if (sales >= 5) return 100;
  return 0;
}

export function getNextBonusGoal(sales: number): { nextGoal: number, needed: number } {
  if (sales < 5) return { nextGoal: 5, needed: 5 - sales };
  if (sales < 10) return { nextGoal: 10, needed: 10 - sales };
  if (sales < 15) return { nextGoal: 15, needed: 15 - sales };
  return { nextGoal: 15, needed: 0 };
}
