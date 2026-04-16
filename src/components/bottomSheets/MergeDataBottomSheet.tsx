import { useState } from 'react';
import { BottomSheet, Button, Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { mergeDataWithToss } from '../../services/tossAuth';

interface MergeDataBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MergeDataBottomSheet = ({
  open,
  onClose,
  onSuccess,
}: MergeDataBottomSheetProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMerge = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await mergeDataWithToss();

      if (result === 'ALREADY_MAPPED') {
        alert('이미 연동된 계정이거나 신규 계정입니다.');
        onClose();
        return;
      }

      alert('기존 데이터를 성공적으로 불러왔어요.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('데이터 병합 실패:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : '데이터 불러오기에 실패했어요. 다시 시도해주세요.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet
      style={{ backgroundColor: '#fff' }}
      header={
        <BottomSheet.Header>기존 한 줄 일기 불러오기</BottomSheet.Header>
      }
      open={open}
      onClose={onClose}
      cta={
        <BottomSheet.DoubleCTA
          leftButton={
            <Button variant="weak" onClick={onClose} disabled={isLoading}>
              닫기
            </Button>
          }
          rightButton={
            <Button onClick={handleMerge} loading={isLoading}>
              {isLoading ? '불러오는 중...' : '불러오기'}
            </Button>
          }
        />
      }
    >
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Text
          display="block"
          color={adaptive.grey800}
          typography="t5"
          fontWeight="regular"
        >
          처음 사용하시는 분은 누르지 않아도 돼요.
        </Text>
        <Text
          display="block"
          color={adaptive.grey600}
          typography="t5"
          fontWeight="regular"
        >
          이전에 기록했던 일기가 있다면 아래 버튼을 눌러서 불러올 수 있어요. 
        </Text>
      </div>
    </BottomSheet>
  );
};
