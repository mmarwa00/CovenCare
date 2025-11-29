import { db } from '../config/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';

// Generate random 8-character invite code (M7)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create circle (M6, M7)
export const createCircle = async (userId, circleName) => {
  try {
    if (!circleName || circleName.trim().length === 0) {
      throw new Error('Circle name is required');
    }

    const inviteCode = generateInviteCode();

    // Create circle document
    const circleRef = await addDoc(collection(db, 'circles'), {
      name: circleName.trim(),
      inviteCode: inviteCode,
      createdBy: userId,
      members: [{
        userId: userId,
        joinedAt: new Date(),
        privacyLevel: 'show_all'
      }],
      maxMembers: 5,
      createdAt: new Date()
    });

    // Add circle to user's circles array
    await updateDoc(doc(db, 'users', userId), {
      circles: arrayUnion(circleRef.id)
    });

    console.log('Circle created:', circleRef.id);
    return { 
      success: true, 
      circleId: circleRef.id,
      inviteCode: inviteCode
    };

  } catch (error) {
    console.error('Error creating circle:', error);
    return { success: false, error: error.message };
  }
};

// Join circle with invite code (M8, M9)
export const joinCircle = async (userId, inviteCode) => {
  try {
    if (!inviteCode || inviteCode.length !== 8) {
      throw new Error('Invalid invite code');
    }

    // Find circle with this invite code
    const circlesRef = collection(db, 'circles');
    const q = query(circlesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Circle not found with this invite code');
    }

    const circleDoc = querySnapshot.docs[0];
    const circleData = circleDoc.data();
    const circleId = circleDoc.id;

    // Check if user already in circle
    const alreadyMember = circleData.members.some(m => m.userId === userId);
    if (alreadyMember) {
      throw new Error('You are already in this circle');
    }

    // Check if circle is full (M9)
    if (circleData.members.length >= circleData.maxMembers) {
      throw new Error('Circle is full (max 5 members)');
    }

    // Add user to circle members
    await updateDoc(doc(db, 'circles', circleId), {
      members: arrayUnion({
        userId: userId,
        joinedAt: new Date(),
        privacyLevel: 'show_all'
      })
    });

    // Add circle to user's circles array
    await updateDoc(doc(db, 'users', userId), {
      circles: arrayUnion(circleId)
    });

    console.log('User joined circle:', circleId);
    return { 
      success: true, 
      circleId: circleId,
      circleName: circleData.name
    };

  } catch (error) {
    console.error('Error joining circle:', error);
    return { success: false, error: error.message };
  }
};

// Get all user's circles (M11)
export const getUserCircles = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const circleIds = userDoc.data().circles || [];
    
    if (circleIds.length === 0) {
      return { success: true, circles: [] };
    }

    // Get all circle details
    const circles = [];
    for (const circleId of circleIds) {
      const circleDoc = await getDoc(doc(db, 'circles', circleId));
      if (circleDoc.exists()) {
        circles.push({
          id: circleDoc.id,
          ...circleDoc.data()
        });
      }
    }

    console.log('Got user circles:', circles.length);
    return { success: true, circles };

  } catch (error) {
    console.error('Error getting circles:', error);
    return { success: false, error: error.message };
  }
};

// Get circle members (M12)
export const getCircleMembers = async (circleId) => {
  try {
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data();
    const memberIds = circleData.members.map(m => m.userId);

    // Get user details for each member
    const members = [];
    for (const memberId of memberIds) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const memberInfo = circleData.members.find(m => m.userId === memberId);
        
        members.push({
          id: userDoc.id,
          displayName: userData.displayName,
          profilePicture: userData.profilePicture,
          privacyLevel: memberInfo.privacyLevel,
          joinedAt: memberInfo.joinedAt
        });
      }
    }

    console.log('Got circle members:', members.length);
    return { success: true, members };

  } catch (error) {
    console.error('Error getting members:', error);
    return { success: false, error: error.message };
  }
};

// Leave circle (M13)
export const leaveCircle = async (userId, circleId) => {
  try {
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data();
    const memberToRemove = circleData.members.find(m => m.userId === userId);

    if (!memberToRemove) {
      throw new Error('You are not in this circle');
    }

    // Remove user from circle members
    await updateDoc(doc(db, 'circles', circleId), {
      members: arrayRemove(memberToRemove)
    });

    // Remove circle from user's circles array
    await updateDoc(doc(db, 'users', userId), {
      circles: arrayRemove(circleId)
    });

    console.log('User left circle');
    return { success: true };

  } catch (error) {
    console.error('Error leaving circle:', error);
    return { success: false, error: error.message };
  }
};