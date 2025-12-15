import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' | 'barber'
    const [loading, setLoading] = useState(true);

    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch role from Firestore
        await fetchUserRole(userCredential.user.uid);
        return userCredential;
    }

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user -> Create as Barber
            await setDoc(userDocRef, {
                email: user.email,
                name: user.displayName,
                role: 'barber',
                photoURL: user.photoURL
            });
            setUserRole('barber');
        } else {
            // Existing user -> Get Role
            setUserRole(userDoc.data().role);
        }
        return result;
    }

    async function fetchUserRole(uid) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
        } else {
            console.error("User profile not found in Firestore");
            setUserRole('barber'); // Fallback to barber if profile missing
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch role again on page reload to persist state
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
            } else {
                setUserRole(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        login,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
