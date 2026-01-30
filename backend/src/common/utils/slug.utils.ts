/**
 * Utility functions for slug generation and manipulation.
 * Used for generating URL-friendly identifiers for stores, products, etc.
 */

/**
 * Generates a URL-friendly slug from the given text.
 * - Converts to lowercase
 * - Trims whitespace
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading and trailing hyphens
 *
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 *
 * @example
 * generateSlugBase('My Store Name') // returns 'my-store-name'
 * generateSlugBase('  Hello World!  ') // returns 'hello-world'
 */
export function generateSlugBase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug by appending a numeric suffix if needed.
 * Uses a callback function to check if the slug already exists.
 *
 * @param text - The text to generate a slug from
 * @param existsCheck - Async function that returns true if slug already exists
 * @returns A unique slug (possibly with numeric suffix)
 *
 * @example
 * // For stores (global uniqueness)
 * const slug = await generateUniqueSlug(name, async (slug) => {
 *   return !(await this.isSlugAvailable(slug));
 * });
 *
 * // For products (unique per store)
 * const slug = await generateUniqueSlug(name, async (slug) => {
 *   const exists = await this.productRepo.exist({ where: { store_id, slug } });
 *   return exists;
 * });
 */
export async function generateUniqueSlug(
  text: string,
  existsCheck: (slug: string) => Promise<boolean>,
): Promise<string> {
  const slugBase = generateSlugBase(text);
  let slug = slugBase;
  let suffix = 1;

  while (await existsCheck(slug)) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
