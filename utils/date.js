const dayjs = require("dayjs");

export const getFormattedDate = (dateObj, format = "MMM DD") => {
  if (!dateObj) return "";
  return dayjs(dateObj).format(format);
};
