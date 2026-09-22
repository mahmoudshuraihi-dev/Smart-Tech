import type { ServiceId } from "@/lib/mock-data";
import { IconEdit, IconChart, IconCompass, IconBooks, IconClock } from "./icons";

// single source of truth for service id -> icon, shared by ServiceCard and BookingForm
// so the two pickers can't drift out of sync on which icon represents which service
export const SERVICE_ICONS: Record<ServiceId, typeof IconEdit> = {
  editing: IconEdit,
  statistics: IconChart,
  methodology: IconCompass,
  literature: IconBooks,
  formatting: IconEdit,
  coaching: IconClock,
};
