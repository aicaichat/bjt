import { useState, useEffect } from 'react';
import { getPendingUsersCount } from '../../services/registrationService';

export const usePendingUsersCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const pendingCount = await getPendingUsersCount();
      setCount(pendingCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取待审核用户数量失败');
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // 设置定时器，每30秒更新一次数量
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    count,
    loading,
    error,
    refetch: fetchCount
  };
}; 