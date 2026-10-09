export function stationDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.STATION_TIME_ZONE || 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function stationDayStart(date = new Date()) {
  const dateString = stationDateString(date);
  return new Date(`${dateString}T00:00:00+05:30`);
}
