import { useState, useEffect } from 'react';

/**
 * Mobil cihazları tespit etmek için kullanılan hook
 * @param breakpoint Mobil cihaz için piksel genişliği eşiği (varsayılan: 768px)
 * @returns Cihazın mobil olup olmadığını belirten boolean değer
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // İlk yükleme sırasında ekran genişliğini kontrol et
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // İlk kontrol
    checkMobile();
    
    // Ekran boyutu değiştiğinde tekrar kontrol et
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

export default useMobile;
