import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAb_DdrQBhFjzQshy2zQHEx6_UHO8gtIwI",
  authDomain: "smart-schedule-app-31eeb.firebaseapp.com",
  projectId: "smart-schedule-app-31eeb",
  storageBucket: "smart-schedule-app-31eeb.appspot.com", // Phải sử dụng appspot.com
  messagingSenderId: "611842417786",
  appId: "1:611842417786:android:19ecce98c0b554db1387c3"
};

// Initialize Firebase
initializeApp(firebaseConfig);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '611842417786-56vqqp9ubfpkc47jmh7qaqof3t4f2fj4.apps.googleusercontent.com',
  offlineAccess: Platform.OS === 'android',
});

// Enable Firestore persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Firebase collections references
export const usersCollection = firestore().collection('users');
export const eventsCollection = firestore().collection('events');
export const tasksCollection = firestore().collection('tasks');
export const suggestionsCollection = firestore().collection('suggestions');
export const analyticsCollection = firestore().collection('analytics');

// Helper functions for Firebase authentication
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    // Ensure Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Start Google Sign-In
    const userInfo = await GoogleSignin.signIn();

    // Get ID token from Google
    const { idToken } = await GoogleSignin.getTokens();

    // Create Firebase credential from ID token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in with Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);
    return userCredential.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth().signOut();

    // Gọi hàm GoogleSignin.getCurrentUser() để lấy thông tin người dùng hiện tại
    const googleUser = await GoogleSignin.getCurrentUser();
    // Kiểm tra nếu người dùng đăng nhập bằng Google
    if (googleUser !== null) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

export const getCurrentUser = () => auth().currentUser;

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    // Trong phiên bản mới của Firebase, exists là thuộc tính, không phải hàm
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const createUserProfile = async (userId: string, userData: any) => {
  try {
    await usersCollection.doc(userId).set(userData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserData = async (userId: string, data: any) => {
  try {
    await usersCollection.doc(userId).update(data);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

export const uploadFile = async (
  uri: string,
  path: string,
  onProgress?: (progress: number) => void
) => {
  try {
    const reference = storage().ref(path);
    const task = reference.putFile(uri);

    if (onProgress) {
      task.on('state_changed', snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      });
    }

    await task;
    const downloadURL = await reference.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Export everything
export default {
  auth,
  firestore,
  storage,
  usersCollection,
  eventsCollection,
  tasksCollection,
  suggestionsCollection,
  analyticsCollection,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getUserData,
  createUserProfile,
  updateUserData,
  uploadFile,
};