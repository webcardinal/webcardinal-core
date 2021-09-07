export function getPagination(currentPage, numberOfPages, delta = 2) {
  const range = [];
  const rangeWithDots = [];

  if (numberOfPages <= 1) {
    return range;
  }

  range.push(1);
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i < numberOfPages && i > 1) {
      range.push(i);
    }
  }
  range.push(numberOfPages);

  let l;
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}
