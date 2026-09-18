# DevelopmentHR

DevelopmentHR is a full-stack Human Resources management application built as a reusable HR system and portfolio project.

The system combines leave management, employee administration, payroll workflows, Malaysian statutory contribution calculations, shift scheduling, approval workflows, document generation, and role-based access.

## Features

### Leave Management
- Employee leave applications
- Multiple leave types
- HR and management approval workflows
- Leave balances and entitlement tracking
- Leave calendar and history
- PDF leave forms
- Email notifications
- Supporting document uploads

### Employee Management
- Employee profiles
- Employment information
- Department and branch information
- Role-based user management
- Payroll profiles

### Payroll
- Monthly payroll runs
- Draft, review, and finalized payroll states
- Earnings and deductions
- Malaysian EPF calculations
- SOCSO calculations
- EIS calculations
- PCB support
- Employer contribution tracking
- Payslip PDF generation
- Payroll audit information

### Shift Scheduling
- Weekly employee schedules
- Morning, afternoon, and night shifts
- Extra-duty scheduling
- Secondary-duty scheduling
- Off-day and leave tracking
- Printable schedules
- Off-day request forms

### Authentication and Authorization
- Google OAuth
- Express session authentication
- PostgreSQL-backed sessions
- Employee, HR, and Director roles
- Protected frontend and backend routes

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- TanStack Query
- Wouter
- React Hook Form
- Zod

### Backend
- Node.js
- Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- Neon

### Services
- Google OAuth
- Cloudinary
- Resend
- PDFKit

## Requirements

- Node.js 20.x
- PostgreSQL database
- Google OAuth credentials
- Cloudinary account
- Resend account

## Local Setup

Clone the repository:

```bash
git clone https://github.com/firdausraduan29/DevelopmentHR.git
cd DevelopmentHR
