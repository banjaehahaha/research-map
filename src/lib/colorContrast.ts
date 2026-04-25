// 배경 색상의 밝기에 따라 가독성 좋은 텍스트 색상을 반환한다.
// - 어두운 배경 → 흰색
// - 밝은 배경 → 어두운 회색
//
// YIQ 공식 기반 인지 밝기(perceived brightness):
//   brightness = (R*299 + G*587 + B*114) / 1000
// 0(검정) ~ 255(흰색). 임계값 160을 기준으로 밝은 색 판정.

const DARK_TEXT = '#1a1b1c';
const LIGHT_TEXT = '#ffffff';
const BRIGHTNESS_THRESHOLD = 160;

export function getContrastTextColor(bgColor: string): string {
  if (!bgColor) return LIGHT_TEXT;

  const hex = bgColor.replace('#', '').trim();
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) return LIGHT_TEXT;

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > BRIGHTNESS_THRESHOLD ? DARK_TEXT : LIGHT_TEXT;
}
