import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
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
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch role from Firestore
        await fetchUserRole(userCredential.user.uid);
        return userCredential;
    }

    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    name: user.displayName,
                    role: 'barber',
                    photoURL: user.photoURL
                });
                setUserRole('barber');
            } else {
                setUserRole(userDoc.data().role);
            }
            return result;
        } catch (error) {
            // Fallback for browsers que bloqueiam popups (Safari, ITP)
            if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
                await signInWithRedirect(auth, googleProvider);
                return null;
            }
            throw error;
        }
    }

    async function fetchUserRole(uid) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserData(data);
        } else {
            console.error("User profile not found in Firestore");
            setUserRole('barber'); // Fallback
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
                    const data = userDoc.data();
                    setUserRole(data.role);
                    setUserData(data);
                }
            } else {
                setUserRole(null);
                setUserData(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Handle redirect result for Google login (production fallback)
    useEffect(() => {
        (async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    const user = result.user;
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (!userDoc.exists()) {
                        await setDoc(userDocRef, {
                            email: user.email,
                            name: user.displayName,
                            role: 'barber',
                            photoURL: user.photoURL
                        });
                        setUserRole('barber');
                    } else {
                        setUserRole(userDoc.data().role);
                    }
                }
            } catch (e) {
                // silent
            }
        })();
    }, []);

    const value = {
        currentUser,
        userRole,
        userData,
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
