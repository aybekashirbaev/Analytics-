# Threads to Income Analytics Dashboard

Deploy this folder as a new Vercel project. The dashboard is protected by Google sign-in and only allows the email in `ALLOWED_EMAIL`.

## Vercel environment variables

Add every value from `.env.example` in **Project Settings → Environment Variables**. Encode the downloaded Google service-account JSON before pasting it into `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\service-account.json'))
```

Never commit or paste the raw JSON key into source control or chat.

## Google OAuth

In Google Cloud, create a Web application OAuth client and add these authorized redirect URIs after Vercel gives you a production URL:

`https://YOUR-VERCEL-DOMAIN/api/auth/callback/google`

For local development also add:

`http://localhost:3000/api/auth/callback/google`
