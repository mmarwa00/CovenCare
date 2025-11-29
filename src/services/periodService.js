import { db } from '../config/firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Log period (M14, M15, M16, M17, M18)
export const logPeriod = async (userId, startDate, endDate) => {
  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new Error('End date must be after start date');
    }

    // Get previous periods to calculate cycle length
    const previousPeriods = await getPreviousPeriods(userId, 6);
    
    let cycleLength = null;
    if (previousPeriods.length > 0) {
      const lastPeriod = previousPeriods[0];
      const daysBetween = Math.floor(
        (start - lastPeriod.startDate.toDate()) / (1000 * 60 * 60 * 24)
      );
      cycleLength = daysBetween;
    }

    // Create period document
    await addDoc(collection(db, 'periods'), {
      userId: userId,
      startDate: start,
      endDate: end,
      cycleLength: cycleLength,
      symptoms: {
        cramps: null,
        mood: null,
        energy: null
      },
      cravings: [],
      dailyMood: null,
      createdAt: new Date()
    });

    console.log('Period logged');
    return { success: true };

  } catch (error) {
    console.error('Error logging period:', error);
    return { success: false, error: error.message };
  }
};

// Get previous periods (helper function)
const getPreviousPeriods = async (userId, limitCount = 6) => {
  const periodsRef = collection(db, 'periods');
  const q = query(
    periodsRef,
    where('userId', '==', userId),
    orderBy('startDate', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get user's periods
export const getUserPeriods = async (userId) => {
  try {
    const periods = await getPreviousPeriods(userId, 12); // Last 12 periods
    console.log('Got user periods:', periods.length);
    return { success: true, periods };
  } catch (error) {
    console.error('Error getting periods:', error);
    return { success: false, error: error.message };
  }
};

// Predict next period (M17, M18)
export const predictNextPeriod = async (userId) => {
  try {
    const periods = await getPreviousPeriods(userId, 6);

    if (periods.length < 2) {
      // Use default 28-day cycle
      if (periods.length === 1) {
        const lastPeriod = periods[0].startDate.toDate();
        const prediction = new Date(lastPeriod);
        prediction.setDate(prediction.getDate() + 28);
        
        return { 
          success: true, 
          prediction: prediction,
          averageCycle: 28,
          confidence: 'low'
        };
      } else {
        return { 
          success: false, 
          error: 'Need at least 1 logged period to predict' 
        };
      }
    }

    // Calculate average cycle length
    const cycleLengths = periods
      .slice(0, -1)
      .map(p => p.cycleLength)
      .filter(c => c !== null);

    const avgCycle = Math.round(
      cycleLengths.reduce((sum, c) => sum + c, 0) / cycleLengths.length
    );

    // Predict next period
    const lastPeriod = periods[0].startDate.toDate();
    const prediction = new Date(lastPeriod);
    prediction.setDate(prediction.getDate() + avgCycle);

    console.log('Next period predicted');
    return { 
      success: true, 
      prediction: prediction,
      averageCycle: avgCycle,
      confidence: periods.length >= 3 ? 'high' : 'medium'
    };

  } catch (error) {
    console.error('Error predicting period:', error);
    return { success: false, error: error.message };
  }
};

// Get shared calendar for circle (M19)
export const getCircleCalendar = async (circleId) => {
  try {
    // Get circle members
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }

    const members = circleDoc.data().members;
    const calendar = [];

    // Get periods for each member (respecting privacy)
    for (const member of members) {
      const memberPeriods = await getUserPeriods(member.userId);
      
      if (memberPeriods.success) {
        const userData = await getDoc(doc(db, 'users', member.userId));
        
        calendar.push({
          userId: member.userId,
          displayName: userData.data().displayName,
          privacyLevel: member.privacyLevel,
          periods: member.privacyLevel === 'show_all' 
            ? memberPeriods.periods 
            : memberPeriods.periods.map(p => ({ 
                startDate: p.startDate,
                // Hide detailed info if privacy is "period_only"
              }))
        });
      }
    }

    console.log('Got circle calendar');
    return { success: true, calendar };

  } catch (error) {
    console.error('Error getting calendar:', error);
    return { success: false, error: error.message };
  }
};