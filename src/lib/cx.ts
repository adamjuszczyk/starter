// Joins class names, leaving out anything that is not a class: `cx('a', cond && 'b', undefined)` is `'a'` plus `'b'` when `cond` holds.
// A list of classes goes in as an array, which is how the components write the classes they build from parts (`BASE`, `VARIANT[variant]`).
//
// Why one class to a string in those lists, and not `'inline-flex gap-2 rounded-md'`: the words check reads a string with a space in it as
// words a person reads, unless it is the value of a `className` attribute written out in the JSX (`className="..."`, or a ternary or `+`
// of strings there). A string handed to a function, such as `cx(...)`, is neither, so a class list built here is one class per string.
export type ClassValue = string | false | null | undefined | readonly ClassValue[]

export function cx(...values: ClassValue[]): string {
  const classes: string[] = []
  for (const value of values) {
    if (!value) continue
    const joined = typeof value === 'string' ? value : cx(...value)
    if (joined) classes.push(joined)
  }
  return classes.join(' ')
}
