// Research 시트 한 행
export interface ResearchSpot {
  kind: 'research';
  research_id: string;
  research_name: string;
  research_name_kr: string;
  color: string;
  spot_order: number;
  spot_name: string;
  spot_name_kr: string;
  lat: number;
  lng: number;
  date_start: string;
  date_end: string;
  title: string;
  title_kr: string;
  description: string;
  description_kr: string;
  description_details: string;
  description_details_kr: string;
  thumbnail_url: string;
  image_urls: string[];
  video_url: string;
  narrative_url: string;
  related_work_ids: string[];
}

// Works 시트 한 행
export interface WorkSpot {
  kind: 'work';
  work_id: string;
  research_id: string;
  color: string;
  spot_order: number;
  spot_name: string;
  spot_name_kr: string;
  lat: number;
  lng: number;
  date_start: string;
  date_end: string;
  title: string;
  title_kr: string;
  venue: string;
  venue_kr: string;
  description: string;
  description_kr: string;
  description_details: string;
  description_details_kr: string;
  thumbnail_url: string;
  work_urls: string[];
  exhibition_urls: string[];
  text_urls: string[];
  narrative_url: string;
  video_url: string;
}

// Now 시트 한 행
export interface NowSpot {
  kind: 'now';
  type: 'current' | 'upcoming';
  color: string;
  spot_order: number;
  spot_name: string;
  lat: number;
  lng: number;
  date_start: string;
  date_end: string;
  title: string;
  title_kr: string;
  venue: string;
  venue_kr: string;
  description: string;
  description_kr: string;
  thumbnail_url: string;
  event_url: string;
  cv_url: string;
  related_research_id: string;
  related_work_id: string;
  video_url: string;
}

export type AnySpot = ResearchSpot | WorkSpot | NowSpot;

// 한 프로젝트(research_id) 단위 그룹
// Research + Works를 spot_order로 통합 정렬한 결과 포함
export interface ProjectGroup {
  research_id: string;
  research_name: string;
  research_name_kr: string;
  primary_color: string;
  colors: string[];
  research_spots: ResearchSpot[];
  work_spots: WorkSpot[];
  ordered_spots: (ResearchSpot | WorkSpot)[];
}

// 전체 시트 데이터
export interface SheetData {
  research: ResearchSpot[];
  works: WorkSpot[];
  now: NowSpot[];
  projects: ProjectGroup[];
}

// 언어 토글
export type Language = 'en' | 'kr';

// 탭
export type TabId = 'research' | 'works' | 'now';
