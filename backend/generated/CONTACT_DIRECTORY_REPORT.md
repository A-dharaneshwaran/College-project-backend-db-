# 📇 College Contact Directory Report (Phase XXIV-B)

**Kathir College of Engineering Management System**
**Date**: July 2, 2026

---

## 👥 Overview & Features
The Contact Directory serves as a central hub where Students, Faculty, and Admin users can search, filter, and interact with members of Kathir College. It integrates with native system calling, mailing client, clipboard APIs, and conversation threads.

### 🔑 Core Features
1. **Dynamic Browse list**: Renders all college members in a structured card interface.
2. **Debounced Search**: Input fields query dynamically based on name, email, register numbers, and employee IDs.
3. **Advanced Filtering**: Filters matches based on role and department, with full sorting options.
4. **Interactive Action Cards**:
   - **View Profile**: Displays a Bottom Sheet Modal detailing roles, departments, register numbers, designations, and contact listings.
   - **Start Chat**: Seamlessly navigates to the messages thread, setting focus and auto-selecting the conversation, creating it if it doesn't exist, without duplicating.
   - **Copy Actions**: Copies email and phone coordinates to the system clipboard.
   - **External Links**: Triggers `mailto:` and `tel:` URLs via standard `Linking.openURL()` on mobile devices and browser redirects on web.

---

## 🛡️ Visibility Restrictions

The system ensures security and access control parameters:

* **Student Visibility**: Restricted to searching/viewing Faculty, Admin, and students in their own department only. Other students are omitted.
* **Faculty Visibility**: Authorized to browse all active profiles (Students, Faculty, and Admin).
* **Admin Visibility**: Authorized to search and view everyone.
* **Deletions**: Inactive or deleted profiles are hidden.

---

## 🏗️ Reusable Front-End Component Strategy
Instead of replicating similar views, we developed a single, highly performant directory component at `components/chat/ContactDirectory.jsx`.
This component is wrapped by role-specific screen files:
- [student/contact.jsx](file:///d:/projects/College_project_frontend/app/student/contact.jsx)
- [faculty/contact.jsx](file:///d:/projects/College_project_frontend/app/faculty/contact.jsx)
- [admin/contact.jsx](file:///d:/projects/College_project_frontend/app/admin/contact.jsx)

It adapts layout buttons, routes, and query filters based on the logged-in user profile, maintaining complete design language conformity.
