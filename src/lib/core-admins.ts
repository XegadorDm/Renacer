export const CORE_ADMIN_EMAILS = [
  'aleksimbachi@gmail.com',
  'juancamilogiraldo@gmail.com',
  'diegomauriciopastusano@gmail.com'
];

export const CORE_ADMIN_UIDS = [
    'gKSHtlJQt8aVOQZPTXCTEqmYENA3'
];

export function isCoreAdmin(email?: string | null, uid?: string | null) {
  if (!email && !uid) return false;
  
  const emailMatch = email ? CORE_ADMIN_EMAILS.includes(email.toLowerCase()) : false;
  const uidMatch = uid ? CORE_ADMIN_UIDS.includes(uid) : false;
  
  return !!(emailMatch || uidMatch);
}