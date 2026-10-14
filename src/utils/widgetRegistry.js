import { DateWidget } from "../components/widgets/dateWidget/dateWidget.js";
import { TimeWidget } from "../components/widgets/timeWidget/timeWidget.js";
import { WeeksWidget } from "../components/widgets/weeksWidget/weeksWidget.js";
import { AirWidget } from "../components/widgets/airWidget/airWidget.js";
import { QuoteWidget } from "../components/widgets/quoteWidget/quoteWidget.js";
import { DateCountdownWidget } from "../components/widgets/dateCountdownWidget/dateCountdownWidget.js";
import { MusicWidget } from "../components/widgets/musicWidget/musicWidget.js";
import { BookmarksWidget } from "../components/widgets/bookmarksWidget/bookmarksWidget.js";
import { CalendarWidget } from "../components/widgets/calendarWidget/calendarWidget.js";
import { CoffeeWidget } from "../components/widgets/coffeeWidget/coffeeWidget.js";
import { ContactAuthorWidget } from "../components/widgets/contactAuthorWidget/contactAuthorWidget.js";
import { mountCurrencyWidget } from "./displayCurrencyUtils.js";

// This sequence defines the default visual and DOM order on every screen.
export const widgetDefinitions = Object.freeze(
  [
    {
      id: "date",
      name: "Date",
      mount: () => new DateWidget().dateWidgetContainer.container,
    },
    {
      id: "time",
      name: "Day progress",
      mount: () => new TimeWidget().timeWidgetContainer.container,
    },
    {
      id: "weeks",
      name: "Weeks",
      mount: () => new WeeksWidget().weeksWidgetContainer.container,
    },
    { id: "currency", name: "Currency rates", mount: mountCurrencyWidget },
    {
      id: "air",
      name: "Air",
      mount: () => new AirWidget().airWidgetContainer.container,
    },
    {
      id: "quote",
      name: "Quote",
      mount: () => new QuoteWidget().quoteWidgetContainer.container,
    },
    {
      id: "countdown",
      name: "Countdown",
      mount: () => new DateCountdownWidget().dateCountDownContainer.container,
    },
    {
      id: "music",
      name: "Music",
      mount: () => new MusicWidget().musicWidgetContainer.container,
    },
    {
      id: "bookmarks",
      name: "Bookmarks",
      mount: () => new BookmarksWidget().bookmarksWidgetContainer.container,
    },
    {
      id: "calendar",
      name: "Calendar",
      mount: () => new CalendarWidget().calendarWidgetContainer.container,
    },
    {
      id: "coffee",
      name: "Coffee",
      mount: () => new CoffeeWidget().coffeeWidgetContainer.container,
    },
    {
      id: "contact",
      name: "Contact author",
      mount: () =>
        new ContactAuthorWidget().contactAuthorWidgetContainer.container,
    },
  ].map((definition) => Object.freeze(definition)),
);
