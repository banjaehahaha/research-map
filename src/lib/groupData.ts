import { ResearchSpot, WorkSpot, ProjectGroup } from './types';

// "color" 컬럼은 한 행에 여러 색상이 쉼표로 들어올 수 있음 (중첩 프로젝트)
export function parseColors(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

// research_id를 키로 Research + Works를 한 그룹으로 묶고
// spot_order 기준으로 통합 정렬한 ordered_spots를 만들어 둔다
export function groupProjects(
  research: ResearchSpot[],
  works: WorkSpot[]
): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();

  for (const r of research) {
    if (!map.has(r.research_id)) {
      const colors = parseColors(r.color);
      map.set(r.research_id, {
        research_id: r.research_id,
        research_name: r.research_name,
        research_name_kr: r.research_name_kr,
        primary_color: colors[0] || '#888888',
        colors,
        research_spots: [],
        work_spots: [],
        ordered_spots: [],
      });
    }
    map.get(r.research_id)!.research_spots.push(r);
  }

  // Research가 없고 Works만 있는 research_id가 있을 수 있음 (드물지만 가능)
  for (const w of works) {
    if (!map.has(w.research_id)) {
      const colors = parseColors(w.color);
      map.set(w.research_id, {
        research_id: w.research_id,
        research_name: '',
        research_name_kr: '',
        primary_color: colors[0] || '#888888',
        colors,
        research_spots: [],
        work_spots: [],
        ordered_spots: [],
      });
    }
    map.get(w.research_id)!.work_spots.push(w);
  }

  for (const group of map.values()) {
    group.research_spots.sort((a, b) => a.spot_order - b.spot_order);
    group.work_spots.sort((a, b) => a.spot_order - b.spot_order);
    group.ordered_spots = [...group.research_spots, ...group.work_spots].sort(
      (a, b) => a.spot_order - b.spot_order
    );
  }

  return Array.from(map.values());
}
