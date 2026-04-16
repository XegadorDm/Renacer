
export const CORE_ADMIN_EMAILS = [
  'aleksimbachi@gmail.com',
  'juancamilogiraldo@gmail.com',
  'diegomauriciopastusano@gmail.com'
];

export function isCoreAdmin(email?: string | null) {
  if (!email) return false;
  return CORE_ADMIN_EMAILS.includes(email.toLowerCase());
}
