import { AnySpot, SheetData, TabId } from './types';

// 좌표 동등 비교 허용오차 (소수점 5자리 이상까진 같은 점으로 판단)
const COORD_EPS = 1e-4;

function sameLatLng(a: AnySpot, b: AnySpot): boolean {
  return (
    Math.abs(a.lat - b.lat) < COORD_EPS &&
    Math.abs(a.lng - b.lng) < COORD_EPS
  );
}

// 클릭한 spot과 같은 좌표(또는 매우 근접)에 있고 활성 레이어에 속한 모든 spot 반환.
// 자기 자신 포함.
export function findStackedSpots(
  target: AnySpot,
  data: SheetData,
  layers: Record<TabId, boolean>
): AnySpot[] {
  const stacked: AnySpot[] = [];
  if (layers.research) {
    for (const r of data.research) if (sameLatLng(r, target)) stacked.push(r);
  }
  if (layers.works) {
    for (const w of data.works) if (sameLatLng(w, target)) stacked.push(w);
  }
  if (layers.now) {
    for (const n of data.now) if (sameLatLng(n, target)) stacked.push(n);
  }
  return stacked;
}
