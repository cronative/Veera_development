# Outlook Authentication and Email Processing Setup

This guide covers the complete setup for Outlook authentication and email processing in your Vera app.

## 🔧 Azure AD App Registration

### 1. Create Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Vera App - Outlook Integration`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: Leave blank for now

### 2. Configure Redirect URIs

After creating the app, go to **Authentication** and add these redirect URIs:

```
https://vera-app.com/auth/outlook/callback
com.vera.app://auth/outlook/callback
```

### 3. Configure API Permissions

Go to **API permissions** and add these Microsoft Graph permissions:

**Delegated permissions:**
- `openid`
- `profile` 
- `email`
- `Mail.Read`
- `User.Read`

Click **Grant admin consent** for your organization.

### 4. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `Vera App Secret`
4. Set expiration: `24 months`
5. Copy the secret value immediately (you won't see it again)

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# Azure AD Configuration
EXPO_PUBLIC_AZURE_CLIENT_ID=f4104f87-4b7d-4599-becb-0b1ba6e61695
EXPO_PUBLIC_AZURE_CLIENT_SECRET=5rk8Q~4zD9DVF_s.zU5WvLE4qXznGe_2eS6fzcIT
EXPO_PUBLIC_AZURE_TENANT_ID=995b0936-48d6-40e5-a31e-bf689ec9446f

# Supabase Configuration (if not already set)
EXPO_PUBLIC_SUPABASE_URL=https://prsisvnraelrhiqnltju.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc2lzdm5yYWVscmhpcW5sdGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDY3MjcsImV4cCI6MjA2MzYyMjcyN30.LpFdyW4jAnkd6f6mv1Qnzr13EAQrEswS3hsZpm8Uk2A
```

## 📱 Platform Configuration

### iOS Configuration

Add to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.vera.app",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "com.vera.app.outlook",
            "CFBundleURLSchemes": ["com.vera.app"]
          }
        ]
      }
    }
  }
}
```

### Android Configuration

Add to your `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.vera.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "category": ["DEFAULT", "BROWSABLE"],
          "data": {
            "scheme": "com.vera.app"
          }
        }
      ]
    }
  }
}
```

## 🗄️ Database Setup

Run the Supabase migration to create the required tables:

```sql
-- This creates the user_email_accounts and extracted_email_data tables
-- The migration file is already included in your project
```

## 🚀 Usage

### 1. Connect Outlook Account

```typescript
import OutlookAuthButton from '@/components/auth/OutlookAuthButton';

function MyComponent() {
  return (
    <OutlookAuthButton
      onSuccess={() => console.log('Connected!')}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### 2. Display Processed Emails

```typescript
import EmailDataList from '@/components/email/EmailDataList';

function EmailsScreen() {
  return (
    <EmailDataList
      type="opportunity" // or "event", "time_sensitive", or undefined for all
      onItemPress={(item) => console.log('Email:', item)}
    />
  );
}
```

### 3. Manual Email Processing

```typescript
import { useOutlookAuth } from '@/hooks/useOutlookAuth';

function MyComponent() {
  const { processEmails, isProcessingEmails } = useOutlookAuth();
  
  const handleProcessEmails = async () => {
    await processEmails();
  };
  
  return (
    <Button 
      onPress={handleProcessEmails}
      disabled={isProcessingEmails}
      title="Process Emails"
    />
  );
}
```

## 🔍 Email Processing Keywords

The system automatically scans emails for these keywords:

### Opportunities
- "apply now", "application deadline", "job opening", "internship", "scholarship", "opportunity", "hiring", "position available", "career opportunity", "fellowship"

### Events
- "event", "meeting", "conference", "workshop", "seminar", "webinar", "presentation", "lecture", "networking", "info session"

### Time Sensitive
- "time sensitive", "urgent", "deadline", "expires", "limited time", "act fast", "ends soon", "final notice", "last chance", "immediate action"

## 📊 Data Extraction

The system extracts:

- **Dates**: Various date formats (MM/DD/YYYY, Month DD, YYYY, etc.)
- **Times**: 12-hour and 24-hour formats
- **Locations**: Addresses, venues, meeting places
- **Deadlines**: Application deadlines, expiration dates

## 🔒 Security Features

- **Token Encryption**: Access tokens are stored securely in Supabase
- **Token Refresh**: Automatic token refresh when expired
- **RLS Policies**: Row-level security ensures users only see their data
- **CSRF Protection**: State parameter validation in OAuth flow

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URIs in Azure AD exactly match your configuration
   - Check for trailing slashes or typos

2. **"Missing permissions"**
   - Verify all required permissions are granted in Azure AD
   - Check admin consent is provided

3. **"Token expired"**
   - The system automatically refreshes tokens
   - Check refresh token is valid in database

4. **"No emails processed"**
   - Verify user has emails matching the keywords
   - Check email account connection in database

### Debug Logs

Enable debug logging by checking the console for:
- `[OutlookAuth]` - Authentication flow
- `[EmailProcessor]` - Email processing
- `[useOutlookAuth]` - Hook operations

## 📈 Performance Considerations

- Email processing runs in background after authentication
- Rate limiting prevents API abuse (10 requests/minute)
- Only processes emails from last 7 days
- Caches processed emails to avoid duplicates

## 🔄 Updates and Maintenance

- Tokens are automatically refreshed before expiration
- Email processing can be triggered manually
- Database includes confidence scores for extracted data
- System tracks processing timestamps for debugging