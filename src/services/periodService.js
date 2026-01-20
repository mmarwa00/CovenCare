import { db } from '../config/firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  getDoc,
  updateDoc,
  query, 
  where,
  orderBy,
  limit,
  setDoc,
  Timestamp
} from 'firebase/firestore';

const DEFAULT_PERIOD_LENGTH_DAYS = 5;
const DEFAULT_CYCLE_LENGTH_DAYS = 28;

/*Periods:

cycle length: number of days btw your periods, so first day of your period till the day before you see your next period

normal length: 21 - 35
abnormal length: anything <21 or > 35 


ex. 
my period was on the 30.10
cylcle length is 30 days

should get it on the 29.11, which is correct
next one would be on the 29.12
*/

// Get previous periods
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

// Calculate cycle length between two periods
const calculateCycleLength = (earlierStartDate, laterStartDate) => {
  const earlier = earlierStartDate.toDate ? earlierStartDate.toDate() : new Date(earlierStartDate);
  const later = laterStartDate.toDate ? laterStartDate.toDate() : new Date(laterStartDate);
  
  return Math.ceil((later - earlier) / (1000 * 60 * 60 * 24));
};

// It would be nice to have a function where all the logic is done
// First we need to calculate the length
const calculateAveragePeriodLength = (periods) => {
  if (!periods || periods.length === 0) {
    return DEFAULT_PERIOD_LENGTH_DAYS;
  }

  const validPeriodLengths = periods
    .map(p => {
      const start = p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate);
      const end = p.endDate.toDate ? p.endDate.toDate() : new Date(p.endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    })
    .filter(length => length >= 2 && length <= 10);

  if (validPeriodLengths.length === 0) {
    return DEFAULT_PERIOD_LENGTH_DAYS;
  }

  return Math.round(
    validPeriodLengths.reduce((sum, len) => sum + len, 0) / validPeriodLengths.length
  );
};

// We also need a function for default cycle length 
export const calculateAverageCycleLength = async (userId) => {
  try {
    const periods = await getPreviousPeriods(userId, 6);

    if (periods.length < 2) {
      return {
        success: true,
        averageCycle: DEFAULT_CYCLE_LENGTH_DAYS,
        confidence: 'low',
        periodsAnalyzed: periods.length
      };
    }

    // Calculate cycle lengths between consecutive periods
    const cycleLengths = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const cycleLength = calculateCycleLength(periods[i + 1].startDate, periods[i].startDate);
      
      // Only include reasonable cycle lengths
      if (cycleLength >= 21 && cycleLength <= 45) {
        cycleLengths.push(cycleLength);
      }
    }

    if (cycleLengths.length === 0) {
      return {
        success: true,
        averageCycle: DEFAULT_CYCLE_LENGTH_DAYS,
        confidence: 'low',
        periodsAnalyzed: periods.length
      };
    }

    const avgCycle = Math.round(
      cycleLengths.reduce((sum, c) => sum + c, 0) / cycleLengths.length
    );

    const minCycle = Math.min(...cycleLengths);
    const maxCycle = Math.max(...cycleLengths);

    return {
      success: true,
      averageCycle: avgCycle,
      minCycle: minCycle,
      maxCycle: maxCycle,
      cycleVariability: maxCycle - minCycle,
      confidence: cycleLengths.length >= 3 ? 'high' : 'medium',
      periodsAnalyzed: periods.length
    };

  } catch (error) {
    console.error('Error calculating average cycle:', error);
    return { 
      success: false, 
      error: error.message,
      averageCycle: DEFAULT_CYCLE_LENGTH_DAYS 
    };
  }
};

// I need a function for previous periods:
// So for previous periods, we need to put in start and end date
// Also we should get an error if they put the end date before the start date
// If there are more then one previous periods we can calculate the length 
// We take the medium as the cycle length
// If user just puts one previous period we take a default number till we get more info
export const logPreviousPeriods = async(userId, startDateInput, endDateInput) => {
  try{

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error('Invalid date provided');
    }

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Here we are calculating how long the period lasted
    const periodLength = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 )) + 1;

    let cycleLength = null;
    const previousPeriods = await getPreviousPeriods(userId, 3);

    if (previousPeriods && previousPeriods.length > 0) {
      const sorted = previousPeriods
        .map(p => ({
          ...p,
          start: p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate)
        }))
        .sort((a, b) => b.start - a.start);
    
      const newStart = startDate;
      const earlier = sorted.find(p => p.start < newStart);

  /*
    Simple logic:
    - If we find an earlier period → cycle = difference in days
    - If not → this is probably the earliest logged period → leave null
  */
      if (earlier) {
        cycleLength = Math.ceil((newStart - earlier.start) / (1000 * 60 * 60 * 24));
      }
    }  

    // Create period document
    await addDoc(collection(db, 'periods'), {
      userId: userId,
      startDate: startDate,
      endDate: endDate,
      periodLength: periodLength,
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

    console.log('Previous period logged successfully');
    return { success: true, periodLength, cycleLength };

  } catch (error){
    console.error('Error logging previous period:', error);
    return { success: false, error: error.message };
  }
};


