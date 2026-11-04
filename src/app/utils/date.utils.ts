export function formatDateToDocName(date: Date = new Date()): string {
  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
}

// Inverse of formatDateToDocName; new Date('11-4-2026') is an Invalid Date in Safari.
export function docNameToDate(docName: string): Date {
  const [month, day, year] = docName.split('-').map(Number);
  return new Date(year, month - 1, day);
}
