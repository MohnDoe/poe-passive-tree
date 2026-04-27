export function setsEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function makeShallowEqual<T extends object>(shape: Record<keyof T, true>) {
  const keys = Object.keys(shape) as (keyof T)[];
  return (a: T, b: T): boolean => keys.every((key) => a[key] === b[key]);
}
