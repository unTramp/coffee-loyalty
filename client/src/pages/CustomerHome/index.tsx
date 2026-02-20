import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useStampsStore } from '../../stores/stamps';
import { StampCard } from '../../components/StampCard';
import { QrDisplay } from '../../components/QrDisplay';
import { InstallPrompt } from '../../components/InstallPrompt';

const PULL_THRESHOLD = 80;

export function CustomerHome() {
  const { customerId } = useParams<{ customerId: string }>();
  const { cardData, loading, error, fetchCard, fetchQr } = useStampsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerId) {
      fetchCard(customerId);
      document.cookie = `coffee_cid=${customerId};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    }
  }, [customerId]);

  const handleRefresh = useCallback(async () => {
    if (!customerId || refreshing) return;
    setRefreshing(true);
    await fetchCard(customerId);
    setRefreshing(false);
  }, [customerId, refreshing, fetchCard]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current || refreshing) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      setPullY(Math.min(dy * 0.5, PULL_THRESHOLD + 20));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD) {
      handleRefresh();
    }
    setPullY(0);
    touchStartY.current = 0;
  }, [pullY, handleRefresh]);

  if (loading && !cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error || 'Карта не найдена'}</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Зарегистрируйтесь через Telegram-бота</p>
        </div>
      </div>
    );
  }

  const pulling = pullY > 0 || refreshing;
  const indicatorOpacity = refreshing ? 1 : Math.min(pullY / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-auto"
      style={{ overscrollBehavior: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: pulling ? Math.max(pullY, refreshing ? 48 : 0) : 0,
          opacity: indicatorOpacity,
          transition: pullY === 0 ? 'height 0.3s, opacity 0.3s' : 'none',
        }}
      >
        <div
          className={`w-6 h-6 border-2 border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`}
          style={{
            borderColor: '#C9A84C',
            borderTopColor: 'transparent',
            transform: refreshing ? undefined : `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)`,
          }}
        />
      </div>

      <div className="px-2 py-4 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-3xl font-bold tracking-wider" style={{ color: '#1a1a1a' }}>
            cultura
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.3em] mt-1 uppercase" style={{ color: '#9CA3AF' }}>
            Quality Street Coffee
          </p>
        </div>

        {/* QR Card */}
        <div className="mb-1">
          <QrDisplay customerId={customerId!} fetchQr={fetchQr} />
        </div>

        {/* Stamps */}
        <div className="mb-5 max-w-sm mx-auto mt-4">
          <StampCard
            stampCount={cardData.card?.stampCount ?? 0}
            stampGoal={cardData.stampGoal}
            totalRedeemed={cardData.card?.totalRedeemed ?? 0}
          />
        </div>

        {/* Free coffee counter */}
        <div className="text-center mb-5">
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
            Бесплатных кофе: <span className="font-bold" style={{ color: '#C9A84C' }}>{cardData.card?.totalRedeemed ?? 0}</span>
          </p>
        </div>

        {/* Install prompt */}
        <div className="mb-4">
          <InstallPrompt />
        </div>
      </div>
    </div>
  );
}
