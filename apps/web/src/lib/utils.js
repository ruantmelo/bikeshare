import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function statusLabel(status) {
  const map = {
    AVAILABLE: 'Disponível',
    RESERVED: 'Reservada',
    IN_USE: 'Em uso',
    ERROR: 'Erro',
    UNREGISTERED: 'Não registrada',
    available: 'Disponível',
    reserved: 'Reservada',
    in_use: 'Em uso',
    error: 'Erro',
    unregistered: 'Não registrada',
  }
  return map[status] || status
}
