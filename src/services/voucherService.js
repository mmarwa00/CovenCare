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

// Voucher types
export const VOUCHER_TYPES = {
    CHOCOLATE: 'chocolate',
    TEA: 'tea',
    FACE_MASK: 'face_mask',
    CHIPS: 'chips',
    COFFEE: 'coffee',
    LOVE: 'love'
};

// Generate unique voucher code (BAT-XXXX)
export const generateVoucherCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BAT-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if voucher code already exists (helper)
const isCodeUnique = async (code) => {
  const vouchersRef = collection(db, 'vouchers');
  const q = query(vouchersRef, where('code', '==', code));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// Generate guaranteed unique code
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateVoucherCode();
    isUnique = await isCodeUnique(code);
    attempts++;
  }

  if (!isUnique) {
    // Fallback: add timestamp to ensure uniqueness
    code = `BAT-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }

  return code;
};

// Send voucher (M26, M27, M28)
export const sendVoucher = async (senderId, recipientIds, circleId, type, message = '') => {
  try {
    // --- VALIDATION ---
    if (!senderId) throw new Error('Sender ID is required');
    if (!recipientIds || recipientIds.length === 0) throw new Error('At least one recipient is required');
    if (!circleId) throw new Error('Circle ID is required');
    if (!type) throw new Error('Voucher type is required');

    // Ensure type is valid
    const validTypes = Object.values(VOUCHER_TYPES);
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid voucher type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get sender info
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    if (!senderDoc.exists()) throw new Error('Sender not found');
    const senderName = senderDoc.data()?.displayName || 'Unknown Sender';

    const voucherIds = [];

    // --- LOOP RECIPIENTS ---
    for (const recipientId of recipientIds) {
      try {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (!recipientDoc.exists()) {
          console.warn(`Recipient ${recipientId} not found, skipping`);
          continue;
        }

        // Generate unique voucher code
        const code = await generateUniqueCode();

        // Build safe payload (no undefined fields)
        const payload = {
          code: code,
          type: type,
          senderId: String(senderId),
          senderName: String(senderName),
          recipientId: String(recipientId),
          recipientName: String(recipientDoc.data()?.displayName || 'Unknown Recipient'),
          circleId: String(circleId),
          message: String(message || ''),
          status: 'unredeemed',
          sentAt: Timestamp.now(),
          redeemedAt: null
        };

        console.log('📤 Sending voucher payload:', payload);

        const voucherRef = await addDoc(collection(db, 'vouchers'), payload);
        voucherIds.push(voucherRef.id);

      } catch (recipientError) {
        console.error(`Error sending voucher to ${recipientId}:`, recipientError);
      }
    }

    return {
      success: true,
      voucherIds,
      count: voucherIds.length
    };

  } catch (error) {
    console.error('Error sending voucher:', error);
    return { success: false, error: error.message };
  }
};


// Get received vouchers (M29)
export const getReceivedVouchers = async (userId, status = null) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const vouchersRef = collection(db, 'vouchers');
    let q;

    if (status) {
      // Filter by status (unredeemed or redeemed)
      q = query(
        vouchersRef,
        where('recipientId', '==', userId),
        where('status', '==', status),
        orderBy('sentAt', 'desc')
      );
    } else {
      // Get all vouchers
      q = query(
        vouchersRef,
        where('recipientId', '==', userId),
        orderBy('sentAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const vouchers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt.toDate(),
      redeemedAt: doc.data().redeemedAt ? doc.data().redeemedAt.toDate() : null
    }));

    console.log('Got received vouchers:', vouchers.length);
    return { success: true, vouchers };

  } catch (error) {
    console.error('Error getting vouchers:', error);
    return { success: false, error: error.message };
  }
};

// Get sent vouchers (helper)
export const getSentVouchers = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const vouchersRef = collection(db, 'vouchers');
    const q = query(
      vouchersRef,
      where('senderId', '==', userId),
      orderBy('sentAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const vouchers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt.toDate(),
      redeemedAt: doc.data().redeemedAt ? doc.data().redeemedAt.toDate() : null
    }));

    console.log('Got sent vouchers:', vouchers.length);
    return { success: true, vouchers };

  } catch (error) {
    console.error('Error getting sent vouchers:', error);
    return { success: false, error: error.message };
  }
};

// Redeem voucher (S4)
export const redeemVoucher = async (voucherId, userId) => {
  try {
    if (!voucherId || !userId) throw new Error('Voucher ID and user ID are required');

    const voucherRef = doc(db, 'vouchers', voucherId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(voucherRef);
      if (!snap.exists()) throw new Error('Voucher not found');

      const data = snap.data();

      if (String(data.recipientId) !== String(userId)) {
        throw new Error('Only the recipient can redeem this voucher');
      }

      if (data.status === 'redeemed') {
        throw new Error('This voucher has already been redeemed');
      }

      tx.update(voucherRef, {
        status: 'redeemed',
        redeemedAt: Timestamp.now(),
        redeemedBy: String(userId)
      });
    });

    const updatedSnap = await getDoc(voucherRef);
    if (!updatedSnap.exists()) throw new Error('Voucher not found after redeem');

    const updated = updatedSnap.data();
    const formatted = {
      id: updatedSnap.id,
      ...updated,
      sentAt: updated.sentAt?.toDate ? updated.sentAt.toDate() : updated.sentAt,
      redeemedAt: updated.redeemedAt?.toDate ? updated.redeemedAt.toDate() : updated.redeemedAt
    };

    console.log('Voucher redeemed (transaction):', voucherId);
    return { success: true, voucher: formatted };

  } catch (error) {
    console.error('Error redeeming voucher (transaction):', error);
    return { success: false, error: error.message };
  }
};

// Get voucher details (M30)
export const getVoucherDetails = async (voucherId) => {
  try {
    if (!voucherId) {
      throw new Error('Voucher ID is required');
    }

    const voucherDoc = await getDoc(doc(db, 'vouchers', voucherId));

    if (!voucherDoc.exists()) {
      throw new Error('Voucher not found');
    }

    const data = voucherDoc.data();

    // Get sender details
    const senderDoc = await getDoc(doc(db, 'users', data.senderId));
    const senderDetails = senderDoc.exists() ? {
      displayName: senderDoc.data().displayName,
      profilePicture: senderDoc.data().profilePicture
    } : null;

    // Get recipient details
    const recipientDoc = await getDoc(doc(db, 'users', data.recipientId));
    const recipientDetails = recipientDoc.exists() ? {
      displayName: recipientDoc.data().displayName,
      profilePicture: recipientDoc.data().profilePicture
    } : null;

    console.log('Got voucher details');
    return {
      success: true,
      voucher: {
        id: voucherDoc.id,
        ...data,
        sentAt: data.sentAt.toDate(),
        redeemedAt: data.redeemedAt ? data.redeemedAt.toDate() : null,
        senderDetails: senderDetails,
        recipientDetails: recipientDetails
      }
    };

  } catch (error) {
    console.error('Error getting voucher details:', error);
    return { success: false, error: error.message };
  }
};

// Get voucher by code (helper)
export const getVoucherByCode = async (code) => {
  try {
    if (!code) {
      throw new Error('Voucher code is required');
    }

    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Voucher not found');
    }

    const voucherDoc = snapshot.docs[0];
    const data = voucherDoc.data();

    return {
      success: true,
      voucher: {
        id: voucherDoc.id,
        ...data,
        sentAt: data.sentAt.toDate(),
        redeemedAt: data.redeemedAt ? data.redeemedAt.toDate() : null
      }
    };

  } catch (error) {
    console.error('Error getting voucher by code:', error);
    return { success: false, error: error.message };
  }
};

// Get voucher type display name (helper for UI)
export const getVoucherTypeName = (type) => {
  const names = {
    chocolate: 'The Choco',
    tea: 'The Tea',
    coffee: 'The Coffee',
    face_mask: 'The Mask',
    chips: 'The Chips',
    love: 'The Love'
  };
  return names[type] || type;
};
