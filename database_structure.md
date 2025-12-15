# CovenCare Database Structure

## Collections

### 1. users
- email (string)
- displayName (string, 3-30 chars)
- profilePicture (string or null)
- circles (array of circle IDs)
- createdAt (timestamp)
- isVerified (boolean)

### 2. circles
- name (string)
- inviteCode (string, 8 chars, unique)
- createdBy (string, userId)
- members (array of maps)
- maxMembers (number, default: 5)
- createdAt (timestamp)
- circlePic (string)

### 3. periods
- userId (string)
- startDate (timestamp)
- endDate (timestamp)
- cycleLength (number)
- symptoms (map)
- cravings (array)
- dailyMood (string)
- createdAt (timestamp)
- isEstimated (boolean)
- periodLength (number)

### 4. emergencies
- senderId (string)
- circleId (string)
- type (string)
- recipients (array)
- message (string)
- status (string: active/resolved)
- responses (array)
- createdAt (timestamp)
- autoResolveAt (timestamp)

### 5. vouchers
- code (string, unique)
- type (string)
- senderId (string)
- recipientId (string)
- circleId (string)
- message (string)
- status (string: unredeemed/redeemed)
- sentAt (timestamp)
- redeemedAt (timestamp or null)
```

---

### **6. Update .gitignore**

**Edit:** `.gitignore` (add this at the end)
```
# Firebase config (NEVER COMMIT!)
src/config/firebaseConfig.js
firebase-config.txt

# Environment
.env
.env.local