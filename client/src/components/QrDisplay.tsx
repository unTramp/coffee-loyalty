import { useEffect, useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

interface QrDisplayProps {
  customerId: string;
  fetchQr: (id: string) => Promise<string>;
}

export function QrDisplay({ customerId, fetchQr }: QrDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const generateQr = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchQr(customerId);
      if (canvasRef.current) {
        // Measure the QR overlay container to get exact pixel size
        const container = containerRef.current;
        const size = container ? Math.floor(container.offsetWidth) : 160;

        await QRCode.toCanvas(canvasRef.current, payload, {
          width: size * 2, // 2x for retina
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        // Display at 1x size via CSS
        canvasRef.current.style.width = size + 'px';
        canvasRef.current.style.height = size + 'px';
      }
      setTimeLeft(30);
    } catch (err) {
      setError('Ошибка генерации QR');
    }
  }, [customerId, fetchQr]);

  useEffect(() => {
    generateQr();
    const interval = setInterval(generateQr, 30_000);
    return () => clearInterval(interval);
  }, [generateQr]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Card with QR overlay */}
      <div className="relative mx-auto" style={{ width: '70vw', maxWidth: 300, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2)) drop-shadow(0 8px 16px rgba(0,0,0,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>
        <img
          src="/card-bg.png"
          alt="Loyalty Card"
          className="w-full h-auto block"
          draggable={false}
          style={{
            borderRadius: '38px 38px 46px 46px',
            clipPath: 'inset(0 1px 0 1px round 38px 38px 46px 46px)',
          }}
        />
        {/* QR canvas — positioned exactly over the QR placeholder on the card */}
        <div
          ref={containerRef}
          className="absolute overflow-hidden"
          style={{
            top: '19%',
            left: '16%',
            width: '68%',
            bottom: '28.5%',
          }}
        >
          {error ? (
            <div className="w-full h-full flex items-center justify-center text-red-500 text-sm text-center">
              {error}
            </div>
          ) : (
            <canvas ref={canvasRef} className="block" />
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="mt-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#C9A84C' }} />
        <span className="text-xs" style={{ color: '#9CA3AF' }}>
          Обновится через {timeLeft}с
        </span>
      </div>
    </div>
  );
}
