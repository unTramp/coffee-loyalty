interface StampCardProps {
  stampCount: number;
  stampGoal: number;
  totalRedeemed: number;
}

export function StampCard({ stampCount, stampGoal, totalRedeemed }: StampCardProps) {
  const stamps = Array.from({ length: stampGoal }, (_, i) => i < stampCount);

  return (
    <div className="rounded-2xl px-5 py-3 shadow-md" style={{ background: 'linear-gradient(to bottom, #C2C78A 0%, #9DA25C 45%, #757B3E 100%)' }}>
      <div key={stampCount} className="flex justify-center gap-2 mb-2">
        {stamps.map((filled, i) => (
          <div
            key={i}
            className="relative"
            style={{
              width: `${100 / stampGoal - 2}%`,
              maxWidth: 56,
            }}
          >
            {filled && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
                  transform: 'scale(1.3)',
                }}
              />
            )}
            <img
              src="/cup-stamp.webp"
              alt={filled ? `Штамп ${i + 1}` : `Пусто ${i + 1}`}
              className={`w-full h-auto relative z-10 ${filled ? 'opacity-100' : 'opacity-25 grayscale'}`}
              draggable={false}
              style={filled ? { filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.7))' } : undefined}
            />
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          {stampCount === 0
            ? 'Начните собирать штампы!'
            : stampCount >= stampGoal
              ? '🎉 Бесплатный кофе!'
              : `${stampCount} из ${stampGoal} — ещё ${stampGoal - stampCount} до бесплатного`
          }
        </p>
      </div>
    </div>
  );
}
