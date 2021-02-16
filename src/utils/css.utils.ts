export function convertCSSTimeToMs(time) {
  const num = parseFloat(time);
  let unit = time.match(/m?s/);
  let milliseconds;

  if (unit) {
    unit = unit[0];
  }

  switch (unit) {
    case 's':
      milliseconds = num * 1000;
      break;
    case 'ms':
      milliseconds = num;
      break;
    default:
      milliseconds = 0;
      break;
  }

  return milliseconds;
}
