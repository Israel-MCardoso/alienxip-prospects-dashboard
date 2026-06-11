import { CalendarView } from "@/features/operations/calendar-view";
import { getCalendarTasks } from "@/features/operations/data";

export default async function CalendarPage() {
  const { grouped, error } = await getCalendarTasks();
  return <CalendarView grouped={grouped} error={error} />;
}
