/**
 * Native Haptics with Web fallback.
 * Uses Capacitor Haptics if available, otherwise navigator.vibrate.
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticLight() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
}

export async function hapticMedium() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  }
}

export async function hapticHeavy() {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    if ('vibrate' in navigator) {
      navigator.vibrate([40, 30, 40]);
    }
  }
}

export async function hapticSuccess() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 40]);
    }
  }
}
