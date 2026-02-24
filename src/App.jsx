import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, NavLink } from "react-router-dom";
import IntegrationPage from "./IntegrationPage.jsx";
import NylasCallbackPage from "./NylasCallbackPage.jsx";
import "./App.css";

function App() {
  const {
    isLoading, // Loading state, the SDK needs to reach Auth0 on load
    isAuthenticated,
    error,
    loginWithRedirect: login, // Starts the login flow
    logout: auth0Logout, // Starts the logout flow
    user, // User profile
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) return "Loading...";

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Auth0 Sample</span>
        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/integration"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            Integration
          </NavLink>
        </div>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <span className="user-email" title={user?.email}>
                {user?.email}
              </span>
              <button type="button" className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={signup}>
                Signup
              </button>
              <button type="button" className="btn-primary" onClick={login}>
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="main">
        {error && <p className="error-msg">Error: {error.message}</p>}

        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <>
                  <h1>User Profile</h1>
                  <pre>{JSON.stringify(user, null, 2)}</pre>
                </>
              ) : (
                <h1>Welcome</h1>
              )
            }
          />
          <Route path="/integration" element={<IntegrationPage />} />
          <Route
            path="/integration/callback"
            element={<NylasCallbackPage />}
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
