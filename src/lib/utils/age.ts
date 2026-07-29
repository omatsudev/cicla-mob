const MIN_AGE = 18

/**
 * Age in whole years for a "YYYY-MM-DD" birth date, as of today (local time).
 * Parses the date as plain y/m/d components instead of `new Date(string)`,
 * which reads "YYYY-MM-DD" as UTC midnight and can shift a day backward in
 * timezones behind UTC (e.g. Brazil), letting someone turning 18 tomorrow
 * pass as 18 today.
 */
export function calculateAge(birthDateISO: string): number {
  const [birthYear, birthMonth, birthDay] = birthDateISO.split('-').map(Number)
  const today = new Date()
  const todayMonth = today.getMonth() + 1

  let age = today.getFullYear() - birthYear
  const hasHadBirthdayThisYear =
    todayMonth > birthMonth ||
    (todayMonth === birthMonth && today.getDate() >= birthDay)
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export function isAdult(birthDateISO: string): boolean {
  return calculateAge(birthDateISO) >= MIN_AGE
}

export { MIN_AGE }
