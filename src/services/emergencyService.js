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
  Timestamp
} from 'firebase/firestore';

// Emergency types
// Emergency types (with added HEATING_PAD)
export const EMERGENCY_TYPES = {
    TAMPON: 'tampon',
    PADS: 'pads',
    PAINKILLER: 'painkiller',
    HEATING_PAD: 'heating_pad',
    THE_EAR: 'the_ear',
    THE_PMS: 'the_pms'
};

// Create emergency alert (M20, M21)
export const createEmergency = async (senderId, circleId, type, recipients, message = '') => {
  try {
    // Validate inputs
    if (!senderId || !circleId || !type) {
      throw new Error('Sender ID, circle ID, and type are required');
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    // Validate emergency type
    const validTypes = Object.values(EMERGENCY_TYPES);
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid emergency type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get sender info
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    if (!senderDoc.exists()) {
      throw new Error('Sender not found');
    }

    // Calculate auto-resolve time (24 hours from now)
    const now = new Date();
    const autoResolveAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Create emergency document
    const emergencyRef = await addDoc(collection(db, 'emergencies'), {
      senderId: senderId,
      senderName: senderDoc.data().displayName,
      circleId: circleId,
      type: type,
      recipients: recipients,
      message: message || '',
      status: 'active',
      responses: [],
      createdAt: Timestamp.fromDate(now),
      autoResolveAt: Timestamp.fromDate(autoResolveAt)
    });

    console.log('Emergency created:', emergencyRef.id);

    // Note: Email sending will be handled by Cloud Function
    // Cloud Function will trigger on this document creation

    return { 
      success: true, 
      emergencyId: emergencyRef.id,
      autoResolveAt: autoResolveAt
    };

  } catch (error) {
    console.error('Error creating emergency:', error);
    return { success: false, error: error.message };
  }
};

// Get active emergencies for user (M23)
export const getActiveEmergencies = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get emergencies where user is a recipient
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
        // Convert Timestamps to Dates for easier handling
        createdAt: data.createdAt.toDate(),
        autoResolveAt: data.autoResolveAt.toDate()
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
    if (!userId) {
      throw new Error('User ID is required');
    }

    const emergenciesRef = collection(db, 'emergencies');
    const q = query(
      emergenciesRef,
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emergencies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      autoResolveAt: doc.data().autoResolveAt.toDate()
    }));

    console.log('Got sent emergencies:', emergencies.length);
    return { success: true, emergencies };

  } catch (error) {
    console.error('Error getting sent emergencies:', error);
    return { success: false, error: error.message };
  }
};

// Resolve emergency manually (M24)
export const resolveEmergency = async (emergencyId, userId) => {
  try {
    if (!emergencyId || !userId) {
      throw new Error('Emergency ID and user ID are required');
    }

    // Get emergency document
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencyDoc = await getDoc(emergencyRef);

    if (!emergencyDoc.exists()) {
      throw new Error('Emergency not found');
    }

    const emergencyData = emergencyDoc.data();

    // Verify user is the sender
    if (emergencyData.senderId !== userId) {
      throw new Error('Only the sender can resolve this emergency');
    }

    // Check if already resolved
    if (emergencyData.status === 'resolved') {
      return { success: true, message: 'Emergency already resolved' };
    }

    // Update status to resolved
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
    if (!emergencyId) {
      throw new Error('Emergency ID is required');
    }

    const emergencyDoc = await getDoc(doc(db, 'emergencies', emergencyId));

    if (!emergencyDoc.exists()) {
      throw new Error('Emergency not found');
    }

    const data = emergencyDoc.data();

    // Get recipient details
    const recipientDetails = [];
    for (const recipientId of data.recipients) {
      const userDoc = await getDoc(doc(db, 'users', recipientId));
      if (userDoc.exists()) {
        recipientDetails.push({
          userId: recipientId,
          displayName: userDoc.data().displayName,
          profilePicture: userDoc.data().profilePicture
        });
      }
    }

    console.log('Got emergency details');
    return { 
      success: true, 
      emergency: {
        id: emergencyDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        autoResolveAt: data.autoResolveAt.toDate(),
        resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : null,
        recipientDetails: recipientDetails
      }
    };

  } catch (error) {
    console.error('Error getting emergency details:', error);
    return { success: false, error: error.message };
  }
};

// Respond to emergency (S5, S6)
export const respondToEmergency = async (emergencyId, userId, responseMessage) => {
  try {
    if (!emergencyId || !userId || !responseMessage) {
      throw new Error('Emergency ID, user ID, and response message are required');
    }

    // Get emergency document
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencyDoc = await getDoc(emergencyRef);

    if (!emergencyDoc.exists()) {
      throw new Error('Emergency not found');
    }

    const emergencyData = emergencyDoc.data();

    // Verify user is a recipient
    if (!emergencyData.recipients.includes(userId)) {
      throw new Error('Only recipients can respond to this emergency');
    }

    // Get user info
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Add response
    const response = {
      userId: userId,
      userName: userDoc.data().displayName,
      message: responseMessage,
      timestamp: Timestamp.now()
    };

    const currentResponses = emergencyData.responses || [];
    
    await updateDoc(emergencyRef, {
      responses: [...currentResponses, response]
    });

    console.log('Response added to emergency');
    return { success: true };

  } catch (error) {
    console.error('Error responding to emergency:', error);
    return { success: false, error: error.message };
  }
};

// Get time remaining until auto-resolve (helper function)
export const getTimeUntilAutoResolve = (autoResolveAt) => {
  const now = new Date();
  const resolveTime = autoResolveAt instanceof Date ? autoResolveAt : autoResolveAt.toDate();
  const diff = resolveTime - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, expired: false };
};

// Predefined response messages
export const PREDEFINED_RESPONSES = [
  "On my way! 🏃‍♀️",
  "Sending care package! 📦",
  "Can't right now but ❤️",
  "I'll be there in 10 minutes!",
  "Heading to the store now! 🛒"
];