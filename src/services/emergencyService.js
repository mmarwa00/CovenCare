import { db } from '../config/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

// Emergency types
export const EMERGENCY_TYPES = {
  TAMPON: 'tampon',
  PADS: 'pads',
  PAINKILLER: 'painkiller',
  HEATING_PAD: 'heating_pad',
  THE_EAR: 'the_ear',
  THE_PMS: 'the_pms'
};

// Predefined response messages (used by UI)
export const PREDEFINED_RESPONSES = [
  "On my way! 🏃‍♀️",
  "Sending care package! 📦",
  "Can't right now but ❤️",
  "I'll be there in 10 minutes!",
  "Heading to the store now! 🛒"
];

const CANT_PHRASE = "Can't right now but ❤️";

// Create emergency alert
export const createEmergency = async (senderId, circleId, type, recipients, message = '') => {
  try {
    console.log('createEmergency called with:', { senderId, circleId, type, recipients, message });

    
    if (!senderId || !circleId || !type) throw new Error('Sender ID, circle ID, and type are required');
    if (!recipients || recipients.length === 0) throw new Error('At least one recipient is required');

    const validTypes = Object.values(EMERGENCY_TYPES);
    if (!validTypes.includes(type)) throw new Error(`Invalid emergency type. Must be one of: ${validTypes.join(', ')}`);

    const senderDoc = await getDoc(doc(db, 'users', senderId));
    if (!senderDoc.exists()) throw new Error('Sender not found');

    const now = new Date();
    const autoResolveAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log('About to create emergency in Firestore...');
    
    const emergencyRef = await addDoc(collection(db, 'emergencies'), {
      senderId,
      senderName: senderDoc.data().displayName || '',
      circleId,
      type,
      recipients,
      message: message || '',
      status: 'active',
      responses: [],
      createdAt: Timestamp.fromDate(now),
      autoResolveAt: Timestamp.fromDate(autoResolveAt)
    });

    console.log('Emergency created successfully:', emergencyRef.id);
    return { success: true, emergencyId: emergencyRef.id, autoResolveAt };
  } catch (error) {
    console.error('Error creating emergency:', error);
    console.error('Error details:', error.message, error.code);
    return { success: false, error: error.message };
  }
};

// Get active emergencies for user
export const getActiveEmergencies = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const emergenciesRef = collection(db, 'emergencies');
    const q = query(
      emergenciesRef,
      where('recipients', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emergencies = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      emergencies.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        autoResolveAt: data.autoResolveAt?.toDate ? data.autoResolveAt.toDate() : data.autoResolveAt
      });
    }

    console.log('Got active emergencies:', emergencies.length);
    return { success: true, emergencies };
  } catch (error) {
    console.error('Error getting emergencies:', error);
    return { success: false, error: error.message };
  }
};

// Get emergencies sent by user
export const getSentEmergencies = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const emergenciesRef = collection(db, 'emergencies');
    const q = query(
      emergenciesRef,
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emergencies = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        autoResolveAt: data.autoResolveAt?.toDate ? data.autoResolveAt.toDate() : data.autoResolveAt
      };
    });

    console.log('Got sent emergencies:', emergencies.length);
    return { success: true, emergencies };
  } catch (error) {
    console.error('Error getting sent emergencies:', error);
    return { success: false, error: error.message };
  }
};

// Resolve emergency manually (sender only)
export const resolveEmergency = async (emergencyId, userId) => {
  try {
    if (!emergencyId || !userId) throw new Error('Emergency ID and user ID are required');

    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencyDoc = await getDoc(emergencyRef);
    if (!emergencyDoc.exists()) throw new Error('Emergency not found');

    const emergencyData = emergencyDoc.data();
    if (emergencyData.senderId !== userId) throw new Error('Only the sender can resolve this emergency');
    if (emergencyData.status === 'resolved') return { success: true, message: 'Emergency already resolved' };

    await updateDoc(emergencyRef, {
      status: 'resolved',
      resolvedAt: Timestamp.now(),
      resolvedBy: userId
    });

    console.log('Emergency resolved:', emergencyId);
    return { success: true };
  } catch (error) {
    console.error('Error resolving emergency:', error);
    return { success: false, error: error.message };
  }
};

