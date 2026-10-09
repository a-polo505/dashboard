import { Dashboard } from "./dashboard.js";
import { AirWidget } from "../components/widgets/airWidget/airWidget.js";
import { DateWidget } from "../components/widgets/dateWidget/dateWidget.js";
import { WeeksWidget } from "../components/widgets/weeksWidget/weeksWidget.js";
import { TimeWidget } from "../components/widgets/timeWidget/timeWidget.js";
import { DateCountdownWidget } from "../components/widgets/dateCountdownWidget/dateCountdownWidget.js";
import { QuoteWidget } from "../components/widgets/quoteWidget/quoteWidget.js";
import { MusicWidget } from "../components/widgets/musicWidget/musicWidget.js";
import { BookmarksWidget } from "../components/widgets/bookmarksWidget/bookmarksWidget.js";
import { CalendarWidget } from "../components/widgets/calendarWidget/calendarWidget.js";
import { CoffeeWidget } from "../components/widgets/coffeeWidget/coffeeWidget.js";
import { ContactAuthorWidget } from "../components/widgets/contactAuthorWidget/contactAuthorWidget.js";

let dashboard;

export function initializeWidgets() {
  if (dashboard) return dashboard;
  if (!document.querySelector(".widgets")) {
    throw new Error("Widget parent element not found");
  }

  const initializedDashboard = new Dashboard();
  initializedDashboard.addWidget(new AirWidget());
  initializedDashboard.addWidget(new DateWidget());
  initializedDashboard.addWidget(new WeeksWidget());
  initializedDashboard.addWidget(new TimeWidget());
  initializedDashboard.addWidget(new DateCountdownWidget());
  initializedDashboard.addWidget(new QuoteWidget());
  initializedDashboard.addWidget(new MusicWidget());
  initializedDashboard.addWidget(new BookmarksWidget());
  initializedDashboard.addWidget(new CalendarWidget());
  initializedDashboard.addWidget(new CoffeeWidget());
  initializedDashboard.addWidget(new ContactAuthorWidget());

  dashboard = initializedDashboard;
  return dashboard;
}
