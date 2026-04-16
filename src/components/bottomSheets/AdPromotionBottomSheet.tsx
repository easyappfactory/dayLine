import { BottomSheet, Button, Asset } from "@toss/tds-mobile";

interface AdPromotionBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

export const AdPromotionBottomSheet = ({
  open,
  onClose,
  onNavigate,
}: AdPromotionBottomSheetProps) => {
  return (
    <BottomSheet style={{ backgroundColor: "#fff" }}
      header={
        <BottomSheet.Header>
          광고를 보는 동안 AI가 감정을 분석해요
        </BottomSheet.Header>
      }
      open={open}
      onClose={onClose}
      cta={
        <BottomSheet.DoubleCTA
          leftButton={
            <Button variant="weak" onClick={onClose}>
              닫기
            </Button>
          }
          rightButton={<Button onClick={onNavigate}>이동하기</Button>}
        />
      }
    >
      <div style={{ height: `16px` }} />
      <div
        style={{
          display: `flex`,
          justifyContent: `center`,
          alignItems: `center`,
        }}
      >
        {/* <Post.Paragraph>저는 BottomSheet 내용이에요</Post.Paragraph> */}
        <Asset.Image
          frameShape={{ width: 200 }}
          src="https://static.toss.im/ml-product/tosst-inapp_h7gz099ss0c8g8d32ydsfd81.png"
          aria-hidden={true}
        />
      </div>
    </BottomSheet>
  );
};




