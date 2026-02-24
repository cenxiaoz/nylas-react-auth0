import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { NylasConnect } from "@nylas/connect";

const clientId = import.meta.env.VITE_NYLAS_CLIENT_ID ?? "your-nylas-client-id";
const redirectUri =
  import.meta.env.VITE_NYLAS_REDIRECT_URI ?? window.location.origin;
const nylasApiUrl = "https://api.us.nylas.com";

function NylasCallbackPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

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

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const result = await nylasConnect.callback();
        console.log(result);
        if (!cancelled) {
          setStatus("success");
          navigate("/integration", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message ?? "Callback failed");
        }
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [nylasConnect, navigate]);

  if (status === "loading") {
    return (
      <div className="integration-page">
        <h1>Connecting to Nylas…</h1>
        <p>Completing sign-in, please wait.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="integration-page">
        <h1>Connection failed</h1>
        <p className="error-msg">{error}</p>
        <Link to="/integration" className="nav-link">
          Back to Integration
        </Link>
      </div>
    );
  }

  return null;
}

export default NylasCallbackPage;
