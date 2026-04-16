import {
  Asset,
  Post,
  Paragraph,
  StepperRow,
  Stepper,
  Button,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { useLogin } from '../hooks/domain/auth/useLogin';

export default function Page() {
  const { handleLogin, isLoading } = useLogin();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Post.H2 paddingBottom={12} color={adaptive.grey800} aria-label="앱 설명">
      <div style={{ whiteSpace: 'nowrap' }}>
        <Paragraph.Text>오늘 한 줄로 감정을 돌아봐요</Paragraph.Text>
      </div>
      </Post.H2>
      <div>
        <>
          {/* 버튼으로 사용하는 경우 IconButton을 사용하거나 role="button"과
          aria-label 값을 작성해주세요 */}
          <Asset.Image
            frameShape={Asset.frameShape.CleanW100}
            backgroundColor="transparent"
            src="https://static.toss.im/2d-emojis/png/4x/u1F4DD.png"
            aria-hidden={true}
            style={{ aspectRatio: '1/1' }}
          />
        </>
      </div>
      <Post.H2 paddingBottom={8} textAlign="left">
        <Paragraph.Text>사용 방법</Paragraph.Text>
      </Post.H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Stepper staggerDelay={0}>
        <StepperRow
          left={<StepperRow.NumberIcon number={1} />}
          center={
            <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
              <StepperRow.Texts
                type="A"
                title="한 문장으로 오늘을 기록해요"
                description=""
              />
            </div>
          }
        />
        <StepperRow
          left={<StepperRow.NumberIcon number={2} />}
          center={
            <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
              <StepperRow.Texts
                type="A"
                title="광고를 보는 동안 AI가 감정을 분석해요"
                description=""
              />
            </div>
          }
        />
        <StepperRow
          left={<StepperRow.NumberIcon number={3} />}
          center={
            <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
              <StepperRow.Texts
                type="A"
                title="그래프로 감정 변화를 확인해요"
                description=""
              />
            </div>
          }
          hideLine={true}
        />
        </Stepper>
      </div>
      
      <Button display="block" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? '로그인하고 있어요' : '시작하기'}
      </Button>
    </div>
  );
}