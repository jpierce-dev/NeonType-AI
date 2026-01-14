import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyC8JHxRBnRzV9LwzvdUkwwoqiW-LU9EvJs",
    authDomain: "neontype-543c9.firebaseapp.com",
    projectId: "neontype-543c9",
    storageBucket: "neontype-543c9.firebasestorage.app",
    messagingSenderId: "998219857146",
    appId: "1:998219857146:web:3cf4b25f056f802c56dd43",
    measurementId: "G-V0RXX967E6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const logAppEvent = (eventName: string, params?: Record<string, any>) => {
    logEvent(analytics, eventName, params);
};

export { app, analytics };
