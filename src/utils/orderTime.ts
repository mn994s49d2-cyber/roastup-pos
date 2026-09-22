import { Order } from '../types';

/**
 * Format an ISO or Date string into UK 24h format (e.g. "14:26")
 */
export function formatOrderTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  // If it's already HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(isoString.trim())) {
    const [h, m] = isoString.trim().split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

/**
 * Format an ISO or Date string into full UK date & time (e.g. "21/09/2026, 14:26")
 */
export function formatOrderDateTime(isoString?: string | null): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return '--';
  }
}

/**
 * Determine service period: 'lunch' | 'afternoon' | 'dinner'
 */
export function resolveTimeOfDay(dueAtIsoOrDate?: string | Date | null): 'lunch' | 'afternoon' | 'dinner' {
  if (!dueAtIsoOrDate) return 'lunch';
  try {
    const d = typeof dueAtIsoOrDate === 'string' ? new Date(dueAtIsoOrDate) : dueAtIsoOrDate;
    const hour = d.getHours();
    if (hour < 14) return 'lunch';
    if (hour < 17) return 'afternoon';
    return 'dinner';
  } catch {
    return 'lunch';
  }
}

/**
 * Capitalize service period (e.g. "Dinner")
 */
export function formatTimeOfDayLabel(timeOfDay?: string | null): string {
  if (!timeOfDay) return 'Lunch';
  return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1).toLowerCase();
}

/**
 * Get formatted Placed Time string for an order
 */
export function getOrderPlacedTime(order?: Partial<Order> | null): string {
  if (!order) return '--:--';
  return formatOrderTime(order.placedAt || order.timestamp);
}

/**
 * Resolve the due timestamp (ISO string) for an order
 */
export function resolveOrderDueIso(order?: Partial<Order> | null, defaultLeadMinutes = 10): string {
  if (!order) return new Date().toISOString();
  if (order.dueAt) return order.dueAt;

  // If dueTime is an ISO string
  if (order.dueTime && order.dueTime.includes('T')) {
    return order.dueTime;
  }

  // If dueTime is HH:MM
  if (order.dueTime && /^\d{1,2}:\d{2}$/.test(order.dueTime.trim())) {
    const [h, m] = order.dueTime.trim().split(':').map(Number);
    const baseDate = new Date(order.placedAt || order.timestamp || Date.now());
    baseDate.setHours(h, m, 0, 0);
    return baseDate.toISOString();
  }
  
  const placedTimeMs = new Date(order.placedAt || order.timestamp || Date.now()).getTime();
  const lead = order.dueMinutes || (order.type === 'dine_in' ? 12 : defaultLeadMinutes);
  return new Date(placedTimeMs + lead * 60000).toISOString();
}

/**
 * Get formatted Due Time string for an order (e.g. "18:30")
 */
