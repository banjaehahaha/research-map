import { SpotData, ResearchGroup } from './types';

export function groupByResearch(spots: SpotData[]): ResearchGroup[] {
  const map = new Map<string, ResearchGroup>();

  for (const spot of spots) {
    if (!map.has(spot.research_id)) {
      map.set(spot.research_id, {
        research_id: spot.research_id,
        research_name: spot.research_name,
        color: spot.color,
        spots: [],
      });
    }
    map.get(spot.research_id)!.spots.push(spot);
  }

  // 각 그룹 내 스팟을 순서대로 정렬
  for (const group of map.values()) {
    group.spots.sort((a, b) => a.spot_order - b.spot_order);
  }

  return Array.from(map.values());
}
