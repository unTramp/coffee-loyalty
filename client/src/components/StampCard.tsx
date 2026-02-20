interface StampCardProps {
  stampCount: number;
  stampGoal: number;
  totalRedeemed: number;
}

export function StampCard({ stampCount, stampGoal, totalRedeemed }: StampCardProps) {
  const stamps = Array.from({ length: stampGoal }, (_, i) => i < stampCount);

  return (
    <div className="rounded-2xl px-5 py-3 shadow-md" style={{ background: 'linear-gradient(to bottom, #C2C78A 0%, #9DA25C 45%, #757B3E 100%)' }}>
      <div className="flex justify-center gap-2 mb-2">
        {stamps.map((filled, i) => (
          <div
            key={i}
            className="transition-all duration-300"
            style={{
              width: `${100 / stampGoal - 2}%`,
              maxWidth: 56,
            }}
          >
            <img
              src="/cup-stamp.png"
              alt={filled ? `Штамп ${i + 1}` : `Пусто ${i + 1}`}
              className="w-full h-auto transition-all duration-300"
              draggable={false}
              style={
                filled
                  ? { filter: 'drop-shadow(0 2px 6px rgba(201, 168, 76, 0.5))' }
                  : { filter: 'grayscale(100%) opacity(0.25)' }
              }
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
