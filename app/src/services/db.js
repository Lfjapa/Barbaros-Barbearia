import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
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
    // barberData: { name, email, ... }
    // ideally we would create auth user here, but client SDK can't create other users easily
    // so we just add to "users" collection. User must sign up with matching email or we control auth differently.
    // For simplicity, we just add a doc. ID will be auto-generated if we use addDoc,
    // but usually users have auth uid. Let's use addDoc for now as a "profile placeholder"
    const docRef = await addDoc(collection(db, "users"), {
        ...barberData,
        role: 'barber'
    });
    return docRef.id;
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
    // If barberId is provided, filter by it. Otherwise show all (for admin?)
    // For now, let's just get the last 20 transactions
    let q = query(
        collection(db, "transactions"),
        where("barberId", "==", barberId),
        orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj = data.date.toDate();
        return {
            id: doc.id,
            ...data,
            createdAt: dateObj, // Return raw Date object for filtering
            date: dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    });
}

// Flexible function for reports
export async function getTransactionsByRange(startDate, endDate) {
    // Ensure dates are Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    const q = query(
        collection(db, "transactions"),
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "desc")
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
