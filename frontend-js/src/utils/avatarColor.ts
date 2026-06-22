/**
 * User ke naam/email ke basis pe ek consistent avatar background color return karta hai.
 * Har user ka alag aur consistent color hoga.
 */

const AVATAR_COLORS = [
  { bg: '#e67e22', text: '#000' }, // orange
  { bg: '#8e44ad', text: '#fff' }, // purple
  { bg: '#2980b9', text: '#fff' }, // blue
  { bg: '#27ae60', text: '#fff' }, // green
  { bg: '#c0392b', text: '#fff' }, // red
  { bg: '#16a085', text: '#fff' }, // teal
  { bg: '#d35400', text: '#fff' }, // dark orange
  { bg: '#2c3e50', text: '#fff' }, // dark blue-gray
  { bg: '#f39c12', text: '#000' }, // yellow
  { bg: '#1abc9c', text: '#000' }, // emerald
  { bg: '#6c5ce7', text: '#fff' }, // violet
  { bg: '#e84393', text: '#fff' }, // pink
]

export function getAvatarColor(name: string): { bg: string; text: string } {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function getAvatarInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '?'
}
