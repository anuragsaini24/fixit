import { useEffect, useRef } from 'react';
import { connectBookingSocket } from '../services/bookingSocket';

export function useBookingRealtime(onEvent, enabled = true) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled) return undefined;
    return connectBookingSocket((event) => handler.current?.(event));
  }, [enabled]);
}