import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStampsStore } from '../../stores/stamps';
import { StampCard } from '../../components/StampCard';
import { QrDisplay } from '../../components/QrDisplay';
import { InstallPrompt } from '../../components/InstallPrompt';

export function CustomerHome() {
  const { customerId } = useParams<{ customerId: string }>();
  const { cardData, loading, error, fetchCard, fetchQr } = useStampsStore();

  useEffect(() => {
    if (customerId) {
      fetchCard(customerId);
      // Persist for PWA — cookie is shared between Safari and standalone mode
      document.cookie = `coffee-customerId=${customerId};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    }
  }, [customerId]);

  if (loading) {
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

  return (
    <div className="min-h-screen px-2 py-4 max-w-md mx-auto">
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
  );
}
