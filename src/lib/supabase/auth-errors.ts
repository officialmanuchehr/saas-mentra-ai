// Supabase Auth возвращает сообщения об ошибках на английском.
// Здесь они переводятся на русский для показа пользователю.

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Неверный email или пароль.",
  "Email not confirmed":
    "Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.",
  "User already registered": "Пользователь с таким email уже зарегистрирован.",
  "Password should be at least 6 characters":
    "Пароль должен содержать минимум 6 символов.",
  "Unable to validate email address: invalid format": "Неверный формат email.",
  "signup requires a valid password": "Введите корректный пароль.",
  "For security purposes, you can only request this after":
    "Слишком много попыток. Подождите немного и попробуйте снова.",
};

export function getAuthErrorMessage(message?: string | null): string {
  if (!message) return "Что-то пошло не так. Попробуйте снова.";
  const known = Object.keys(MESSAGES).find((key) => message.includes(key));
  return known ? MESSAGES[known] : "Что-то пошло не так. Попробуйте снова.";
}