export function getOrderDueTime(order?: Partial<Order> | null, defaultLeadMinutes = 10): string {
  if (!order) return '--:--';
  if (order.dueTime && /^\d{1,2}:\d{2}$/.test(order.dueTime.trim())) {
    const [h, m] = order.dueTime.trim().split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  return formatOrderTime(resolveOrderDueIso(order, defaultLeadMinutes));
}

/**
 * Prepend [PRE-ORDER DUE: <time> (<period>)] to notes for thermal printer & kitchen tickets
 */
export function formatPreOrderNotes(
  existingNotes?: string | null,
  dueTimeStr = '18:30',
  timeOfDayStr = 'dinner'
): string {
  const cleanNotes = (existingNotes || '').trim();
  const tag = `[PRE-ORDER DUE: ${dueTimeStr} (${timeOfDayStr.toUpperCase()})]`;
  
  if (cleanNotes.includes('[PRE-ORDER DUE:')) {
    return cleanNotes;
  }
  return cleanNotes ? `${tag} ${cleanNotes}` : tag;
}

export interface DueStatus {
  label: string;
  isOverdue: boolean;
  minutesRemaining: number; // positive = future, negative = overdue
  diffMinutes: number; // alias for minutesRemaining
  urgency: 'normal' | 'soon' | 'fryer_prep' | 'hold' | 'overdue' | 'completed';
  status: 'normal' | 'soon' | 'fryer_prep' | 'hold' | 'overdue' | 'completed'; // alias for urgency
  badgeClass: string;
  isPreOrderAlert?: boolean;
}

/**
 * Compute the live due status and urgency styling
 */
export function getOrderDueStatus(
  order: Partial<Order>, 
  currentTime: Date = new Date(),
  defaultLeadMinutes = 10
): DueStatus {
  // If order is completed or bumped from both stations
  if (order.status === 'completed' || (order.kitchenBumped && order.fohBumped)) {
    return {
      label: 'Completed',
      isOverdue: false,
      minutesRemaining: 0,
      diffMinutes: 0,
      urgency: 'completed',
      status: 'completed',
      badgeClass: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
    };
  }

  if (order.status === 'ready') {
    return {
      label: 'Ready for Pickup',
      isOverdue: false,
      minutesRemaining: 0,
      diffMinutes: 0,
      urgency: 'normal',
      status: 'normal',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-black'
    };
  }

  const dueIso = resolveOrderDueIso(order, defaultLeadMinutes);
  const dueMs = new Date(dueIso).getTime();
  const diffMs = dueMs - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  // Overdue
  if (diffMinutes < 0) {
    const minsLate = Math.abs(diffMinutes);
    return {
      label: `${minsLate}m OVERDUE`,
      isOverdue: true,
      minutesRemaining: diffMinutes,
      diffMinutes,
      urgency: 'overdue',
      status: 'overdue',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-black animate-pulse'
    };
  }

  // Pre-Order Impending Prep Window (15 - 20 minutes before dueTime)
  // Alert the fryer and kitchen to start cooking!
  if (order.isPreOrder) {
    if (diffMinutes <= 20 && diffMinutes > 0) {
      return {
        label: `🔥 PREP NOW (Due ${diffMinutes}m)`,
        isOverdue: false,
        minutesRemaining: diffMinutes,
        diffMinutes,
        urgency: 'fryer_prep',
        status: 'fryer_prep',
        badgeClass: 'bg-amber-500 text-stone-950 border-amber-600 font-black animate-bounce shadow-md',
        isPreOrderAlert: true
      };
    } else if (diffMinutes === 0) {
      return {
        label: '🔥 DUE NOW',
        isOverdue: false,
        minutesRemaining: 0,
        diffMinutes: 0,
        urgency: 'soon',
        status: 'soon',
        badgeClass: 'bg-rose-500 text-white border-rose-600 font-black animate-pulse',
        isPreOrderAlert: true
      };
    } else {
      // Future Pre-order (holding)
      return {
        label: `🕒 Pre-Order (${diffMinutes}m)`,
        isOverdue: false,
        minutesRemaining: diffMinutes,
        diffMinutes,
        urgency: 'hold',
        status: 'hold',
        badgeClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold'
      };
    }
  }

  // Standard immediate orders
  if (diffMinutes === 0) {
    return {
      label: 'Due Now',
      isOverdue: false,
      minutesRemaining: 0,
      diffMinutes: 0,
      urgency: 'soon',
      status: 'soon',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-black'
    };
  }

  if (diffMinutes <= 4) {
    return {
      label: `Due in ${diffMinutes}m`,
      isOverdue: false,
      minutesRemaining: diffMinutes,
      diffMinutes,
      urgency: 'soon',
      status: 'soon',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold'
    };
  }

  return {
    label: `Due in ${diffMinutes}m`,
    isOverdue: false,
    minutesRemaining: diffMinutes,
    diffMinutes,
    urgency: 'normal',
    status: 'normal',
    badgeClass: 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 font-semibold'
  };
}
