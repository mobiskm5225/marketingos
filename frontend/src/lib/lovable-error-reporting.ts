export function reportLovableError(error: Error, metadata?: Record<string, any>) {
  console.error("Lovable Error:", error, metadata);
}
