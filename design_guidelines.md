# Leave Management System - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design) + Productivity Tool References (Linear, Notion)

**Justification:** This is an internal productivity tool requiring efficient workflows, clear information hierarchy, and consistent patterns. Drawing from Material Design's comprehensive component library while incorporating the clean aesthetics of modern productivity tools like Linear and Notion.

**Key Design Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Efficient workflows: Minimize clicks and cognitive load for frequent tasks
- Clear status communication: Visual hierarchy makes approval states immediately obvious
- Role-appropriate views: Each dashboard optimized for its user's needs

## Core Design Elements

### A. Typography

**Font Family:** Inter (primary), system-ui (fallback)
- Modern, highly legible, excellent at small sizes
- Professional appearance suitable for enterprise applications

**Typography Scale:**
- Page Titles: text-3xl (30px), font-semibold
- Section Headers: text-xl (20px), font-semibold
- Card Titles: text-lg (18px), font-medium
- Body Text: text-base (16px), font-normal
- Captions/Labels: text-sm (14px), font-medium
- Helper Text: text-xs (12px), font-normal

**Line Heights:**
- Headings: leading-tight (1.25)
- Body: leading-relaxed (1.625)
- Buttons/Labels: leading-none (1)

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-2 (component internal)
- Standard spacing: p-4, gap-4 (cards, forms)
- Section spacing: p-6, p-8 (page sections)
- Page margins: p-8, p-12, p-16 (main containers)

**Grid System:**
- Main container: max-w-7xl mx-auto px-4 md:px-8
- Dashboard layouts: Two-column on desktop (sidebar + main), single column on mobile
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

**Responsive Breakpoints:**
- Mobile: base (default)
- Tablet: md: (768px)
- Desktop: lg: (1024px)

### C. Component Library

**Navigation**
- Top navigation bar: Fixed header with company logo, user profile dropdown
- Sidebar (Desktop): Fixed left sidebar (w-64) with role-specific menu items
- Mobile menu: Collapsible hamburger menu
- Breadcrumbs: text-sm with slash separators for multi-level pages

**Dashboard Cards**
- Leave Balance Cards: Prominent display with large numbers (text-4xl), label below (text-sm)
- Status Cards: Compact card showing request summary, dates, status badge
- Grid layout: 2-3 columns on desktop, stack on mobile
- Padding: p-6 for content area
- Borders: rounded-lg with subtle border

**Forms**
- Form container: max-w-2xl for optimal reading width
- Label positioning: Above input field, font-medium text-sm
- Input spacing: mb-6 between fields
- Input fields: p-3, rounded-lg, full border
- Date inputs: Native date picker or calendar component
- Dropdowns: Custom styled select with chevron icon
- File upload: Dashed border area with upload icon and helper text
- Submit buttons: Full-width on mobile, auto-width on desktop (px-8 py-3)

**Tables**
- Leave history table: Full-width responsive table
- Headers: Sticky top positioning, font-semibold, text-sm, uppercase tracking
- Rows: py-4 px-4, border-b between rows
- Mobile: Stack table into cards with labeled data pairs
- Actions column: Icon buttons or compact text links

**Status Indicators**
- Status badges: Inline-block, px-3 py-1, rounded-full, text-sm font-medium
- Visual states: Different treatments for Pending, Approved, Rejected
- Icons: Use status-specific icons (Heroicons: clock, check-circle, x-circle)

**Buttons**
- Primary action: px-6 py-3, rounded-lg, font-medium
- Secondary action: Similar size with border treatment
- Danger action (Reject): Use appropriate visual treatment
- Icon buttons: p-2, rounded, icon-only for compact actions
- Button groups: gap-3 between related actions

**Approval Workflow Components**
- Request detail card: Two-column layout (info + actions)
- Comment textarea: min-h-24, p-3, rounded-lg
- Approval actions: Side-by-side buttons for Approve/Reject
- Timeline view: Vertical timeline showing HR → Manager approval flow with status icons

**Admin Interface**
- User management table: Searchable, sortable table
- Role badges: Similar to status badges, showing user role
- Quick action buttons: Inline edit/delete actions

### D. Page Layouts

**Employee Dashboard**
- Hero section: Leave balances in 4-column grid (Annual, Medical, Emergency, Other)
- Quick action: Prominent "Apply for Leave" button
- Recent requests: Table/card list showing latest 5 requests with status
- Full history: Link to separate page

**Leave Application Form**
- Single column form, max-w-2xl centered
- Clear section headings for different input groups
- Inline validation feedback
- Submit button prominent at bottom

**HR Dashboard**
- Pending requests: Card grid or table view
- Each request shows: Employee name, dates, type, days count
- Quick approve/reject actions
- Filter/search bar at top

**Manager Dashboard**
- Similar to HR but showing "HR Approved" requests
- Clear indication this is final approval stage
- Employee details more prominent (team context)

**Admin Dashboard**
- Tab navigation: Requests, Users, Settings
- All requests view: Filterable by status, user, date range
- User management: Table with role assignment

## Images

**Not applicable** - This is an internal productivity application focused on data and workflows. No hero images or decorative imagery needed. Focus on clear iconography (status icons, navigation icons) using Heroicons library via CDN.

## Key Implementation Notes

- **Responsive priority:** Mobile-first approach, stack columns on mobile
- **Accessibility:** Proper form labels, ARIA attributes for status, keyboard navigation
- **Loading states:** Skeleton loaders for tables, disabled button states during submission
- **Empty states:** Friendly messages when no leave requests exist ("No pending requests")
- **Confirmation modals:** For destructive actions (reject, delete)
- **Toast notifications:** Top-right positioned success/error messages after actions
- **Icon library:** Heroicons (outline style for navigation, solid for status indicators)