import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

// Retrieve Firebase Config from environment variables
// This prevents GitHub from blocking the repository export due to secret scanning
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy"
};

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Required scopes for Google Calendar and Google Meet link generation
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Load cached token from memory during search
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Clear or wait for manual sign in to obtain access token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    if (!token) {
      throw new Error("Gagal mengambil token akses Google Workspace dari OAuth pop-up.");
    }
    
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error("Kesalahan masuk Google OAuth:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface GoogleEventResponse {
  id: string;
  htmlLink: string;
  meetLink: string | null;
}

/**
 * Creates an event on the user's Primary Google Calendar and creates a Google Meet video bridge.
 */
export const createGoogleCalendarEvent = async (
  accessToken: string,
  event: {
    summary: string;
    description: string;
    tanggal: string; // YYYY-MM-DD
    waktu: string;   // HH:MM
    durationMinutes?: number;
    ruangan?: string;
    attendees: string[]; // List of emails
  }
): Promise<GoogleEventResponse> => {
  const duration = event.durationMinutes || 90;
  
  // Parse date and time in local timezone context
  const startDateTime = `${event.tanggal}T${event.waktu}:00`;
  const startDateObj = new Date(startDateTime);
  
  // Calculate end datetime
  const endDateObj = new Date(startDateObj.getTime() + duration * 60 * 1000);
  
  // Convert to ISO-8601 strings
  const startISO = startDateObj.toISOString();
  const endISO = endDateObj.toISOString();

  const formattedAttendees = event.attendees
    .filter(email => email && email.includes("@"))
    .map(email => ({ email }));

  const eventPayload = {
    summary: event.summary,
    location: event.ruangan || "Google Meet Online Meeting",
    description: event.description,
    start: {
      dateTime: startISO,
      timeZone: "Asia/Jakarta" // Default region time
    },
    end: {
      dateTime: endISO,
      timeZone: "Asia/Jakarta"
    },
    attendees: formattedAttendees,
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    }
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventPayload)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Fetch Google Meet bridge URL of type "video"
  let meetLink: string | null = null;
  if (data.conferenceData && data.conferenceData.entryPoints) {
    const videoEntryPoint = data.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === "video"
    );
    if (videoEntryPoint) {
      meetLink = videoEntryPoint.uri;
    }
  }

  return {
    id: data.id,
    htmlLink: data.htmlLink,
    meetLink: meetLink
  };
};
