import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setOfflineBanner } from '../store/slices/uiSlice';
import toast from 'react-hot-toast';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      dispatch(setOfflineBanner(false));
      toast.success('Back online — syncing your files');
    };

    const handleOffline = () => {
      setIsOnline(false);
      dispatch(setOfflineBanner(true));
      toast.error('You are offline', { duration: Infinity, id: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return isOnline;
};
