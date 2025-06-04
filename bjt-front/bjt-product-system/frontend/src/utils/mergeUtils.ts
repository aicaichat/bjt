// 只用 newObj 的非空值（非 undefined/null/空字符串）覆盖 oldObj
export function mergeNoEmpty<T extends object>(oldObj: T, newObj: Partial<T>): T {
  const result = { ...oldObj };
  for (const key in newObj) {
    const value = newObj[key];
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '')
    ) {
      result[key] = value;
    }
  }
  return result;
} 