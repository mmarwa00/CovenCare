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

// Generate random 8-character invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Time to create Circles
export const createCircle = async (userId, circleName) => {
  try {
    if (!circleName || circleName.trim().length === 0) {
      throw new Error('Circle name is required');
    }

    // every Circle has a invite Code
    const inviteCode = generateInviteCode();

    // Create circle document for Firbase
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
      createdAt: new Date(),
      circlePic: ""
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

// Join circle with invite code
export const joinCircle = async (userId, inviteCode) => {
  try {
    if (!inviteCode || inviteCode.length !== 8) {
      throw new Error('Invalid invite code');
    }

    // Find circle in db with this invite code
    const circlesRef = collection(db, 'circles');
    const q = query(circlesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Circle not found with this invite code');
    }

    const circleDoc = querySnapshot.docs[0];
    const circleData = circleDoc.data();
    const circleId = circleDoc.id;

    // Error if user is already in the circle
    const alreadyMember = circleData.members.some(m => m.userId === userId);
    if (alreadyMember) {
      throw new Error('You are already in this circle');
    }

    // Checks if circle is full
    if (circleData.members.length >= circleData.maxMembers) {
      throw new Error('Circle is full (max 5 members)');
    }

    // if none of the above is true then add user to circle
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

// Get all user's circles
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

// Get circle members
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

// User should be able to leave the circle
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

// Here we get the mood of the members
export const getCircleMembersMoods = async (circleId) => {
  try {
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    if (!circleDoc.exists()) throw new Error('Circle not found');

    const members = circleDoc.data().members || [];
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const memberMoods = [];

    for (const member of members) {
      const userDoc = await getDoc(doc(db, 'users', member.userId));
      if (!userDoc.exists()) continue;
      const userData = userDoc.data();

      const symptomsRef = collection(db, 'dailySymptoms');
      const q = query(
        symptomsRef,
        where('userId', '==', member.userId),
        where('date', '==', todayMidnight) 
      );

      const snapshot = await getDocs(q);
      let todaysMood = null;

      if (!snapshot.empty) {
        // Grab the mood from the first symptom log found for today
        todaysMood = snapshot.docs[0].data().mood || null;
      }

      // Only add if they allow sharing
      // We dont have that anymore in the SRS but i just left it
      // to lazy to delete 
      if (member.privacyLevel === 'show_all') {
        memberMoods.push({
          userId: member.userId,
          displayName: userData.displayName || 'User',
          profilePicture: userData.profilePicture || null,
          mood: todaysMood
        });
      }
    }

    console.log('Successfully fetched circle moods from dailySymptoms!');
    return { success: true, memberMoods };

  } catch (error) {
    console.error('Error getting members moods:', error);
    return { success: false, error: error.message };
  }
};