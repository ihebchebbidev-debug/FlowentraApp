import { useState, useEffect } from 'react';

export function useWaitingTime(lastMoved: Date | undefined) {
  const [waitingTime, setWaitingTime] = useState('');

  useEffect(() => {
    if (!lastMoved) return;

    const updateTime = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastMoved.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        setWaitingTime(`${diffDays}d ${diffHours % 24}h`);
      } else if (diffHours > 0) {
        setWaitingTime(`${diffHours}h ${diffMinutes % 60}m`);
      } else if (diffMinutes > 0) {
        setWaitingTime(`${diffMinutes}m`);
      } else {
        setWaitingTime('Just now');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastMoved]);

  return waitingTime;
}