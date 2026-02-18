import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (data: string) => void;
  active: boolean;
}

export function Scanner({ onScan, active }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        setError('Не удалось запустить камеру. Разрешите доступ.');
        console.error(err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl p-3 mb-4 text-center text-sm">
          {error}
        </div>
      )}
      <div
        id="qr-reader"
        ref={containerRef}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
}