// So now I need a function, where we can just log a started Period
// Here we just save the first day and calculate the end date
// end date can be a default one 
// or it gets calculated from previous ones 
export const logPeriod = async (userId, startDateInput) => {

  try {
    // Validate dates
    const startDate = new Date(startDateInput);
    if (isNaN(startDate)) {
        throw new Error('Invalid start date provided.');
    }

    // How do we get the end date 
    // First we check if there is any previous Periods
    // if we have previous ones we calculate the length of the periods, means end date - start date
    // if not we take 5 as a default number

    const previousPeriods = await getPreviousPeriods(userId, 3);
    const periodLengthDays = calculateAveragePeriodLength(previousPeriods);

    let cycleLength = null;
    if (previousPeriods && previousPeriods.length > 0) {
      const lastPeriod = previousPeriods[0];
      cycleLength = calculateCycleLength(lastPeriod.startDate, startDate);

      if (cycleLength < 21 || cycleLength > 45) {
        console.warn(`Unusual cycle length: ${cycleLength} days`);
      }
    }

    const endDate = new Date(startDate);

    // minus 1 because first day is the start date
    endDate.setDate(startDate.getDate() + periodLengthDays - 1);
    

    // Create period document
    await addDoc(collection(db, 'periods'), {
      userId: userId,
      startDate: startDate,
      endDate: endDate,
      periodLength: periodLengthDays,
      cycleLength: cycleLength,
      isEstimated: true, // Flag that end date is estimated
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
    return { 
      success: true, 
      estimatedEndDate: endDate,
      periodLength: periodLengthDays,
      cycleLength: cycleLength
    };

  } catch (error) {
    console.error('Error logging period:', error);
    return { success: false, error: error.message };
  }
};

// Get user's periods
export const getUserPeriods = async (userId) => {
  try {
    const periodsRef = collection(db, 'periods');
    const q = query(
      periodsRef,
      where('userId', '==', userId),
    );

    const snapshot = await getDocs(q);

    let periods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    periods.sort((a, b) => {
      const A = a.startDate.toDate ? a.startDate.toDate() : new Date(a.startDate);
      const B = b.startDate.toDate ? b.startDate.toDate() : new Date(b.startDate);
      return A - B;
    });
    
    console.log('Got user periods:', periods.length);
    return { success: true, periods };
  } catch (error) {
    console.error('Error getting periods:', error);
    return { success: false, error: error.message };
  }
};

// Predict next period 
export const predictNextPeriod = async (userId) => {
  try {
    const periods = await getPreviousPeriods(userId, 6);

    if (periods.length === 0) {
      return { 
        success: false, 
        error: 'Need at least 1 logged period to predict' 
      };
    }

    // Use centralized function to calculate average cycle
    const cycleInfo = await calculateAverageCycleLength(userId);
    
    if (!cycleInfo.success) {
      throw new Error(cycleInfo.error);
    }

    // Predict next period based on last period + average cycle
    const lastPeriod = periods[0].startDate.toDate ? periods[0].startDate.toDate() : new Date(periods[0].startDate);
    const prediction = new Date(lastPeriod);
    prediction.setDate(prediction.getDate() + cycleInfo.averageCycle);

    console.log('Next period predicted');
    return { 
      success: true, 
      prediction: prediction,
      averageCycle: cycleInfo.averageCycle,
      minCycle: cycleInfo.minCycle,
      maxCycle: cycleInfo.maxCycle,
      cycleVariability: cycleInfo.cycleVariability,
      confidence: cycleInfo.confidence,
      periodsAnalyzed: cycleInfo.periodsAnalyzed
    };

  } catch (error) {
    console.error('Error predicting period:', error);
    return { success: false, error: error.message };
  }
};


export const getCurrentPhase = async (userId) => {
  try {
    const periods = await getPreviousPeriods(userId, 1);
    if (periods.length === 0) return { success: false, error: 'No periods' };

    const lastPeriod = periods[0];
    const startDate = lastPeriod.startDate.toDate ? 
      lastPeriod.startDate.toDate() : new Date(lastPeriod.startDate);
    
    // Use the actual logged length, or default to 5
    const actualPeriodLength = lastPeriod.periodLength || 5; 

    const today = new Date();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));


    let phase = 'unknown';
    let phaseDay = daysSinceStart + 1;
    
    if (daysSinceStart < 0) {
      phase = 'unknown';
    } else if (daysSinceStart < actualPeriodLength) {
      phase = 'menstrual';
    } else if (daysSinceStart <= 13) {
      phase = 'follicular';
    } else if (daysSinceStart <= 16) {
      phase = 'ovulation';
    } else {
      // anything after Day 16 is Luteal until a new period is logged.
      phase = 'luteal';
    }


    return { success: true, phase, phaseDay: daysSinceStart + 1 };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logDailySymptoms = async (userId, dateStr, symptoms) => {
  try {
    if (!userId || !dateStr) {
      throw new Error("User ID and date are required");
    }

     const normalizedDateStr = (() => {
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();

    const targetDate = new Date(normalizedDateStr);
    targetDate.setHours(0,0,0,0);
    const targetTimestamp = Timestamp.fromDate(targetDate);

    // --- FIND PERIOD ---
    const periodsRef = collection(db, 'periods');
    const q = query(periodsRef, where('userId','==', userId));
    const snapshot = await getDocs(q);

    let periodId = null;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const start = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate);
      const end = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);

      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      if (targetDate >= start && targetDate <= end) {
        periodId = docSnap.id;
        break;
      }
    }
    // --- MERGE SAVE ---
    const ref = doc(db, "dailySymptoms", `${userId}_${normalizedDateStr}`);

    const cleanSymptoms = {};
    if (symptoms.cramps !== null) cleanSymptoms.cramps = symptoms.cramps;
    if (symptoms.mood !== null) cleanSymptoms.mood = symptoms.mood;

    await setDoc(ref, {
      userId,
      periodId,
      date: targetTimestamp,
      ...cleanSymptoms,
      updatedAt: new Date()
    }, { merge: true });

    return { success: true };

  } catch (error) {
    console.error("Error logging symptoms:", error);
    return { success: false, error: error.message };
  }
};

// Get symptoms for a specific date
export const getSymptomsForDate = async (userId, date) => {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const symptomsRef = collection(db, 'dailySymptoms');
    const targetTimestamp = Timestamp.fromDate(targetDate);

    const q = query(
      symptomsRef,
      where('userId', '==', userId),
      where('date', '==', targetTimestamp)
    );


    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: true, symptoms: null };
    }

    const data = snapshot.docs[0].data();
    return {
      success: true,
      symptoms: {
        cramps: data.cramps,
        mood: data.mood,
      }
    };

  } catch (error) {
    console.error('Error getting symptoms:', error);
    return { success: false, error: error.message };
  }
};

