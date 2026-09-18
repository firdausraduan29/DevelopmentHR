import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type KaShiftKey = "morning" | "afternoon" | "night";

type ShiftScheduleDay = {
  day: string;
  date: string;
  scheduleDate: string;
  weekStartDate: string;
  extraDuty: string;
  secondaryDuty: string;
  offLeave: string;
  notes: string;
} & Record<KaShiftKey, string[]>;

type ShiftScheduleApiRow = {
  id?: number;
  weekStartDate: string;
  scheduleDate: string;
  dayName: string;
  morningStaff: string;
  afternoonStaff: string;
  nightStaff: string;
  extraDuty: string;
  secondaryDuty: string;
  offLeave: string;
  notes: string;
};

type KaEditForm = {
  morning: string;
  afternoon: string;
  night: string;
  extraDuty: string;
  secondaryDuty: string;
  offLeave: string;
  notes: string;
};

const DEFAULT_WEEK_START_DATE = "2026-07-06";

const kaShiftRows: { key: KaShiftKey; label: string; time: string }[] = [
  { key: "morning", label: "Morning", time: "7:00 AM - 3:00 PM" },
  { key: "afternoon", label: "Afternoon", time: "3:00 PM - 11:00 PM" },
  { key: "night", label: "Night", time: "11:00 PM - 7:00 AM" },
];

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function joinStaff(names: string[]) {
  return names.join(", ");
}

