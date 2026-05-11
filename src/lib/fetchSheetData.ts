import {
  ResearchSpot,
  WorkSpot,
  NowSpot,
  SheetData,
} from './types';
import { groupProjects } from './groupData';

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || '';

function buildCsvUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

export async function fetchAllSheets(): Promise<SheetData> {
  if (!SHEET_ID) {
    return { research: [], works: [], now: [], projects: [] };
  }

  const [researchCsv, worksCsv, nowCsv] = await Promise.all([
    fetchCsv(buildCsvUrl('Research')),
    fetchCsv(buildCsvUrl('Works')),
    fetchCsv(buildCsvUrl('Now')),
  ]);

  const research = parseResearch(researchCsv);
  const works = parseWorks(worksCsv);
  const now = parseNow(nowCsv);
  const projects = groupProjects(research, works);

  return { research, works, now, projects };
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return res.text();
}

// CSV를 글자 단위로 파싱. quoted field 안의 줄바꿈("\n")도 cell 안에 그대로 보존.
// (시트 셀에서 줄바꿈 입력해도 행이 깨지지 않게 하기 위함.)
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          // escaped quote ""
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else if (ch === '\r') {
      // \r\n: 다음 \n에서 행 끝 처리. 단독 \r: 여기서 행 끝.
      if (csv[i + 1] === '\n') continue;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }

  return rows;
}

function parseRows(csv: string): Record<string, string>[] {
  const matrix = parseCsv(csv);
  if (matrix.length < 2) return [];

  const headers = matrix[0].map((h) => h.trim().toLowerCase());
  return matrix.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      // cell의 양끝 공백만 trim. 중간 줄바꿈은 보존.
      row[header] = (values[idx] || '').trim();
    });
    return row;
  });
}

function splitList(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

// Google Drive 공유 URL을 직접 접근 가능한 썸네일 URL로 변환
function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
  }
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w800`;
  }
  return url;
}

function isValidCoord(value: string): boolean {
  if (!value) return false;
  const n = parseFloat(value);
  return !isNaN(n) && isFinite(n);
}

function parseResearch(csv: string): ResearchSpot[] {
  return parseRows(csv)
    .filter((r) => r.research_id && isValidCoord(r.lat) && isValidCoord(r.lng))
    .map((r) => ({
      kind: 'research' as const,
      research_id: r.research_id,
      research_name: r.research_name,
      research_name_kr: r.research_name_kr,
      color: r.color,
      spot_order: parseInt(r.spot_order, 10) || 0,
      spot_name: r.spot_name,
      spot_name_kr: r.spot_name_kr,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      date_start: r.date_start,
      date_end: r.date_end,
      title: r.title,
      title_kr: r.title_kr,
      description: r.description,
      description_kr: r.description_kr,
      description_details: r.description_details,
      description_details_kr: r.description_details_kr,
      thumbnail_url: convertGoogleDriveUrl(r.thumbnail_url),
      image_urls: splitList(r.image_urls).map(convertGoogleDriveUrl),
      video_url: r.video_url,
      narrative_url: r.narrative_url,
      related_work_ids: splitList(r.related_work_ids),
    }));
}

function parseWorks(csv: string): WorkSpot[] {
  return parseRows(csv)
    .filter((r) => r.work_id && isValidCoord(r.lat) && isValidCoord(r.lng))
    .map((r) => ({
      kind: 'work' as const,
      work_id: r.work_id,
      research_id: r.research_id,
      color: r.color,
      spot_order: parseInt(r.spot_order, 10) || 0,
      spot_name: r.spot_name,
      spot_name_kr: r.spot_name_kr,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      date_start: r.date_start,
      date_end: r.date_end,
      title: r.title,
      title_kr: r.title_kr,
      venue: r.venue,
      venue_kr: r.venue_kr,
      description: r.description,
      description_kr: r.description_kr,
      description_details: r.description_details,
      description_details_kr: r.description_details_kr,
      thumbnail_url: convertGoogleDriveUrl(r.thumbnail_url),
      work_urls: splitList(r.work_urls).map(convertGoogleDriveUrl),
      exhibition_urls: splitList(r.exhibition_urls).map(convertGoogleDriveUrl),
      text_urls: splitList(r.text_urls),
      narrative_url: r.narrative_url,
      video_url: r.video_url,
    }));
}

function parseNow(csv: string): NowSpot[] {
  return parseRows(csv)
    .filter((r) => r.type && isValidCoord(r.lat) && isValidCoord(r.lng))
    .map((r) => ({
      kind: 'now' as const,
      type: r.type === 'current' ? 'current' : 'upcoming',
      color: r.color,
      spot_order: parseInt(r.spot_order, 10) || 0,
      spot_name: r.spot_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      date_start: r.date_start,
      date_end: r.date_end,
      title: r.title,
      title_kr: r.title_kr,
      venue: r.venue,
      venue_kr: r.venue_kr,
      description: r.description,
      description_kr: r.description_kr,
      thumbnail_url: convertGoogleDriveUrl(r.thumbnail_url),
      event_url: r.event_url,
      cv_url: r.cv_url,
      related_research_id: r.related_research_id,
      related_work_id: r.related_work_id,
      video_url: r.video_url,
    }));
}
