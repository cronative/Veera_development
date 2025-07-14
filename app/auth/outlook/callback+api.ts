export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      console.error('[Outlook Callback] OAuth error:', error);
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              .error { color: #e74c3c; }
              .button {
                background: #3498db;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                text-decoration: none;
                display: inline-block;
                margin-top: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">Authentication Failed</h2>
              <p>There was an error connecting to your Outlook account: ${error}</p>
              <a href="/" class="button">Return to App</a>
            </div>
            <script>
              // Try to close the window if opened in a popup
              if (window.opener) {
                window.opener.postMessage({ type: 'OUTLOOK_AUTH_ERROR', error: '${error}' }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Handle successful authentication
    if (code) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              .success { color: #27ae60; }
              .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="success">✓ Authentication Successful</h2>
              <p>Your Outlook account has been connected successfully.</p>
              <div class="loading"></div>
              <p>Processing your emails...</p>
            </div>
            <script>
              // Notify the parent window of successful authentication
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OUTLOOK_AUTH_SUCCESS', 
                  code: '${code}',
                  state: '${state}'
                }, '*');
                window.close();
              } else {
                // Redirect to main app after a delay
                setTimeout(() => {
                  window.location.href = '/';
                }, 3000);
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // No code or error - invalid callback
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Callback</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            .button {
              background: #3498db;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              text-decoration: none;
              display: inline-block;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Invalid Authentication Callback</h2>
            <p>The authentication callback is missing required parameters.</p>
            <a href="/" class="button">Return to App</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('[Outlook Callback] Error processing callback:', error);
    
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Callback Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="text-align: center; padding: 2rem;">
            <h2>Authentication Error</h2>
            <p>An unexpected error occurred during authentication.</p>
            <a href="/">Return to App</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}