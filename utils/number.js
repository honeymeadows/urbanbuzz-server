export const formatNumberToDollarAmount = (number) => {
  return `$${(number / 100).toFixed(2)}`;
};
