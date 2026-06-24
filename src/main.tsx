import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global API Request Interceptor for JWT and Automatic Session Expiry
const originalFetch = window.fetch.bind(window);
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
 const url = typeof input === "string" 
 ? input 
 : (input instanceof Request ? input.url : String(input));
 
 if (url.startsWith("/api/")) {
 const token = localStorage.getItem("simtesis_token");
 if (token) {
 init = init || {};
 const headers = new Headers(init.headers || {});
 if (!headers.has("Authorization")) {
 headers.set("Authorization", `Bearer ${token}`);
 }
 init.headers = headers;
 }
 }
 
 const response = await originalFetch(input, init);
 
 // If unauthorized/session expired, auto logout (except during login or public config fetch)
 if (
 (response.status === 401 || response.status === 403) && 
 !url.includes("/api/login") && 
 !url.includes("/api/public-config")
 ) {
 localStorage.removeItem("simtesis_user");
 localStorage.removeItem("simtesis_token");
 window.location.reload();
 }
 
 return response;
};

try {
 Object.defineProperty(window, 'fetch', {
 value: customFetch,
 configurable: true,
 writable: true,
 enumerable: true
 });
} catch (err) {
 console.warn("Failed to intercept window.fetch via Object.defineProperty:", err);
 try {
 window.fetch = customFetch;
 } catch (err2) {
 console.error("Failed to reassign window.fetch:", err2);
 }
}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <App />
 </StrictMode>,
);

