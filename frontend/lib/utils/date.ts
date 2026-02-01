export function isProductNew(dateString?: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Difference in milliseconds
  const diffTime = Math.abs(now.getTime() - date.getTime());
  // Difference in days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 30;
}
