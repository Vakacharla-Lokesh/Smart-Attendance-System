const times = [
  "2026-03-15T03:30:00.000Z", // 9am IST
  "2026-03-15T04:30:00.000Z", // 10am IST
];
for(const t of times) {
  const tStart = new Date(t).toTimeString().slice(0, 5);
  console.log(t, tStart);
}
