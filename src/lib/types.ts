export interface SpotData {
  research_id: string;
  research_name: string;
  spot_order: number;
  spot_name: string;
  lat: number;
  lng: number;
  date_start: string;
  date_end: string;
  title: string;
  description: string;
  thumbnail_url: string;
  image_urls: string[];
  video_url: string;
  color: string; // 리서치 그룹별 선/마커 색상 (hex, 예: #2563eb)
  narrative_url: string; // 모달 푸터 - Narrative 버튼 링크
  work_url: string; // 모달 푸터 - Work 버튼 링크
  presentation_url: string; // 모달 푸터 - Presentation 버튼 링크
}

export interface ResearchGroup {
  research_id: string;
  research_name: string;
  color: string;
  spots: SpotData[];
}
