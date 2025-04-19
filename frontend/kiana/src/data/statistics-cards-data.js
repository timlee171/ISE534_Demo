import {
  UsersIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/solid";

export const statisticsCardsData = [
  {
    color: "gray",
    icon: UsersIcon,
    title: "# of Employee",
    value: "20",
    footer: {
      color: "text-green-500",
      value: "+2%",
      label: "than last week",
    },
  },
  {
    color: "gray",
    icon: UserCircleIcon,
    title: "# of Visitors",
    value: "5",
    footer: {
      color: "text-green-500",
      value: "+3%",
      label: "than last month",
    },
  },
  {
    color: "gray",
    icon: ExclamationCircleIcon,
    title: "Errors Count",
    value: "2",
    footer: {
      color: "text-red-500",
      value: "-2%",
      label: "than yesterday",
    },
  },
  {
    color: "gray",
    icon: WrenchScrewdriverIcon,
    title: "Unsolved Tasks",
    value: "3",
    footer: {
      color: "text-green-500",
      value: "+5%",
      label: "than yesterday",
    },
  },
];

export default statisticsCardsData;
