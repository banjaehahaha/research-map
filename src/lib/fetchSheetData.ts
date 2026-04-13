import { SpotData } from './types';

// Google Sheets를 "웹에 게시(CSV)"한 URL에서 데이터 가져오기
// 사용법: Google Sheets > 파일 > 웹에 게시 > CSV 형식 선택 > 게시
// 또는 시트 ID로 직접 URL 구성:
// https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv

export async function fetchSheetData(csvUrl: string): Promise<SpotData[]> {
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText);
}

function parseCSV(csv: string): SpotData[] {
  const lines = csv.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  // 헤더 파싱
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  const spots: SpotData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });

    // 필수 필드 확인
    if (!row.research_id || !row.lat || !row.lng) continue;

    spots.push({
      research_id: row.research_id,
      research_name: row.research_name || '',
      spot_order: parseInt(row.spot_order, 10) || 1,
      spot_name: row.spot_name || '',
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      date_start: row.date_start || row.date || '',
      date_end: row.date_end || row.date_start || row.date || '',
      title: row.title || row.spot_name || '',
      description: row.description || '',
      thumbnail_url: convertGoogleDriveUrl(row.thumbnail_url || ''),
      image_urls: (row.image_urls || '')
        .split(',')
        .map((url) => convertGoogleDriveUrl(url.trim()))
        .filter((url) => url !== ''),
      video_url: row.video_url || '',
      color: row.color || '',
    });
  }

  return spots;
}

// CSV 한 줄 파싱 (따옴표 안의 쉼표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // 이스케이프된 따옴표
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

// Google Drive 공유 URL을 직접 이미지 URL로 변환
// https://drive.google.com/file/d/{FILE_ID}/view → 직접 접근 URL
function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';

  // Google Drive file URL
  const driveMatch = url.match(
    /drive\.google\.com\/file\/d\/([^/]+)/
  );
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
  }

  // Google Drive open URL
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w800`;
  }

  return url;
}
