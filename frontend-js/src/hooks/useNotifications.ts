import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export interface UnreadMessage {
  id: number
  body: string
  sender_id: number
  sender_name: string
  sender_email: string
  created_at: string
}

const POLL_INTERVAL = 5000 // 5 seconds

/**
 * Browser notification permission request karo
 */
export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  
  // Ask permission (aligned with user snippet)
  return Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission)
    return permission === 'granted'
  })
}

/**
 * Browser desktop notification dikhao
 */
function showNotification(senderName: string, message: string, onClick?: () => void) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const notif = new Notification(`New Message from ${senderName}`, {
    body: message.length > 80 ? message.slice(0, 77) + '...' : message,
    icon: '/logo.png', // Fallback to favicon if logo missing
    tag: `dm-${senderName}`,      // same tag = replaces previous from same sender
    // @ts-ignore
    renotify: true,
    silent: false,
  })
  notif.onclick = () => {
    window.focus()
    notif.close()
    onClick?.()
  }
  // Auto-close after 6 seconds
  setTimeout(() => notif.close(), 6000)
}

function playNotificationSound() {
  try {
    // A tiny base64 encoded beep sound (100ms) to avoid needing external files
    const beep = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'A'.repeat(50)
    const audio = new Audio(beep) 
    audio.volume = 0.5
    // Some browsers block audio if user hasn't interacted, catch it
    audio.play().catch(() => {})
  } catch (e) {}
}

/**
 * useNotifications hook — background poll karta hai unread messages ke liye
 * aur browser + in-app notifications dikhata hai.
 *
 * @param activePeerId — agar user already kisi ke saath chat kar raha hai, uski id (skip notification)
 * @param onNewMessage — callback when new message arrives: { sender, openChat }
 */
export function useNotifications(
  activePeerId: number | null,
  onNewMessage: (msg: UnreadMessage) => void
) {
  const { user } = useAuth()
  const seenIds = useRef<Set<number>>(new Set())
  const permissionGranted = useRef(false)

  // Permission request on mount (once user is logged in)
  useEffect(() => {
    if (!user) return
    requestPermission().then(granted => {
      permissionGranted.current = granted
    })
  }, [user])

  const poll = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/dm/unread', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
      if (!res.ok) return
      const data = await res.json()
      const messages: UnreadMessage[] = data.messages ?? []

      for (const msg of messages) {
        if (seenIds.current.has(msg.id)) continue
        seenIds.current.add(msg.id)

        // Agar user already us sender ke saath chat window mein hai → skip browser notif
        const isActivePeer = activePeerId === msg.sender_id
        if (!isActivePeer) {
          // Show notification when a new message arrives (aligned with socket.on concept)
          showNotification(msg.sender_name, msg.body, () => {
            window.dispatchEvent(new CustomEvent('open-user-chat', {
              detail: {
                id: msg.sender_id,
                name: msg.sender_name,
                email: msg.sender_email,
              }
            }))
          })
          playNotificationSound()
          onNewMessage(msg)
        }
      }
    } catch {
      // silent
    }
  }, [user, activePeerId, onNewMessage])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(poll, POLL_INTERVAL)
    // First poll immediately
    poll()
    return () => clearInterval(interval)
  }, [user, poll])
}
