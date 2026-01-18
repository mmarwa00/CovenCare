# CovenCare

Menstrual cycle tracking and support app for circles of friends.

## Tech Stack
- **Frontend:** React Native + Expo
- **Backend:** Firebase (Auth + Firestore)
- **UI Library:** React Native Paper

## Download App

[Download Latest APK](https://github.com/mmarwa00/CovenCare/releases/tag/v.1.0.0)

### Installation
1. Download the APK from releases
2. Enable "Install from unknown sources"
3. Install and enjoy!

1. Clone the repository:
git clone https://github.com/mmarwa00/CovenCare
cd CovenCare

2. Install dependencies:
npm install

3. Start the app:
 npx expo start --dev-client      

5. Scan QR code 


## Team
Marwa: Backend/Firebase Architecture
Anastasiia: Frontend Development & Coordination
Silvia: Frontend Development & UI/UX Design

## Features (Week by Week)
- Week 1-2: Authentication
- Week 3-4: Circle management & Period tracking
- Week 5-6: Emergency alerts & Vouchers
- Week 7-8: Additional features
- Week 9-10: Polish & testing

## MoSCOw criteria 
## Functional Requirements 
# Must 
M1: The app shall provide user registration requiring email address and password. 
M2: The app shall provide password reset functionality that sends a reset link to the user’s 
registered email address. 
M3: The app shall provide user login functionality requiring email address and password. 
M4: The app shall provide logout functionality. 
M5: The app shall allow users to create and manage their profile containing display name (3 - 
30 characters) and predefined profile picture. 
M6: The app shall allow users to create multiple circles with custom names. 
M7: The app shall generate unique 8-character invite code for each circle. 
M8: The app shall allow users to join an existing circle by entering a valid invite code. 
M9: The app shall enforce a maximum limit of 5 members per circle and prevent additional 
members from joining once this limit is reached. 
M10: The app shall allow a single user to belong to multiple circles simultaneously. 
M11: The app shall display a list of all circles the user is a member of. 
M12: The app shall allow users to switch between circles by selecting a different circle. 
M13: The app shall allow users to leave a circle, which removes them from the member list. 
M14: The app shall allow users to log a period start date using a calendar date picker. 
M15: The app shall allow users to log a period end date using a calendar date picker, which 
must be after the start date. 
M16: The app shall automatically calculate cycle length based on the previous periods. 
M17: The app shall calculate average cycle length based on the last 3-6 logged cycles or use 
28-day default if fewer than 2 cycles logged. 
M18: The app shall predict the next period start date by adding the average cycle length to the 
most recent period start date. 
M19: The app shall display a shared calendar showing all circle members menstrual cycles for 
the currently active circle. 
M20: The app shall provide predefined emergency alert types accessible from Potion page: 
Tampon emergency, Pads emergency, Painkiller, the Ear, the PMS. 
M21: The app shall allow users to select one or more circle members of different circles as 
recipients for an emergency alert (minimum 1 circle member required). 
M22: The app shall display emergency alerts on each recipient’s dashboard immediately after 
creation. 
M23: The app shall allow the alert recipients to manually mark an emergency as “resolved”, 
which removes it from other recipients’ dashboards. 
M24: The app shall automatically mark emergencies as “expired” 24 hours after creation if 
they are not manually resolved. 
M25: The app shall allow users to send virtual care vouchers to specific circle members of the same 
active circle. 
M26: The app shall provide predefined voucher types: Chocolate, Tea, Coffee, Chips, Face 
Mask, Love. 
M27: The app shall allow users to send the same voucher type to multiple recipients 
simultaneously. 
M28: The app shall display received vouchers in a dedicated “Care Box” section for each 
user. 
M29: The app shall display the following information for each voucher: type, sender name, 
date sent. 
M30: The app shall provide a dashboard menu with the following sections: active circle, 
current Phase, emergency Alerts, sent Voucher and a footer with Circle, Log and Potion. 
M31: The app shall display circle switcher allowing users to change their active circle. 
M32: The app shall clearly indicate which circle is currently active. 
# Should 
S1: The app should allow users to log daily symptoms including cramps 
(none/mild/moderate/severe) and mood (happy/okay/grumpy/sad/anxious). 
S2: The app should show sent vouchers in senders’ dashboard. 
S3: The app should provide a “Redeem” button for each active received voucher. 
S4: The app should allow emergency recipients to respond with predefined messages: “On my 
way!”, “Sending care package!”, “Can’t right now but ♡”. 
S5: The app should display all responses to the emergency sender. 
S6: The app should display circle members current day mood to the other members. 
# Could 
C1: The app could allow users to switch between Light Mode and Vampire Mode. 
C2: The app could apply a gothic-cute colour scheme in Vampire Mode using deep blue, 
blood reds, and dark greys. 
C3: The app could display each icons type with unique illustrated design featuring a gothic- 
cute aesthetic for the Vampire Mode. 
C4: The app could apply selected theme consistently across all pages and components of the 
application. 
C5: The app could allow users to create circle events by specifying event name, date, time, 
and optional description. 
C6: The app could allow circle members to RSVP to events with three options: Going, 
Maybe, Not Going. 
C7: The app could automatically label cycle phases as: Menstrual, Follicular, Ovulation, 
Luteal. 
C8: The app could display a spell section where users can look up funny advice.  
# Won’t 
W1: The app will not process any real money transactions. 
W2: The app will not allow purchasing of actual gifts cards. 
W3: The app will not provide instant messaging or real time chat functionality. 
W4: The app will not provide social media login options. 
W5: The app will not track fertility.