function splitStaff(value: string) {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function addDays(dateValue: string, daysToAdd: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function isMondayDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getDay() === 1;
}

function createBlankWeekSchedule(weekStartDate: string): ShiftScheduleDay[] {
  return dayNames.map((dayName, index) => {
    const scheduleDate = addDays(weekStartDate, index);

    return {
      day: dayName,
      date: formatDisplayDate(scheduleDate),
      scheduleDate,
      weekStartDate,
      morning: [],
      afternoon: [],
      night: [],
      extraDuty: "-",
      secondaryDuty: "-",
      offLeave: "-",
      notes: "-",
    };
  });
}

function getWeekLabel(schedule: ShiftScheduleDay[]) {
  if (schedule.length === 0) return "-";
  return `${schedule[0].date} - ${schedule[schedule.length - 1].date}`;
}

function isWeekend(day: ShiftScheduleDay) {
  return day.day === "Saturday" || day.day === "Sunday";
}

function getExtraDutyLabel(day: ShiftScheduleDay) {
  return isWeekend(day) ? "Cleaning / Buang Sampah" : "Extra Duty";
}

function getExtraDutyTime(day: ShiftScheduleDay) {
  return isWeekend(day) ? "7:00 AM - 10:00 AM" : "10:00 AM - 6:00 PM";
}

function mapApiRowToScheduleDay(row: ShiftScheduleApiRow): ShiftScheduleDay {
  return {
    day: row.dayName,
    date: formatDisplayDate(row.scheduleDate),
    scheduleDate: row.scheduleDate.slice(0, 10),
    weekStartDate: row.weekStartDate.slice(0, 10),
    morning: splitStaff(row.morningStaff),
    afternoon: splitStaff(row.afternoonStaff),
    night: splitStaff(row.nightStaff),
    extraDuty: row.extraDuty || "-",
    secondaryDuty: row.secondaryDuty || "-",
    offLeave: row.offLeave || "-",
    notes: row.notes || "-",
  };
}

const stationStaff = [
  "Employee A",
  "Employee B",
  "Employee C",
  "Employee D",
  "Employee E",
  "Employee F",
  "Employee G",
  "Employee H",
];

const secondaryDutyStaff = [
  "Employee A",
  "Employee C",
  "Employee E",
  "Employee G",
];

const specialDutyStaffName = "Employee H";

type DutyKey =
  | "morning"
  | "afternoon"
  | "night"
  | "extraDuty"
  | "secondaryDutyMorning"
  | "secondaryDutyAfternoon"
  | "total";

type DutyCounts = Record<string, Record<DutyKey, number>>;

function createDutyCounts(staffNames: string[]) {
  return staffNames.reduce((counts, staffName) => {
    counts[staffName] = {
      morning: 0,
      afternoon: 0,
      night: 0,
      extraDuty: 0,
      secondaryDutyMorning: 0,
      secondaryDutyAfternoon: 0,
      total: 0,
    };

    return counts;
  }, {} as DutyCounts);
}

function addDutyCount(counts: DutyCounts, staffName: string, dutyKey: DutyKey) {
  if (!counts[staffName]) return;

  counts[staffName][dutyKey] += 1;
  counts[staffName].total += 1;
}

function findStaffInText(value: string, staffNames: string[]) {
  const lowerValue = value.toLowerCase();

  return staffNames.filter((staffName) =>
    lowerValue.includes(staffName.toLowerCase())
  );
}

function buildStationDutyCounts(sourceSchedule: ShiftScheduleDay[]) {
  const counts = createDutyCounts(stationStaff);

  sourceSchedule.forEach((day) => {
    day.morning.forEach((staffName) => addDutyCount(counts, staffName, "morning"));
    day.afternoon.forEach((staffName) => addDutyCount(counts, staffName, "afternoon"));
    day.night.forEach((staffName) => addDutyCount(counts, staffName, "night"));

    findStaffInText(day.extraDuty, stationStaff).forEach((staffName) =>
      addDutyCount(counts, staffName, "extraDuty")
    );
  });

  return counts;
}

function buildSecondaryDutyCounts(sourceSchedule: ShiftScheduleDay[]) {
  const counts = createDutyCounts(secondaryDutyStaff);

  sourceSchedule.forEach((day) => {
    secondaryDutyStaff.forEach((staffName) => {
      const secondaryDutyValue = day.secondaryDuty.toLowerCase();
      const staffNameValue = staffName.toLowerCase();

      if (!secondaryDutyValue.includes(staffNameValue)) return;

      if (secondaryDutyValue.includes(`${staffNameValue} (pagi)`)) {
        addDutyCount(counts, staffName, "secondaryDutyMorning");
      } else if (secondaryDutyValue.includes(`${staffNameValue} (petang)`)) {
        addDutyCount(counts, staffName, "secondaryDutyAfternoon");
      } else {
        addDutyCount(counts, staffName, "total");
      }
    });
  });

  return counts;
}

function pickStaff(
  staffNames: string[],
  counts: DutyCounts,
  dutyKey: DutyKey,
  usedStaff: Set<string>
) {
  const availableStaff = staffNames.filter((staffName) => !usedStaff.has(staffName));

  const sortedStaff = availableStaff.sort((a, b) => {
    const dutyDifference = counts[a][dutyKey] - counts[b][dutyKey];
    if (dutyDifference !== 0) return dutyDifference;

    const totalDifference = counts[a].total - counts[b].total;
    if (totalDifference !== 0) return totalDifference;

    return a.localeCompare(b);
  });

  const selectedStaff = sortedStaff[0];

  if (selectedStaff) {
    usedStaff.add(selectedStaff);
    addDutyCount(counts, selectedStaff, dutyKey);
  }

  return selectedStaff;
}

function pickMultipleStaff(
  staffNames: string[],
  counts: DutyCounts,
  dutyKey: DutyKey,
  usedStaff: Set<string>,
  amount: number
) {
  const selectedStaff: string[] = [];

  for (let i = 0; i < amount; i += 1) {
    const staffName = pickStaff(staffNames, counts, dutyKey, usedStaff);
    if (staffName) selectedStaff.push(staffName);
  }

  return selectedStaff;
}

function copyScheduleToWeek(
  sourceSchedule: ShiftScheduleDay[],
  targetWeekStartDate: string
): ShiftScheduleDay[] {
  return dayNames.map((dayName, index) => {
    const sourceDay = sourceSchedule[index];
    const scheduleDate = addDays(targetWeekStartDate, index);

    return {
      day: dayName,
      date: formatDisplayDate(scheduleDate),
      scheduleDate,
      weekStartDate: targetWeekStartDate,
      morning: sourceDay ? [...sourceDay.morning] : [],
      afternoon: sourceDay ? [...sourceDay.afternoon] : [],
      night: sourceDay ? [...sourceDay.night] : [],
      extraDuty: sourceDay?.extraDuty || "-",
      secondaryDuty: sourceDay?.secondaryDuty || "-",
      offLeave: sourceDay?.offLeave || "-",
      notes: sourceDay?.notes || "-",
    };
  });
}

function autoGenerateScheduleFromPreviousWeek(
  sourceSchedule: ShiftScheduleDay[],
  targetWeekStartDate: string
): ShiftScheduleDay[] {
  const stationCounts = buildStationDutyCounts(sourceSchedule);
  const secondaryDutyCounts = buildSecondaryDutyCounts(sourceSchedule);

  return dayNames.map((dayName, index) => {
    const scheduleDate = addDays(targetWeekStartDate, index);
    const usedStationStaff = new Set<string>();

    const stationStaffWithoutRosli = stationStaff.filter(
      (staffName) => staffName !== specialDutyStaffName
    );

    let extraDuty = "-";

    if (index <= 4) {
      const extraDutyStaff = pickStaff(
        stationStaffWithoutRosli,
        stationCounts,
        "extraDuty",
        usedStationStaff
      );

      extraDuty = extraDutyStaff || "-";
    } else {
      const cleaningStaff = pickStaff(
        stationStaffWithoutRosli,
        stationCounts,
        "extraDuty",
        usedStationStaff
      );

      extraDuty = cleaningStaff || "-";
    }

    const morning = pickMultipleStaff(
      stationStaffWithoutRosli,
      stationCounts,
      "morning",
      usedStationStaff,
      2
    );

    const afternoon = pickMultipleStaff(
      stationStaffWithoutRosli,
      stationCounts,
      "afternoon",
      usedStationStaff,
      2
    );

    const night = [specialDutyStaffName];

    usedStationStaff.add(specialDutyStaffName);
    addDutyCount(stationCounts, specialDutyStaffName, "night");

    const secondNightStaff = pickStaff(
      stationStaffWithoutRosli,
      stationCounts,
      "night",
      usedStationStaff
    );

    if (secondNightStaff) {
      night.push(secondNightStaff);
    }

    const usedSecondaryDutyStaff = new Set<string>();

    const secondaryDutyMorning = pickStaff(
      secondaryDutyStaff,
      secondaryDutyCounts,
      "secondaryDutyMorning",
      usedSecondaryDutyStaff
    );

    const secondaryDutyAfternoon = pickStaff(
      secondaryDutyStaff,
      secondaryDutyCounts,
      "secondaryDutyAfternoon",
      usedSecondaryDutyStaff
    );

    const secondaryDuty = [
      secondaryDutyMorning ? `${secondaryDutyMorning} (PAGI)` : "",
      secondaryDutyAfternoon ? `${secondaryDutyAfternoon} (PETANG)` : "",
    ]
      .filter(Boolean)
      .join("\n") || "-";

    return {
      day: dayName,
      date: formatDisplayDate(scheduleDate),
      scheduleDate,
      weekStartDate: targetWeekStartDate,
      morning,
      afternoon,
      night,
      extraDuty,
      secondaryDuty,
      offLeave: "-",
      notes: "-",
    };
  });
}

function mapScheduleDayToApiRow(day: ShiftScheduleDay): ShiftScheduleApiRow {
  return {
    weekStartDate: day.weekStartDate,
    scheduleDate: day.scheduleDate,
    dayName: day.day,
    morningStaff: joinStaff(day.morning),
    afternoonStaff: joinStaff(day.afternoon),
    nightStaff: joinStaff(day.night),
    extraDuty: day.extraDuty || "-",
    secondaryDuty: day.secondaryDuty || "-",
    offLeave: day.offLeave || "-",
    notes: day.notes || "-",
  };
}

export default function ShiftSchedulePage() {
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(DEFAULT_WEEK_START_DATE);
  const [schedule, setSchedule] = useState<ShiftScheduleDay[]>(
    createBlankWeekSchedule(DEFAULT_WEEK_START_DATE)
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [editForm, setEditForm] = useState<KaEditForm>({
    morning: "",
    afternoon: "",
    night: "",
    extraDuty: "",
    secondaryDuty: "",
    offLeave: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedDay = schedule[selectedDayIndex];

  const weekLabel = useMemo(() => getWeekLabel(schedule), [schedule]);

  const loadSchedule = async (weekStartDate: string) => {
    try {
      setIsLoading(true);
      setStatusMessage("");

      const response = await fetch(
        `/api/shift-schedules?weekStartDate=${weekStartDate}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load shift schedule");
      }

      const savedSchedules: ShiftScheduleApiRow[] = await response.json();

      if (savedSchedules.length > 0) {
        setSchedule(savedSchedules.map(mapApiRowToScheduleDay));
      } else {
        setSchedule(createBlankWeekSchedule(weekStartDate));
        setStatusMessage("No saved schedule for this week yet. You can create one.");
      }
    } catch (error) {
      console.error(error);
      setSchedule(createBlankWeekSchedule(weekStartDate));
      setStatusMessage("Could not load saved schedule. Showing blank week.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule(DEFAULT_WEEK_START_DATE);
  }, []);

  const openEditDialog = (dayIndex: number) => {
    const day = schedule[dayIndex];

    setSelectedDayIndex(dayIndex);
    setEditForm({
      morning: joinStaff(day.morning),
      afternoon: joinStaff(day.afternoon),
      night: joinStaff(day.night),
      extraDuty: day.extraDuty,
      secondaryDuty: day.secondaryDuty,
      offLeave: day.offLeave,
      notes: day.notes,
    });
    setIsEditOpen(true);
  };

  const handleLoadWeek = () => {
  if (!isMondayDate(selectedWeekStartDate)) {
    setStatusMessage("Please select a Monday as the week start date.");
    return;
  }

  loadSchedule(selectedWeekStartDate);
};

  const handleCopyPreviousWeek = async () => {
    try {
     if (!isMondayDate(selectedWeekStartDate)) {
      setStatusMessage("Please select a Monday before copying previous week.");
      return;
    }
      setIsCopying(true);
      setStatusMessage("");

      const previousWeekStartDate = addDays(selectedWeekStartDate, -7);

      const response = await fetch(
        `/api/shift-schedules?weekStartDate=${previousWeekStartDate}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load previous week schedule");
      }

      const previousSchedules: ShiftScheduleApiRow[] = await response.json();

      if (previousSchedules.length === 0) {
        setStatusMessage("No saved previous week schedule found to copy.");
        return;
      }

      const copiedSchedule = copyScheduleToWeek(
        previousSchedules.map(mapApiRowToScheduleDay),
        selectedWeekStartDate
      );

      setSchedule(copiedSchedule);
      setStatusMessage(
        "Previous week copied. Review the schedule, then click Save Schedule."
      );
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to copy previous week schedule.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleAutoGenerateFromPreviousWeek = async () => {
    try {
     if (!isMondayDate(selectedWeekStartDate)) {
      setStatusMessage("Please select a Monday before auto-generating schedule.");
      return;
    }
      setIsAutoGenerating(true);
      setStatusMessage("");

      const previousWeekStartDate = addDays(selectedWeekStartDate, -7);

      const response = await fetch(
        `/api/shift-schedules?weekStartDate=${previousWeekStartDate}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load previous week schedule");
      }

      const previousSchedules: ShiftScheduleApiRow[] = await response.json();

      if (previousSchedules.length === 0) {
        setStatusMessage("No saved previous week schedule found to auto-generate from.");
        return;
      }

      const generatedSchedule = autoGenerateScheduleFromPreviousWeek(
        previousSchedules.map(mapApiRowToScheduleDay),
        selectedWeekStartDate
      );

      setSchedule(generatedSchedule);
      setStatusMessage(
        "Shift schedule generated. Review it, then click Save Schedule."
      );
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to auto-generate schedule.");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleSaveDay = () => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((day, index) => {
        if (index !== selectedDayIndex) return day;

        return {
          ...day,
          morning: splitStaff(editForm.morning),
          afternoon: splitStaff(editForm.afternoon),
          night: splitStaff(editForm.night),
          extraDuty: editForm.extraDuty.trim() || "-",
          secondaryDuty: editForm.secondaryDuty.trim() || "-",
          offLeave: editForm.offLeave.trim() || "-",
          notes: editForm.notes.trim() || "-",
        };
      })
    );

    setStatusMessage("Changes updated on screen. Click Save Schedule to save to database.");
    setIsEditOpen(false);
  };

  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true);
      setStatusMessage("");

      const response = await fetch("/api/shift-schedules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          schedules: schedule.map(mapScheduleDayToApiRow),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save shift schedule");
      }

      const savedSchedules: ShiftScheduleApiRow[] = await response.json();
      setSchedule(savedSchedules.map(mapApiRowToScheduleDay));
      setStatusMessage("Shift schedule saved to database.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to save shift schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof KaEditForm, value: string) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">

    <style>
  {`
    @page {
      size: A4 landscape;
      margin: 6mm;
    }

    @media screen {
      .shift-print-only {
        display: none;
      }
    }

    @media print {
      html,
      body {
        width: 297mm;
        height: 210mm;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      body * {
        visibility: hidden;
      }

      .shift-print-area,
      .shift-print-area * {
        visibility: visible;
      }

      .shift-print-area {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100%;
        margin: 0 !important;
        padding: 4mm 6mm !important;
        background: white !important;
        color: black !important;
        box-shadow: none !important;
        border: none !important;
      }

      .shift-no-print {
        display: none !important;
      }

      .shift-print-only {
        display: block !important;
      }

      .shift-print-scroll {
        overflow: visible !important;
      }

      .shift-print-area table {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        font-size: 8.5px !important;
      }

      .shift-print-area th,
      .shift-print-area td {
        min-width: 0 !important;
        border: 1px solid #111 !important;
        color: #111 !important;
        background: white !important;
        padding: 4px !important;
        vertical-align: top !important;
        white-space: normal !important;
        word-break: break-word !important;
      }

      .shift-print-area th:first-child,
      .shift-print-area td:first-child {
        width: 13% !important;
      }

      .shift-print-area th:not(:first-child),
      .shift-print-area td:not(:first-child) {
        width: 12.4% !important;
      }

      .shift-print-area .shift-staff-box {
        border: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .shift-print-area .shift-badge-print {
        border: none !important;
        background: transparent !important;
        color: #111 !important;
        padding: 0 !important;
        font-size: 8.5px !important;
        white-space: normal !important;
      }

      .shift-print-area h2 {
        font-size: 16px !important;
        margin: 0 !important;
      }

      .shift-print-area p {
        margin: 0 !important;
      }
    }
  `}
</style>

    <div className="shift-no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Shift Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Weekly employee shift schedule.
          </p>
          {statusMessage && (
            <p className="text-sm text-muted-foreground mt-2">{statusMessage}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Export / Print
          </Button>
          <Button variant="outline" onClick={() => openEditDialog(0)}>
            Create / Edit Schedule
          </Button>
          <Button onClick={handleSaveSchedule} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      <Card className="shift-no-print">
        <CardHeader>
          <CardTitle>Week Selection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the Monday date for the schedule week.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm font-medium">Week Start Date</label>
              <input
                type="date"
                value={selectedWeekStartDate}
                onChange={(event) => setSelectedWeekStartDate(event.target.value)}
                className="mt-1 block h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button onClick={handleLoadWeek} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load Week"}
            </Button>

             <Button
              variant="outline"
              onClick={handleCopyPreviousWeek}
              disabled={isLoading || isCopying}
            >
              {isCopying ? "Copying..." : "Copy Previous Week"}
            </Button>
            <Button
             variant="outline"
             onClick={handleAutoGenerateFromPreviousWeek}
             disabled={isLoading || isCopying || isAutoGenerating}
            >
             {isAutoGenerating ? "Generating..." : "Auto Generate from Previous Week"}
           </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shift-print-area">
       <CardHeader>
        <div className="shift-print-only text-center mb-4">
           <h2 className="text-xl font-bold">JADUAL KERJA MINGGUAN 2026</h2>
           <p className="text-sm font-semibold">Branch 2</p>
           <p className="text-sm">Week: {weekLabel}</p>
        </div>

        <CardTitle className="shift-no-print">Weekly Schedule</CardTitle>
        <p className="shift-no-print text-sm text-muted-foreground">
        Week: {weekLabel} · Branch: Branch 2
        </p>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading schedule...</div>
          ) : (
            <div className="shift-print-scroll overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Shift</TableHead>
                    {schedule.map((day, index) => (
                      <TableHead key={day.scheduleDate} className="min-w-[180px] text-center">
                        <div className="font-semibold">{day.day}</div>
                        <div className="text-xs text-muted-foreground">{day.date}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shift-no-print mt-2"
                          onClick={() => openEditDialog(index)}
                        >
                          Edit
                        </Button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {kaShiftRows.map((shift) => (
                    <TableRow key={shift.key}>
                      <TableCell className="align-top">
                        <div className="font-semibold">{shift.label}</div>
                        <div className="text-xs text-muted-foreground">{shift.time}</div>
                      </TableCell>

                      {schedule.map((day) => (
                        <TableCell key={`${day.scheduleDate}-${shift.key}`} className="align-top">
                          <div className="shift-staff-box rounded-lg border bg-card p-3 space-y-1">
                            {day[shift.key].length === 0 ? (
                              <div className="text-sm text-muted-foreground">-</div>
                            ) : (
                              day[shift.key].map((staffName) => (
                                <div key={staffName} className="text-sm font-medium">
                                  {staffName}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                 <TableRow>
                   <TableCell className="font-semibold align-top">
                      <div>Extra Duty / Cleaning</div>
                      <div className="text-xs text-muted-foreground">
                         Weekdays: 10:00 AM - 6:00 PM
                      </div>
                      <div className="text-xs text-muted-foreground">
                         Weekends: 7:00 AM - 10:00 AM
                      </div>
                    </TableCell>
                    {schedule.map((day) => (
                      <TableCell key={`${day.scheduleDate}-extra-duty`} className="align-top text-sm">
                        <div className="font-medium">{getExtraDutyLabel(day)}</div>
                        <div className="text-xs text-muted-foreground">{getExtraDutyTime(day)}</div>
                        <div className="mt-1">{day.extraDuty}</div>
                      </TableCell>
                    ))}
                 </TableRow>

                 <TableRow>
                   <TableCell className="font-semibold align-top">Secondary Duty</TableCell>
                   {schedule.map((day) => (
                     <TableCell key={`${day.scheduleDate}-secondary-duty`} className="align-top text-sm whitespace-pre-line">
                       {day.secondaryDuty}
                     </TableCell>
                   ))}
                 </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold align-top">Off / Leave</TableCell>
                    {schedule.map((day) => (
                      <TableCell key={`${day.scheduleDate}-off`} className="align-top">
                        <Badge variant="secondary" className="shift-badge-print whitespace-normal text-left">
                          {day.offLeave}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold align-top">Notes</TableCell>
                    {schedule.map((day) => (
                      <TableCell key={`${day.scheduleDate}-notes`} className="align-top text-sm">
                        {day.notes}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
                        </div>
          )}

            <div className="shift-print-only mt-8 grid grid-cols-2 gap-16 text-xs">
            <div>
              <div className="border-t border-black pt-2">
                Prepared by HR
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2">
                Approved by Head of HR
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {selectedDay?.day} Schedule</DialogTitle>
            <DialogDescription>
              Update staff names using commas. Example: Employee A, Employee B, Employee C.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Morning Shift</label>
              <Textarea
                value={editForm.morning}
                onChange={(event) => handleFieldChange("morning", event.target.value)}
                placeholder="Example: Employee A, Employee B"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Afternoon Shift</label>
              <Textarea
                value={editForm.afternoon}
                onChange={(event) => handleFieldChange("afternoon", event.target.value)}
                placeholder="Example: Employee C, Employee D"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Night Shift</label>
              <Textarea
                value={editForm.night}
                onChange={(event) => handleFieldChange("night", event.target.value)}
                placeholder="Example: Employee H, Employee F"
              />
            </div>

            <div>
               <label className="text-sm font-medium">
                 {selectedDay
                   ? `${getExtraDutyLabel(selectedDay)} / ${getExtraDutyTime(selectedDay)}`
                   : "Extra Duty / Cleaning"}
               </label>
               <Textarea
                 value={editForm.extraDuty}
                 onChange={(event) => handleFieldChange("extraDuty", event.target.value)}
                placeholder={
                  selectedDay && isWeekend(selectedDay)
                    ? "Example: Employee F - cleaning duty (7:00 AM - 10:00 AM)"
                    : "Example: Employee F (10:00 AM - 6:00 PM)"
                }
               />
             </div>

             <div>
                <label className="text-sm font-medium">Secondary Duty</label>
                <Textarea
                   value={editForm.secondaryDuty}
                   onChange={(event) => handleFieldChange("secondaryDuty", event.target.value)}
                   placeholder="Example: Employee C & Employee E"
                 />
                </div>

            <div>
              <label className="text-sm font-medium">Off / Leave</label>
              <Textarea
                value={editForm.offLeave}
                onChange={(event) => handleFieldChange("offLeave", event.target.value)}
                placeholder="Example: Employee B (Annual Leave)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(event) => handleFieldChange("notes", event.target.value)}
                placeholder="Example: Tagging 10:00 AM - 6:00 PM"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDay}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
