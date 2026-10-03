const EMERGENCY_PATTERN = /\b(?:chest\s+pain|shortness\s+of\s+breath|slurred\s+speech|sudden\s+weakness|unconscious|severe\s+bleeding)\b/i;

export const emergencyResponse = {
  isEmergency: true,
  riskLevel: 'EMERGENCY',
  emergencyAction: 'CALL_911_IMMEDIATELY',
  guidance: 'Stop using the chat. Call emergency services immediately or visit the nearest ER.',
};

export function isEmergencyMessage(text) {
  return typeof text === 'string' && EMERGENCY_PATTERN.test(text);
}

export function emergencyInterceptor(req, res, next) {
  const message = typeof req.body?.message === 'string' ? req.body.message : '';
  if (isEmergencyMessage(message)) return res.status(400).json(emergencyResponse);
  return next();
}