import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export async function getSystemSettings() {
    try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return { commissionRate: 0.40 };
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        return { commissionRate: 0.40 };
    }
}

export async function saveSystemSettings(settings) {
    const docRef = doc(db, "settings", "general");
    await setDoc(docRef, settings, { merge: true });
}

export async function getServices() {
    const querySnapshot = await getDocs(collection(db, "services"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addService(serviceData) {
    const docRef = await addDoc(collection(db, "services"), serviceData);
    return docRef.id;
}

export async function deleteService(serviceId) {
    await deleteDoc(doc(db, "services", serviceId));
}

export async function updateService(serviceId, serviceData) {
    const docRef = doc(db, "services", serviceId);
    await updateDoc(docRef, serviceData);
}

export async function getBarbers() {
    const q = query(collection(db, "users"), where("role", "==", "barber"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addBarber(barberData) {
    const docRef = await addDoc(collection(db, "users"), {
        ...barberData,
        role: 'barber',
        isActive: true // Default to active
    });
    return docRef.id;
}

export async function updateBarber(barberId, data) {
    const docRef = doc(db, "users", barberId);
    await updateDoc(docRef, data);
}

export async function deleteBarber(barberId) {
    await deleteDoc(doc(db, "users", barberId));
}

export async function addTransaction(transactionData) {
    // transactionData should have: barberId, serviceIds, total, method, userId (who registered), commissionRate (optional)
    const total = Number(transactionData.total);
    
    // Use provided commissionRate or default to 0.40 if not provided (though UI should provide it)
    // We prioritize the rate passed in transactionData to ensure historical accuracy if rules change
    const commissionRate = transactionData.commissionRate !== undefined 
        ? Number(transactionData.commissionRate) 
        : 0.40; 

    const commissionAmount = total * commissionRate;
    const revenueAmount = total - commissionAmount;

    const docRef = await addDoc(collection(db, "transactions"), {
        ...transactionData,
        total,
        commissionRate, // Store the rate used
        commissionAmount,
        revenueAmount,
        date: Timestamp.now()
    });
    return docRef.id;
}

export async function getHistory(barberId) {
    // If barberId is provided, filter by it. Otherwise show all
    let constraints = [orderBy("date", "desc")];

    if (barberId) {
        constraints.push(where("barberId", "==", barberId));
    }

    let q = query(
        collection(db, "transactions"),
        ...constraints
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj = data.date.toDate();
        return {
            id: doc.id,
            ...data,
            createdAt: dateObj,
            date: dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    });
}

// Flexible function for reports
// Flexible function for reports
export async function getTransactionsByRange(startDate, endDate, barberId = null, lastDoc = null, limitSize = null) {
    // Ensure dates are Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    let constraints = [
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "desc")
    ];

    if (barberId) {
        if (Array.isArray(barberId)) {
            if (barberId.length > 0) {
                // Firestore 'in' matches any value in the array (max 10)
                constraints.push(where("barberId", "in", barberId));
            } else {
                return { data: [], lastVisible: null };
            }
        } else {
            constraints.push(where("barberId", "==", barberId));
        }
    }

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    if (limitSize) {
        constraints.push(limit(limitSize));
    }

    const q = query(
        collection(db, "transactions"),
        ...constraints
    );

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { data, lastVisible };
}

export async function getDailyTransactions() {
    // Reusing the range function for "Today"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await getTransactionsByRange(startOfDay, endOfDay);
    return result.data;
}

export async function getBarberIdsByEmail(email) {
    if (!email) return [];
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
}
