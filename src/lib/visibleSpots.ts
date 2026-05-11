import { ProjectGroup, ResearchSpot, WorkSpot, TabId } from './types';

// 활성 레이어 기준으로 한 프로젝트의 표시할 점들을 spot_order로 정렬해 반환.
// 예: Tab1만 켜면 Research만, Tab2만 켜면 Works만, 둘 다 켜면 Research+Works 통합.
export function getVisibleProjectSpots(
  group: ProjectGroup,
  layers: Record<TabId, boolean>
): (ResearchSpot | WorkSpot)[] {
  const spots: (ResearchSpot | WorkSpot)[] = [];
  if (layers.research) spots.push(...group.research_spots);
  if (layers.works) spots.push(...group.work_spots);
  return spots.sort((a, b) => a.spot_order - b.spot_order);
}