// Get emergency details
export const getEmergencyDetails = async (emergencyId) => {
  try {
    if (!emergencyId) throw new Error('Emergency ID is required');

    const emergencyDoc = await getDoc(doc(db, 'emergencies', emergencyId));
    if (!emergencyDoc.exists()) throw new Error('Emergency not found');

    const data = emergencyDoc.data();
    const recipientDetails = [];

    for (const recipientId of data.recipients || []) {
      const userDoc = await getDoc(doc(db, 'users', recipientId));
      if (userDoc.exists()) {
        recipientDetails.push({
          userId: recipientId,
          displayName: userDoc.data().displayName,
          profilePicture: userDoc.data().profilePicture
        });
      }
    }

    return {
      success: true,
      emergency: {
        id: emergencyDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        autoResolveAt: data.autoResolveAt?.toDate ? data.autoResolveAt.toDate() : data.autoResolveAt,
        resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : data.resolvedAt,
        recipientDetails
      }
    };
  } catch (error) {
    console.error('Error getting emergency details:', error);
    return { success: false, error: error.message };
  }
};

// Respond to emergency (transactional, preserves responses and returns updated emergency)
export const respondToEmergency = async (emergencyId, userId, responseMessage) => {
  try {
    if (!emergencyId || !userId || !responseMessage) throw new Error('Emergency ID, user ID, and response message are required');

    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const isCant = responseMessage?.toLowerCase().trim() === CANT_PHRASE.toLowerCase().trim();
    const isPositive = !isCant;

    // Run transaction to append response and optionally resolve
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(emergencyRef);
      if (!snap.exists()) throw new Error('Emergency not found');

      const data = snap.data();

      // Only recipients can respond
      if (!Array.isArray(data.recipients) || !data.recipients.includes(userId)) {
        throw new Error('Only recipients can respond to this emergency');
      }

      // Get responder name
      const userRef = doc(db, 'users', userId);
      const userSnap = await tx.get(userRef);
      const userName = userSnap.exists() ? userSnap.data().displayName : 'Unknown';

      const response = {
        userId,
        userName,
        message: responseMessage,
        timestamp: Timestamp.now()
      };

      const currentResponses = Array.isArray(data.responses) ? data.responses : [];
      const newResponses = [...currentResponses, response];

      const updatePayload = { responses: newResponses };

      // If positive and not already resolved, mark resolved
      if (isPositive && data.status !== 'resolved') {
        updatePayload.status = 'resolved';
        updatePayload.resolvedAt = Timestamp.now();
        updatePayload.resolvedBy = userId;
      }

      tx.update(emergencyRef, updatePayload);
    });

    // Fetch updated doc so caller gets latest responses/status
    const updatedSnap = await getDoc(emergencyRef);
    const updatedData = updatedSnap.exists() ? updatedSnap.data() : null;

    if (updatedData) {
      const formatted = {
        id: updatedSnap.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate ? updatedData.createdAt.toDate() : updatedData.createdAt,
        autoResolveAt: updatedData.autoResolveAt?.toDate ? updatedData.autoResolveAt.toDate() : updatedData.autoResolveAt,
        resolvedAt: updatedData.resolvedAt?.toDate ? updatedData.resolvedAt.toDate() : updatedData.resolvedAt
      };
      console.log('respondToEmergency success', { emergencyId, userId, responseMessage });
      return { success: true, emergency: formatted };
    }

    return { success: true };
  } catch (error) {
    console.error('respondToEmergency error', error);
    return { success: false, error: error.message };
  }
};

// Helper to compute time until auto-resolve
export const getTimeUntilAutoResolve = (autoResolveAt) => {
  const now = new Date();
  const resolveTime = autoResolveAt instanceof Date ? autoResolveAt : (autoResolveAt?.toDate ? autoResolveAt.toDate() : new Date(autoResolveAt));
  const diff = resolveTime - now;
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, expired: false };
};
