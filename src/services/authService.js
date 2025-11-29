import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
    // Note: No need to import initializeAuth or persistence helpers here!
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// IMPORTANT: This assumes 'auth' and 'db' are correctly initialized 
// and exported from your configuration file, including persistence setup.
import { auth, db } from '../config/firebaseConfig';


/**
 * Registers a new user with email and password, and creates a user profile
 * document in the Firestore 'users' collection.
 * * Firebase handles password hashing automatically (no need for bcrypt).
 * @param {string} email - The user's email address.
 * @param {string} password - The user's desired password.
 * @param {string} displayName - The user's display name.
 * @returns {{success: boolean, user: object | undefined, error: string | undefined}}
 */
export const registerUser = async (email, password, displayName) => {
    try {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Create the user profile document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            displayName: displayName || '',
            profilePicture: null,
            circles: [],
            createdAt: new Date(),
            isVerified: false
        });

        console.log('Registration completed! User UID:', user.uid);
        return { success: true, user };
    } catch (error) {
        // Catch network errors, weak passwords, email-already-in-use, etc.
        console.error('Registration error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Logs a user in using email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {{success: boolean, user: object | undefined, error: string | undefined}}
 */
export const loginUser = async (email, password) => {
    try {
        // Use the modular function syntax
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in successfully!');
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error.message);
        return { success: false, error: error.message };
    }
};


/**
 * Logs out the currently signed-in user.
 * @returns {{success: boolean, error: string | undefined}}
 */
export const logoutUser = async () => {
    try {
        // Use the modular function syntax
        await signOut(auth);
        console.log('Logged out');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a password reset email to the specified email address.
 * @param {string} email - The user's email address.
 * @returns {{success: boolean, error: string | undefined}}
 */
export const resetPassword = async (email) => {
    try {
        // Use the modular function syntax
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email was sent!');
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error.message);
        return { success: false, error: error.message };
    }
};