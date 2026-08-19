// Auxiliar para formatar campos de data do Firestore (Timestamp ou string/Date)
export const formatDate = (dateField: any): string => {
  if (!dateField) return 'N/A';
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate().toLocaleString('pt-BR');
  }
  return new Date(dateField).toLocaleString('pt-BR');
};

export const formatTime = (dateField: any): string => {
  if (!dateField) return 'N/A';
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return new Date(dateField).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};