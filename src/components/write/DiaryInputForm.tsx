import { useState } from 'react';
import { TextField, Button, Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

interface DiaryInputFormProps {
  dateText: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasError: boolean;
  errorMessage: string | undefined;
  characterCount: string;
  hasTodayDiary: boolean;
  isSubmittable: boolean;
  isLoading: boolean;
  isChecking: boolean;
  onSubmit: () => void;
  submitLabel?: string;
}

// 랜덤 팁 문구 목록
const TIP_MESSAGES = [
  "💡 감정 단어를 사용하면 점수가 더 정확해져요",
  "💡 '기쁘다', '속상하다' 같은 감정을 직접 표현해보세요",
  "💡 오늘 기분을 솔직하게 표현할수록 좋아요",
  "💡 긍정/부정을 명확하게 표현하면 분석이 정확해져요",
  "💡 사건보다 느낌을 중심으로 쓰면 더 좋아요",
  "💡 짧아도 괜찮아요. 오늘의 감정만 담아보세요",
  "💡 '행복해', '힘들어' 같은 단어가 점수 정확도를 높여요",
  "💡 구체적인 감정 표현이 AI의 이해를 도와요",
];

// 랜덤 팁 선택 함수
const getRandomTip = () => {
  return TIP_MESSAGES[Math.floor(Math.random() * TIP_MESSAGES.length)];
};

export const DiaryInputForm = ({
  dateText,
  value,
  onChange,
  hasError,
  errorMessage,
  characterCount,
  hasTodayDiary,
  isSubmittable,
  isLoading,
  onSubmit,
  submitLabel,
}: DiaryInputFormProps) => {
  // 랜덤 팁 상태 (컴포넌트 마운트 시 랜덤 선택)
  const [tipMessage] = useState(getRandomTip);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <TextField.Clearable
          variant="box"
          hasError={hasError}
          label={`${dateText} 한 줄`}
          labelOption="sustain"
          value={value}
          onChange={onChange}
          placeholder={hasTodayDiary ? "오늘의 일기를 이미 작성했어요" : "50자 이내로 입력해주세요"}
          disabled={hasTodayDiary || isLoading}
          style={{ textAlign: 'left' }}
        />
        <div style={{ 
          margin: '0 22px 24px 0', 
          fontSize: '14px', 
          color: hasError ? '#f04452' : '#8b95a1',
          textAlign: 'right'
        }}>
          {hasTodayDiary ? '내일 또 만나요' : (errorMessage || characterCount)}
        </div>
        
        {!hasTodayDiary && (
          <div style={{ 
            margin: '0 0 16px 0',
            padding: '12px 16px',
            backgroundColor: adaptive.grey50,
            borderRadius: '8px',
          }}>
            <Text
              display="block"
              color={adaptive.grey500}
              typography="t7"
              fontWeight="regular"
              style={{ lineHeight: '1.5', textAlign: 'left' }}
            >
              {tipMessage}
            </Text>
          </div>
        )}
      </div>
      <Button 
        display="block" 
        disabled={(!hasTodayDiary && (!isSubmittable || isLoading))}
        onClick={onSubmit}
        variant={hasTodayDiary ? "weak" : "fill"}
        size="large"
        style={{ width: '100%' }}
      >
        {hasTodayDiary ? '그래프 확인하기' : (isLoading ? '분석하고 있어요' : (submitLabel ?? '작성하기'))}
      </Button>
    </div>
  );
};

