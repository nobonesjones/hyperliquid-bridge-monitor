import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString()
}

export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}
