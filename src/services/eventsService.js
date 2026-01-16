import { db } from '../config/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// RSVP options
export const RSVP_OPTIONS = {
  GOING: 'going',
  MAYBE: 'maybe',
  NOT_GOING: 'not_going',
  NO_RESPONSE: 'no_response'
};

// Create circle event
export const createCircleEvent = async (userId, circleId, eventData) => {
  try {
    if (!userId || !circleId) {
      throw new Error('User ID and circle ID are required');
    }

    if (!eventData.name || !eventData.date || !eventData.time) {
      throw new Error('Event name, date, and time are required');
    }

    // Verify user is in circle
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }

    const members = circleDoc.data().members || [];
    const isMember = members.some(m => m.userId === userId);
    
    if (!isMember) {
      throw new Error('Only circle members can create events');
    }

    // Create event datetime
    const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);

    // Get creator info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const creatorName = userDoc.exists() ? userDoc.data().displayName : 'Unknown';

    // Initialize RSVPs for all members
    const rsvps = members.map(member => ({
      userId: member.userId,
      userName: member.userId === userId ? creatorName : 'Unknown',
      response: member.userId === userId ? RSVP_OPTIONS.GOING : RSVP_OPTIONS.NO_RESPONSE,
      respondedAt: member.userId === userId ? Timestamp.now() : null
    }));

    const eventRef = await addDoc(collection(db, 'events'), {
      circleId: circleId,
      name: eventData.name.trim(),
      description: eventData.description?.trim() || '',
      date: eventData.date,
      time: eventData.time,
      dateTime: Timestamp.fromDate(eventDateTime),
      createdBy: userId,
      creatorName: creatorName,
      rsvps: rsvps,
      createdAt: Timestamp.now()
    });

    console.log('Event created:', eventRef.id);
    return { 
      success: true, 
      eventId: eventRef.id 
    };

  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: error.message };
  }
};

export const getCircleEvents = async (circleId, upcoming = true) => {
  try {
    if (!circleId) throw new Error('Circle ID is required');

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('circleId', '==', circleId),
      orderBy('dateTime', upcoming ? 'asc' : 'desc')
    );

    const snapshot = await getDocs(q);
    const now = new Date();

    // 1. Get all events first
    let events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));


    // We loop through each event...
    for (let event of events) {
      if (event.rsvps) {
        // and for each RSVP in that event
        for (let rsvp of event.rsvps) {
          // If the name is "Unknown", we go find it
          if (rsvp.userName === 'Unknown' || !rsvp.userName) {
            const userSnap = await getDoc(doc(db, 'users', rsvp.userId));
            if (userSnap.exists()) {
              rsvp.userName = userSnap.data().displayName;
            }
          }
        }
      }
    }


    events = events.map(event => ({
      ...event,
      dateTime: event.dateTime?.toDate ? event.dateTime.toDate() : event.dateTime,
    }));

    if (upcoming) {
      events = events.filter(event => new Date(event.dateTime) >= now);
    } else {
      events = events.filter(event => new Date(event.dateTime) < now);
    }

    return { success: true, events };
  } catch (error) {
    console.error('Error getting events with names:', error);
    return { success: false, error: error.message };
  }
};

// RSVP to event
export const rsvpToEvent = async (eventId, userId, response) => {
  try {
    if (!eventId || !userId || !response) {
      throw new Error('Event ID, user ID, and response are required');
    }

    const validResponses = Object.values(RSVP_OPTIONS);
    if (!validResponses.includes(response)) {
      throw new Error('Invalid RSVP response');
    }

    // Physically fetch the user's name from THEIR profile
    const userSnap = await getDoc(doc(db, 'users', userId));
    
    // We define 'actualName' RIGHT HERE so the computer knows what it is!
    const actualName = userSnap.exists() ? userSnap.data().displayName : 'Unknown Member';

    // Get the event document
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.data();
    const rsvps = eventData.rsvps || [];

    // Find where the user is in the RSVP list
    const userRsvpIndex = rsvps.findIndex(r => r.userId === userId);

    if (userRsvpIndex === -1) {
      throw new Error('You are not invited to this event');
    }

    // Update the specific RSVP object using the 'actualName' we defined in Step 1
    rsvps[userRsvpIndex] = {
      userId: userId,
      userName: actualName,
      response: response,
      respondedAt: Timestamp.now()
    };

    // Save the updated list back to Firestore
    await updateDoc(eventRef, {
      rsvps: rsvps
    });

    console.log('RSVP updated successfully for:', actualName);
    return { success: true };

  } catch (error) {
    console.error('Error updating RSVP:', error);
    return { success: false, error: error.message };
  }
};

// Get event details with member info
export const getEventDetails = async (eventId) => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    const eventDoc = await getDoc(doc(db, 'events', eventId));
    
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const data = eventDoc.data();

    // Get user details for each RSVP
    const rsvpsWithDetails = [];
    for (const rsvp of data.rsvps || []) {
      const userDoc = await getDoc(doc(db, 'users', rsvp.userId));
      if (userDoc.exists()) {
        rsvpsWithDetails.push({
          ...rsvp,
          displayName: userDoc.data().displayName,
          profilePicture: userDoc.data().profilePicture,
          respondedAt: rsvp.respondedAt?.toDate ? rsvp.respondedAt.toDate() : rsvp.respondedAt
        });
      }
    }

    return {
      success: true,
      event: {
        id: eventDoc.id,
        ...data,
        dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : data.dateTime,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        rsvps: rsvpsWithDetails
      }
    };

  } catch (error) {
    console.error('Error getting event details:', error);
    return { success: false, error: error.message };
  }
};

// Delete event
export const deleteEvent = async (eventId, userId) => {
  try {
    if (!eventId || !userId) {
      throw new Error('Event ID and user ID are required');
    }

    const eventDoc = await getDoc(doc(db, 'events', eventId));
    
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.data();
    
    if (eventData.createdBy !== userId) {
      throw new Error('Only the event creator can delete this event');
    }

    await deleteDoc(doc(db, 'events', eventId));

    console.log('Event deleted');
    return { success: true };

  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: error.message };
  }
};