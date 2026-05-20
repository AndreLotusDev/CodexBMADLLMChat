// Shared utilities
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildAnnotationKey(
  schemaName: string,
  tableName: string,
  columnName: string | null,
): string {
  return `${schemaName}.${tableName}.${columnName ?? ''}`
}
