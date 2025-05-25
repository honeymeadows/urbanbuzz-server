export const getTruncatedEmail = (fullStr) => {
  const separator = "***";
  if (fullStr) {
    const emailParts = fullStr.split("@");
    return (
      emailParts[0].substr(0, 1) +
      separator +
      emailParts[0].substr(emailParts[0].length - 1) +
      "@" +
      emailParts[1]
    );
  }
  return null;
};

// get a search array

export const getArrayFromString = (string) => {
  if (!string) return [];
  const stringArr = string.toLowerCase().split("");
  const newArr = [];
  for (let i = 0; i < stringArr.length; i++) {
    let str = "";
    for (let j = 0; j < newArr.length; j++) {
      str = str + stringArr[j];
    }
    newArr[i] = str + stringArr[i];
  }
  const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g;
  return [
    ...new Set([
      ...newArr,
      ...string.toLowerCase().split("@"),
      ...string.toLowerCase().split(specialCharRegex),
      ...string.toLowerCase().split(/[\d_,-.]+/g),
      ...string.toLowerCase().split(/[\d_,-.]+/g),
      ...string.toLowerCase().split(/[\s]+/g),
    ]),
  ];
};
