export const globalStringSpitter = "$stringSpitter$";
export const getSplittedStringArr = (string, stringSplitter = globalStringSpitter) => {
  return string.split(stringSplitter);
};

export const shuffleArray = (array) => {
  let arrayLength = array.length;
  for (let currentIndex = arrayLength - 1; currentIndex > 0; currentIndex--) {
    let randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export const getMissingElements = (existing = [], updated = []) => {
  const updatedNames = new Set(updated.map((item) => item.name));
  return existing.filter((item) => !updatedNames.has(item.name));
};
