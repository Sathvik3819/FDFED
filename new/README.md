# UrbanEase

*Group ID:*       17
*Project Title:*  UrbanEase – Smart Community Management System
*SPOC:*           S.Srushanth Reddy , srushanthreddy.s23@iiits.in , S2023001XXXX


*Team Members & Roles:*

* Srushanth (Bin 1) :   Resident Pages , Pre-approval System 
* Vihari (Bin 1)    :   Security Page , payment pipeline and Advertisements 
* Likhit (Bin 2)    :   Admin pages , Registration pipeline
* Sathvik  (Bin 2)  :   Community Manager pages , Common Space Booking System pipeline 
* Aditya (Bin 3)    :   Worker pages , Issue Raising & Resolution pipeline



## 1. Project Overview

UrbanEase is a multi-tenant web application for managing gated communities.
It helps admins, community managers, residents, workers, and security staff handle daily community operations efficiently from a single platform.

### Business Model

Current Model: Tiered B2B subscription.

* Community Managers subscribe after admin approval.
* Plans are tiered based on the number of users in a community.
* Smaller communities pay less; larger ones pay more.

Future Model: Credit-based engagement system.

* Users earn credits through activities like timely payments or bookings.
* Credits can be spent on discounts or premium features.

---

## 2. User Roles and Hierarchy

* *Admin:* Manages all communities and community managers.
* *Community Manager:* Manages one community’s users, bookings, and operations.
* *Resident:* Raises issues, books spaces, and manages visitors.
* *Security:* Verifies visitors and manages gate entries.
* *Worker:* Handles assigned maintenance tasks.

Hierarchy:
Admin → Community Managers → Residents, Security, Workers

---

## 3. Core Modules and Features

### Admin Module

* View and approve manager applications.
* Manage all communities.
* Platform overview dashboard.

### Community Manager Module

* Dashboard showing bookings, issues, visitors.
* Manage residents, workers, and security.
* Create and manage common spaces with pricing and time rules.
* Approve or reject booking requests.
* Manage payments and advertisements.

### Resident Module

* Dashboard for bookings, announcements, and issues.
* Raise and track maintenance issues.
* Book common spaces and receive updates.
* Pre-approve visitors for faster entry.

### Security Module

* View visitor dashboard with pre-approved and walk-in entries.
* Verify and check in visitors using QR code.
* Log manual entries for unapproved visitors.

### Worker Module

* View assigned maintenance tasks.
* Update task status to In Progress or Completed.
* View task history.

---

## 4. Key Workflows

### Issue Resolution

1. Resident raises an issue.
2. Manager assigns it to a worker.
3. Worker completes and updates status.
4. Resident verifies and closes it.

### Common Space Booking

1. Manager creates common spaces.
2. Resident requests booking.
3. Manager approves or rejects request.
4. Resident notified of status.

### Visitor Management

* *Pre-approved:* Resident registers visitor → Security verifies and checks in.
* *Walk-in:* Security manually logs details and optionally notifies resident.

---

## 5. How to Run (Local)

### Prerequisites

* Node.js (v18+)
* MongoDB (local or Atlas)

### Steps


git clone <repo-url>
cd urban-ease
npm install
cp .env.example .env   # Add your MongoDB URI and email credentials
npm start


Open browser: [http://localhost:3000](http://localhost:3000)

---

## 6. Key Files

* /routes/ – managerRouter , residentRouter , securityRouter , workerRouter , interestRouter
* /models/ – Ad,admin,cManager,commonSpaces,communities,interestForm,issues,payment,preapproval                       
* /views/ – resident , worker , security and manager ejs files
* /utils/mailer.js – Email notifications

---

## 7. Demo & Evidence

* Demo link: <insert link>
* Evidence: network_evidence/, git-logs.txt, screenshots, etc.