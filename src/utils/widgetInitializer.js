import { Dashboard } from "./dashboard.js";
import { AirWidget } from "../components/widgets/airWidget/airWidget.js";
import { DateWidget } from "../components/widgets/dateWidget/dateWidget.js";
import { WeeksWidget } from "../components/widgets/weeksWidget/weeksWidget.js";
import { TimeWidget } from "../components/widgets/timeWidget/timeWidget.js";
import { DateCountdownWidget } from "../components/widgets/dateCountdownWidget/dateCountdownWidget.js";
import { QuoteWidget } from "../components/widgets/quoteWidget/quoteWidget.js";

const dashboard = new Dashboard();

dashboard.addWidget(new AirWidget());
dashboard.addWidget(new DateWidget());
dashboard.addWidget(new WeeksWidget());
dashboard.addWidget(new TimeWidget());
dashboard.addWidget(new DateCountdownWidget());
dashboard.addWidget(new QuoteWidget());
