const BLOOD_GROUP_MAP: Record<string, string> = {
  'o+': 'O+',
  'o-': 'O-',
  'a+': 'A+',
  'a-': 'A-',
  'b+': 'B+',
  'b-': 'B-',
  'ab+': 'AB+',
  'ab-': 'AB-',
  'o positive': 'O+',
  'o negative': 'O-',
  'a positive': 'A+',
  'a negative': 'A-',
  'b positive': 'B+',
  'b negative': 'B-',
  'ab positive': 'AB+',
  'ab negative': 'AB-',
  o: 'O+',
  a: 'A+',
  b: 'B+',
  ab: 'AB+',
};

export function normalizeBloodGroup(raw: string): string | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+-]/g, ' ')
    .replace(/\s+/g, ' ');
  const match = BLOOD_GROUP_MAP[cleaned];
  if (match) return match;
  if (/^(a|b|ab|o)[+-]$/i.test(cleaned.replace(/\s/g, '')))
    return cleaned.replace(/\s/g, '').toUpperCase();
  return null;
}

export function normalizePhoneNumber(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 10 && digits.startsWith('1')) return `+880${digits}`;
  if (digits.length === 11 && digits.startsWith('01')) return `+88${digits}`;
  if (digits.length === 13 && digits.startsWith('880')) return `+${digits}`;
  if (digits.length === 14 && digits.startsWith('00880'))
    return `+${digits.slice(2)}`;
  if (digits.length === 15 && digits.startsWith('00880'))
    return `+${digits.slice(2)}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function normalizeIdNumber(raw: string): string {
  return raw.replace(/[^0-9A-Za-z\-/]/g, '').trim();
}

export function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z\s.\-']/g, '')
    .trim();
}

export function normalizeDepartment(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').trim();
}

export function normalizeIssueDate(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9a-zA-Z/\-. ]/g, '').trim();
  const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [
      /^(\d{2})\s*[/\-. ]\s*(\d{2})\s*[/\-. ]\s*(\d{4})$/,
      (m) => {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return '';
        return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      },
    ],
    [
      /^(\d{4})\s*[/\-. ]\s*(\d{2})\s*[/\-. ]\s*(\d{2})$/,
      (m) => {
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return '';
        return `${m[1]}-${m[2]}-${m[3]}`;
      },
    ],
    [
      /^(\d{2})\s+(\w+)\s+(\d{4})$/i,
      (m) => {
        const months: Record<string, string> = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };
        const month = m[2].toLowerCase().slice(0, 3);
        return months[month]
          ? `${m[3]}-${months[month]}-${m[1].padStart(2, '0')}`
          : '';
      },
    ],
  ];
  for (const [regex, formatter] of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const formatted = formatter(match);
      if (formatted) return formatted;
    }
  }
  return null;
}