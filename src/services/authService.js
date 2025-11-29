import {
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';


//don't need to hash the password, firebase does it for me uses bycript + salt
export const registerUser = async (email, password, displayName) => {
  try {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      displayName: displayName || '',
      profilePicture: null,
      circles: [],
      createdAt: new Date(),
      isVerified: false
    });

    console.log('Registration completed!', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error.message);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Loged in successfully!');
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error.message);
    return { success: false, error: error.message };
  }
};


export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('Logged out');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Email was sent!');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};