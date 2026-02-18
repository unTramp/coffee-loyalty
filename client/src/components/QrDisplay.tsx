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
        const container = containerRef.current;
        const size = container ? Math.floor(container.offsetWidth) : 160;

        await QRCode.toCanvas(canvasRef.current, payload, {
          width: size * 2,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
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
      <div className="relative mx-auto w-full">
        <img
          src="/background.png"
          alt="Loyalty Card"
          className="w-full h-auto block"
          draggable={false}
        />
        {/* QR canvas — positioned exactly over the QR placeholder on the card */}
        <div
          ref={containerRef}
          className="absolute overflow-hidden"
          style={{
            top: '20%',
            left: '30.5%',
            width: '37%',
            bottom: '40%',
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

    </div>
  );
}
