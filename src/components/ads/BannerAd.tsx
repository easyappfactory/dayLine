import { useCallback, useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

// 테스트용 배너 광고 ID. 운영 배포 시 운영 ID로 교체 필요.
const BANNER_AD_GROUP_ID = 'ait.v2.live.37f5a3ed5c374310';

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported] = useState<boolean>(() => TossAds.initialize.isSupported());

  useEffect(() => {
    if (isInitialized) return;
    if (!isSupported) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          setIsInitialized(true);
        },
      },
    });
  }, [isInitialized, isSupported]);

  const attachBanner = useCallback(
    (element: HTMLElement) => {
      if (!isInitialized) return;
      return TossAds.attachBanner(BANNER_AD_GROUP_ID, element, {
        theme: 'auto',
        tone: 'blackAndWhite',
        variant: 'expanded',
      });
    },
    [isInitialized],
  );

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;
    const attached = attachBanner(containerRef.current);
    return () => {
      attached?.destroy();
    };
  }, [isInitialized, attachBanner]);

  if (isSupported === false) {
    return (
      <div style={{ padding: '8px 24px 0' }}>
        <Text typography="t7" color={adaptive.grey500}>
          배너 광고를 지원하지 않는 앱 버전이에요.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 24px 0' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: '410px' }} />
    </div>
  );
}

