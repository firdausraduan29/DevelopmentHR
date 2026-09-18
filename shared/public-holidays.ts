export type PublicHoliday = {
  date: string;
  name: string;
};

// Emergency 2026 holiday list.
// More federal and state-specific holidays can be added later.
export const PUBLIC_HOLIDAYS: PublicHoliday[] = [
  {
    date: "2026-08-25",
    name: "Maulidur Rasul",
  },
  {
    date: "2026-08-31",
    name: "National Day",
  },
];

const publicHolidayByDate = new Map(
  PUBLIC_HOLIDAYS.map((holiday) => [holiday.date, holiday])
);

function toMalaysiaDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyToUtcDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function getDateKeysInRange(
  start: Date | string,
  end: Date | string
): string[] {
  const startKey = toMalaysiaDateKey(start);
  const endKey = toMalaysiaDateKey(end);

  const cursor = dateKeyToUtcDate(startKey);
  const finalDate = dateKeyToUtcDate(endKey);

  if (cursor.getTime() > finalDate.getTime()) {
    return [];
  }

  const dateKeys: string[] = [];

  while (cursor.getTime() <= finalDate.getTime()) {
    dateKeys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateKeys;
}

function isWeekendDateKey(dateKey: string): boolean {
  const day = dateKeyToUtcDate(dateKey).getUTCDay();
  return day === 0 || day === 6;
}

export function getPublicHolidaysInRange(
  start: Date | string,
  end: Date | string
): PublicHoliday[] {
  return getDateKeysInRange(start, end)
    .map((dateKey) => publicHolidayByDate.get(dateKey))
    .filter((holiday): holiday is PublicHoliday => Boolean(holiday));
}

export function countChargeableLeaveDays(
  start: Date | string,
  end: Date | string,
  includesWeekends: boolean
): number {
  return getDateKeysInRange(start, end).filter((dateKey) => {
    if (publicHolidayByDate.has(dateKey)) {
      return false;
    }

    if (!includesWeekends && isWeekendDateKey(dateKey)) {
      return false;
    }

    return true;
  }).length;
}
