import { useState, useEffect, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { NylasConnect } from "@nylas/connect";

const clientId = import.meta.env.VITE_NYLAS_CLIENT_ID ?? "your-nylas-client-id";
const redirectUri = 'http://localhost:5173/integration/callback';
const nylasApiUrl = "https://api.us.nylas.com";

function IntegrationPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [apiOutput, setApiOutput] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const [apiOutput2, setApiOutput2] = useState(null);
  const [apiLoading2, setApiLoading2] = useState(false);
  const [error2, setError2] = useState(null);

  const nylasConnect = useMemo(
    () =>
      new NylasConnect({
        clientId,
        redirectUri,
        apiUrl: nylasApiUrl,
        identityProviderToken: async () => {
          try {
            return await getAccessTokenSilently();
          } catch {
            return null;
          }
        },
      }),
    [getAccessTokenSilently]
  );

  const loadSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await nylasConnect.getSession();
      setSession(s);
    } catch (err) {
      setError(err?.message ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [nylasConnect]);

  useEffect(() => {
    const unsubscribe = nylasConnect.onConnectStateChange((event, newSession) => {
      if (event === "CONNECT_SUCCESS" || event === "SIGNED_IN") {
        setSession(newSession ?? null);
        setConnecting(false);
      } else if (event === "SIGNED_OUT" || event === "CONNECT_ERROR") {
        setSession(null);
        setConnecting(false);
      }
    });
    return () => unsubscribe?.();
  }, [nylasConnect]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const result = await nylasConnect.connect({ method: "inline" });
      console.log(result);
      window.location.href = result;
    } catch (err) {
      setError(err?.message ?? "Connection failed");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await nylasConnect.logout();
      setSession(null);
      setApiOutput(null);
    } catch (err) {
      setError(err?.message ?? "Disconnect failed");
    }
  };

  const handleTestNylasApi = async () => {
    if (!session?.accessToken || !session?.grantId) return;
    setApiLoading(true);
    setError(null);
    setApiOutput(null);
    try {
      const res = await fetch(
        `${nylasApiUrl}/v3/grants/${session.grantId}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }
      setApiOutput({ status: res.status, statusText: res.statusText, data });
    } catch (err) {
      setError(err?.message ?? "Nylas API call failed");
      setApiOutput({ error: err?.message ?? String(err) });
    } finally {
      setApiLoading(false);
    }
  };

  const handleTestNylasApiUsingAuth0AccessToken = async () => {
    setApiLoading2(true);
    setError2(null);
    setApiOutput2(null);
    try {
      const token = await getAccessTokenSilently();
      // Parse user ID from JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      const res = await fetch(
        `${nylasApiUrl}/v3/grants/${session.grantId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'X-Nylas-External-User-Id': userId,
          },
        }
      );
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }
      setApiOutput2({ status: res.status, statusText: res.statusText, data });
    } catch (err) {
      setError2(err?.message ?? "Nylas API call failed");
      setApiOutput2({ error: err?.message ?? String(err) });
    } finally {
      setApiLoading2(false);
    }
  };

  if (loading) {
    return (
      <div className="integration-page">
        <h1>Integration</h1>
        <p>Loading Nylas connection status…</p>
      </div>
    );
  }

  return (
    <div className="integration-page">
      <h1>Integration</h1>

      <section className="integration-card">
        <h2>Nylas</h2>
        <p className="integration-desc">
          Connect your email, calendar, or contacts via Nylas.
        </p>

        {error && <p className="error-msg">{error}</p>}
        {error2 && <p className="error-msg">{error2}</p>}

        {session ? (
          <div className="integration-status-wrap">
            <div className="integration-status">
              <p className="integration-connected">
                Connected as{" "}
                <strong>{session.grantInfo?.email ?? "Unknown"}</strong>
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </div>
            <div className="integration-api-test">
              <button
                type="button"
                className="btn-primary"
                onClick={handleTestNylasApi}
                disabled={apiLoading}
              >
                {apiLoading ? "Calling…" : "Test Nylas API using Nylas Session Access Token"}
              </button>
              {apiOutput && (
                <pre className="api-output">
                  {JSON.stringify(apiOutput, null, 2)}
                </pre>
              )}
            </div>
            <div className="integration-api-test">
              <button
                type="button"
                className="btn-primary"
                onClick={handleTestNylasApiUsingAuth0AccessToken}
                disabled={apiLoading2}
              >
                {apiLoading2 ? "Calling…" : "Test Nylas API using Auth0 Access Token"}
              </button>
              {apiOutput2 && (
                <pre className="api-output">
                  {JSON.stringify(apiOutput2, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting…" : "Connect with Nylas"}
          </button>
        )}
      </section>
    </div>
  );
}

export default IntegrationPage;
