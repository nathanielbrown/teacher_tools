export const defaultSchedule = [
  { id: '1', startTime: '08:30', endTime: '09:00', activity: 'Registration', emoji: '👋' },
  { id: '2', startTime: '09:00', endTime: '10:00', activity: 'Maths', emoji: '🔢' },
  { id: '3', startTime: '10:00', endTime: '10:20', activity: 'Recess', emoji: '🥪' },
  { id: '4', startTime: '10:20', endTime: '11:20', activity: 'English', emoji: '📝' },
  { id: '5', startTime: '11:20', endTime: '12:20', activity: 'Science', emoji: '🧪' },
  { id: '6', startTime: '12:20', endTime: '13:10', activity: 'Lunch', emoji: '🍽️' },
  { id: '7', startTime: '13:10', endTime: '14:10', activity: 'Art', emoji: '🎨' },
  { id: '8', startTime: '14:10', endTime: '15:10', activity: 'PE', emoji: '🏃' },
  { id: '9', startTime: '15:10', endTime: '15:30', activity: 'Pack Up', emoji: '🎒' },
];

export const SCHOOL_EMOJIS = ['👋', '🔢', '🥪', '📝', '🏃', '🎨', '🎵', '📖', '💻', '⚽', '🧪', '🍽️', '🎒', '⚪'];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const defaultSchedules = DAYS.reduce((acc, day) => {
  acc[day] = defaultSchedule;
  return acc;
}, {});
