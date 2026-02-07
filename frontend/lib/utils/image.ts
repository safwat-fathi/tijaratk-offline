export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  
  if (path.startsWith("http")) {
    return path;
  }
  
  if (path.startsWith("/uploads")) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`;
  }
  
  return path;
}
