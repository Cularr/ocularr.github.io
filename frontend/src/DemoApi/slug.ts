export function slug(title: string) {
  return title
    .toLowerCase()
    .replace('&', 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cleanTitle(title: string) {
  return slug(title).replace(/-/g, '');
}