// Get all symptoms for a period
export const getSymptomsForPeriod = async (userId, periodId) => {
  try {
    const symptomsRef = collection(db, 'dailySymptoms');
    const q = query(
      symptomsRef,
      where('userId','==', userId),
      where('periodId','==', periodId)
    );

    const snapshot = await getDocs(q);

    const symptoms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate 
        ? doc.data().date.toDate() 
        : new Date(doc.data().date)
    }));

    symptoms.sort((a, b) => a.date - b.date);

    return { success: true, symptoms };

  } catch (error) {
    console.error('Error getting period symptoms:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUserSymptoms = async (userId) => {
  const q = query(
    collection(db,'dailySymptoms'),
    where('userId','==', userId)
  );

  const snap = await getDocs(q);

  const logs = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: d.data().date.toDate()
  }));

  logs.sort((a,b)=> b.date - a.date);
  return logs;
}

// Get shared calendar for circle
export const getCircleCalendar = async (circleId) => {
  try {
    // Get circle members
    const circleDoc = await getDoc(doc(db, 'circles', circleId));
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }

    const members = circleDoc.data().members || [];
    const calendar = [];

    // Get periods for each member
    for (const member of members) {
      const memberPeriods = await getUserPeriods(member.userId);
      
      if (memberPeriods.success) {
        const userData = await getDoc(doc(db, 'users', member.userId));
        
        calendar.push({
          userId: member.userId,
          displayName: userData.exists() ? userData.data().displayName : 'Unknown',
          privacyLevel: member.privacyLevel || 'period_only',
          periods: member.privacyLevel === 'show_all' 
            ? memberPeriods.periods 
            : memberPeriods.periods.map(p => ({ 
                startDate: p.startDate,
                endDate: p.endDate
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