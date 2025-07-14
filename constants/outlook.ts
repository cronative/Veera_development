export const OUTLOOK_CONFIG = {
  // Microsoft Graph API endpoints
  GRAPH_API_BASE: 'https://graph.microsoft.com/v1.0',
  AUTH_ENDPOINT: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  TOKEN_ENDPOINT: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  
  // Required scopes for email access
  SCOPES: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Mail.Read',
    'User.Read'
  ].join(' '),
  
  // Redirect URIs for different platforms
  REDIRECT_URIS: {
    web: 'https://vera-app.com/auth/outlook/callback',
    ios: 'veraapp://auth/outlook/callback',
    android: 'veraapp://auth/outlook/callback'
  }
};

// Email processing keywords and patterns
export const EMAIL_KEYWORDS = {
  OPPORTUNITY: [
    'apply now',
    'application deadline',
    'job opening',
    'internship',
    'scholarship',
    'opportunity',
    'hiring',
    'position available',
    'career opportunity',
    'fellowship'
  ],
  
  EVENT: [
    'event',
    'meeting',
    'conference',
    'workshop',
    'seminar',
    'webinar',
    'presentation',
    'lecture',
    'networking',
    'info session'
  ],
  
  TIME_SENSITIVE: [
    'time sensitive',
    'urgent',
    'deadline',
    'expires',
    'limited time',
    'act fast',
    'ends soon',
    'final notice',
    'last chance',
    'immediate action'
  ]
};

// Data extraction patterns
export const EXTRACTION_PATTERNS = {
  DATE: [
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{4}\b/g
  ],
  
  TIME: [
    /\b\d{1,2}:\d{2}\s*(?:am|pm)\b/gi,
    /\b\d{1,2}\s*(?:am|pm)\b/gi
  ],
  
  LOCATION: [
    /(?:at|in|location:?)\s+([^,\n]+)/gi,
    /(?:address:?)\s+([^,\n]+)/gi,
    /(?:venue:?)\s+([^,\n]+)/gi
  ],
  
  DEADLINE: [
    /(?:deadline:?|due:?|expires:?)\s*([^,\n]+)/gi,
    /(?:apply by|submit by)\s*([^,\n]+)/gi
  ]
};