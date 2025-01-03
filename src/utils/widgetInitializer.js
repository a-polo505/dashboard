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

const dashboard = new Dashboard();

dashboard.addWidget(new AirWidget());
dashboard.addWidget(new DateWidget());
dashboard.addWidget(new WeeksWidget());
dashboard.addWidget(new TimeWidget());
dashboard.addWidget(new DateCountdownWidget());
dashboard.addWidget(new QuoteWidget());
dashboard.addWidget(new MusicWidget());
dashboard.addWidget(new BookmarksWidget());
dashboard.addWidget(new CalendarWidget());
dashboard.addWidget(new CoffeeWidget());
dashboard.addWidget(new ContactAuthorWidget());
