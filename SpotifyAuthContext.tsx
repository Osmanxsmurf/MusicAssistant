import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SpotifyUserProfile, getUserProfile } from "../lib/spotify-api"; // Updated import

interface SpotifyAuthContextType {
  user: SpotifyUserProfile | null; // Updated type
  accessToken: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  exchangeCodeForToken: (code: string) => Promise<void>; // Add this line to expose the function
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | undefined>(
  undefined
);

export function SpotifyAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Explicit isAuthenticated state
  const [user, setUser] = useState<SpotifyUserProfile | null>(null); // Updated type
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/callback`;

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setError(null);
      // setIsAuthenticated(false); // Don't reset on every init, only on explicit logout or failure
      const storedAccessToken = localStorage.getItem("spotify_access_token");
      const storedRefreshToken = localStorage.getItem("spotify_refresh_token");
      const storedUser = localStorage.getItem("spotify_user");

      if (storedAccessToken && storedUser) {
        setAccessToken(storedAccessToken);
        setUser(JSON.parse(storedUser));
        if (storedRefreshToken) setRefreshTokenValue(storedRefreshToken);
        try {
          // Validate token by fetching user profile, refresh if necessary
          const profile = await getUserProfile(storedAccessToken);
          if (profile) {
            setUser(profile);
            localStorage.setItem("spotify_user", JSON.stringify(profile));
            setIsAuthenticated(true); // Set authenticated on successful validation
            setError(null);
          } else {
            throw new Error("Failed to fetch user profile with stored token or token invalid.");
          }
        } catch (e) {
          console.warn("Initial token validation failed, attempting refresh", e);
          try {
            await refreshAuthToken(storedRefreshToken);
          } catch (refreshError) {
            console.error("Initial refresh failed, logging out", refreshError);
            performLogout(); // Clear tokens and sets isAuthenticated to false
          }
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      // const code = urlParams.get('code'); // Removed as it's unused and handled by SpotifyCallbackPage
      const errorParam = urlParams.get("error");

      if (errorParam) {
        console.error("Spotify OAuth Error:", errorParam);
        setError(`Spotify authentication failed: ${errorParam}`);
        performLogout(); // Clear any partial auth state, sets isAuthenticated to false
        window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
        setIsLoading(false);
        return;
      }
      
      // if (code) { // SpotifyCallbackPage will handle the code exchange
      //   // console.log('initializeAuth found code, but SpotifyCallbackPage should handle it.');
      //   // window.history.replaceState({}, document.title, window.location.pathname); // Clean URL if code was present but won't be processed here
      // }
      setIsLoading(false);
    };

    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // clientId and redirectUri are stable, other dependencies are handled internally

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const login = async () => {
    if (!clientId) {
      console.error("Spotify Client ID not configured");
      setError("Spotify integration is not configured correctly.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      localStorage.setItem("code_verifier", codeVerifier);

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        scope: "user-read-private user-read-email playlist-read-private user-read-recently-played user-top-read streaming user-modify-playback-state user-read-playback-state",
      });
      window.location.href = `https://accounts.spotify.com/authorize?${params}`;
      // User will be redirected, no need to setIsLoading(false) here
    } catch (e) {
      console.error("Login initiation error:", e);
      setError("Could not initiate Spotify login.");
      setIsLoading(false);
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    const codeVerifier = localStorage.getItem("code_verifier");
    if (!codeVerifier) {
      console.error("Code verifier not found");
      setError("Spotify authentication process was interrupted. Please try again.");
      performLogout();
      setIsLoading(false);
      throw new Error("Code verifier not found");
    }
    if (!clientId) {
        console.error("Spotify Client ID not configured for token exchange");
        setError("Spotify integration is not configured correctly for token exchange.");
        performLogout();
        setIsLoading(false);
        throw new Error("Client ID not configured");
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId, // Ensure clientId is not null or undefined here
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to exchange code for token:", response.status, errorData);
        setError(`Spotify token exchange failed: ${response.status}. ${errorData}`);
        performLogout();
        throw new Error(`Failed to exchange code for token: ${errorData}`);
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      if (data.refresh_token) {
        setRefreshTokenValue(data.refresh_token);
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.removeItem("code_verifier"); // Crucial step: remove verifier after use
      const userProfile = await getUserProfile(data.access_token);
      if (userProfile) {
        setUser(userProfile);
        localStorage.setItem("spotify_user", JSON.stringify(userProfile));
        setIsAuthenticated(true); // Set authenticated on full success
        setError(null);
      } else {
        // If profile fetch fails after successful token exchange, something is wrong.
        setIsAuthenticated(false); // Ensure not authenticated
        setError("Failed to fetch user profile after obtaining tokens.");
        throw new Error("Failed to fetch profile after exchanging code for token.");
      }
    } catch (error) {
      console.error("Error during token exchange or profile fetch:", error);
      // setError might have been set by getUserProfile or above
      if (!error) setError("An unexpected error occurred during login.");
      performLogout(); // Ensure cleanup on any error in this block
      throw error; // Re-throw to be caught by initializeAuth if called from there
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuthToken = async (currentRefreshToken?: string | null) => {
    const tokenToRefresh = currentRefreshToken || refreshTokenValue;
    if (!tokenToRefresh) {
      setError("No refresh token available.");
      performLogout();
      return;
    }
    if (!clientId) {
        setError("Spotify Client ID not configured for token refresh.");
        performLogout();
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenToRefresh,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to refresh token:", response.status, errorData);
        setError(`Spotify token refresh failed: ${response.status}. ${errorData}`);
        performLogout(); // Logout if refresh fails
        throw new Error(`Failed to refresh token: ${errorData}`);
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      localStorage.setItem("spotify_access_token", data.access_token);
      // Spotify might issue a new refresh token, but often doesn't if the old one is still valid.
      if (data.refresh_token) {
        setRefreshTokenValue(data.refresh_token);
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }
      
      // Re-fetch user profile with the new access token
      const userProfile = await getUserProfile(data.access_token);
      if (userProfile) {
        setUser(userProfile);
        localStorage.setItem("spotify_user", JSON.stringify(userProfile));
        setIsAuthenticated(true); // Set authenticated on successful refresh and profile fetch
        setError(null);
      } else {
        setError("Failed to fetch user profile after refreshing token.");
        performLogout(); // If profile fetch fails, logout
        throw new Error("Failed to fetch user profile after refreshing token.");
      }
    } catch (e) {
      console.error("Error during token refresh process:", e);
      // setError is likely already set, performLogout called.
      // If not, ensure logout state is achieved.
      if (isAuthenticated) performLogout(); // Ensure logout if error occurred during an authenticated session refresh attempt
    } finally {
      setIsLoading(false);
    }
  };

  // Renamed to performLogout to avoid conflict with 'logout' in context value if it were not an alias
  const performLogout = () => {
    setIsAuthenticated(false); // Explicitly set isAuthenticated to false
    setUser(null);
    setAccessToken(null);
    setRefreshTokenValue(null);
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("code_verifier");
    setError(null); // Clear any errors on logout
    setIsLoading(false); // Ensure loading is false on logout
  };

  const value: SpotifyAuthContextType = {
    user,
    accessToken,
    isAuthenticated, // Use the state variable
    login,
    logout: performLogout, // Use the internal performLogout function
    refreshToken: () => refreshAuthToken(), // Ensure it calls the internal refreshAuthToken
    isLoading,
    error,
    exchangeCodeForToken, // Expose the exchangeCodeForToken function
  };

  return (
    <SpotifyAuthContext.Provider value={value}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export const useSpotifyAuth = (): SpotifyAuthContextType => {
  const context = useContext(SpotifyAuthContext);
  if (context === undefined) {
    throw new Error("useSpotifyAuth must be used within a SpotifyAuthProvider");
  }
  return context;
};
