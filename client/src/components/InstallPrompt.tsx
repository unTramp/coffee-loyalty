import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  // Standard check
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari check
  if ((navigator as any).standalone === true) return true;
  // User previously installed via our button
  if (localStorage.getItem('pwa-installed') === 'true') return true;
  return false;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install via browser
    const onInstall = () => {
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleIosInstallClick = () => {
    setShowIosHint(!showIosHint);
    // Mark as "reminded" — user will add manually
    localStorage.setItem('pwa-installed', 'true');
  };

  if (isInstalled) return null;

  const buttonStyle = {
    background: 'linear-gradient(135deg, #C9A84C, #D4AF37)',
  };

  // Android: real install button
  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="w-full py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-90"
        style={buttonStyle}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        Добавить на главный экран
      </button>
    );
  }

  // iOS: show instructions
  if (isIos) {
    return (
      <>
        <button
          onClick={handleIosInstallClick}
          className="w-full py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-90"
          style={buttonStyle}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          Добавить на главный экран
        </button>

        {showIosHint && (
          <div className="mt-3 bg-white border rounded-xl p-4 text-sm space-y-2 shadow-sm" style={{ borderColor: '#e5e5e0', color: '#4b5563' }}>
            <p className="font-semibold" style={{ color: '#1a1a1a' }}>Как установить:</p>
            <p>1. Нажмите <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              <svg className="w-4 h-4 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
              </svg>
            </span> (Поделиться) внизу Safari</p>
            <p>2. Пролистайте вниз</p>
            <p>3. Нажмите <strong>«На экран "Домой"»</strong></p>
          </div>
        )}
      </>
    );
  }

  return null;
}
