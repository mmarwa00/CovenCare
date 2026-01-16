import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebaseConfig';


/**
 * Registers a new user with email and password, and creates a user profile
 * document in the Firestore 'users' collection.
 * Firebase handles password hashing automatically (no need for bcrypt).
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

        // First we create the user in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Then we create the user profile document in Firestore
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
        // Catches network errors, weak passwords, email-already-in-use, etc.
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
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email was sent!');
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error.message);
        return { success: false, error: error.message };
    }
};