export function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function appendSlugSuffix(
  slug: string,
  suffix: number,
): string {
  return `${slug}-${suffix}`;
}