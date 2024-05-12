import { Dashboard } from "./dashboard.js";
import { AirWidget } from "../components/widgets/airWidget/airWidget.js";
import { DateWidget } from "../components/widgets/dateWidget/dateWidget.js";
import { WeeksWidget } from "../components/widgets/weeksWidget/weeksWidget.js";
import { TimeWidget } from "../components/widgets/timeWidget/timeWidget.js";

const dashboard = new Dashboard();

dashboard.addWidget(new AirWidget());
dashboard.addWidget(new DateWidget());
dashboard.addWidget(new WeeksWidget());
dashboard.addWidget(new TimeWidget());
