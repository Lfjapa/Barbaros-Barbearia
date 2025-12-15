import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    setDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

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
    // transactionData should have: barberId, serviceIds, total, method, userId (who registered)
    const total = Number(transactionData.total);
    const commissionRate = 0.40; // 40% for the barber
    const commissionAmount = total * commissionRate;
    const revenueAmount = total - commissionAmount; // 60% for the house

    const docRef = await addDoc(collection(db, "transactions"), {
        ...transactionData,
        total,
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
export async function getTransactionsByRange(startDate, endDate, barberId = null) {
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
                // Empty array provided, means "no matching IDs", return empty immediately or just query normally?
                // If we want SPECIFIC IDs and get None, we should return empty.
                return [];
            }
        } else {
            constraints.push(where("barberId", "==", barberId));
        }
    }

    const q = query(
        collection(db, "transactions"),
        ...constraints
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDailyTransactions() {
    // Reusing the range function for "Today"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return getTransactionsByRange(startOfDay, endOfDay);
}

export async function getBarberIdsByEmail(email) {
    if (!email) return [];
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
}
