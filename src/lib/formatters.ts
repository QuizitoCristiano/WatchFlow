function toDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    try {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export const formatDate = (dateField: unknown): string => {
  const date = toDate(dateField);
  return date ? date.toLocaleString('pt-BR') : 'N/A';
};

export const formatTime = (dateField: unknown): string => {
  const date = toDate(dateField);
  return date
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'N/A';
};
