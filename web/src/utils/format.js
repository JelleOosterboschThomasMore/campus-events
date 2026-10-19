const locale = 'en-GB';

export const formatDay = (date) => new Date(date).toLocaleDateString(locale, { day: '2-digit' });
export const formatMonth = (date) => new Date(date).toLocaleDateString(locale, { month: 'short' });
export const formatTime = (date) => new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
export const formatFullDate = (date) =>
  new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const isPast = (date) => new Date(date) < new Date();
