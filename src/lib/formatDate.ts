// 시작일과 종료일이 같으면 한 날짜만, 다르면 범위로 표시
export function formatDateRange(start: string, end: string): string {
  if (!start) return '';
  if (!end || start === end) return start;
  return `${start} — ${end}`;
}
