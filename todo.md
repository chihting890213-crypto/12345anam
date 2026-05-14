# Flower Ordering System - Todo

## Phase 1: Database Schema
- [x] users table (with role: admin/staff/customer)
- [x] staff_accounts table (username/password for staff login)
- [x] flower_folders table
- [x] flowers table
- [x] regions table
- [x] timeslot_capacities table
- [x] bank_accounts table
- [x] orders table
- [x] order_messages table (staff-customer interaction)
- [x] payment_info table

## Phase 2: Backend tRPC Routes
- [ ] auth router (staff login, customer token, me)
- [ ] staff router (CRUD staff accounts)
- [ ] flowers router (CRUD flowers + folders)
- [ ] regions router (CRUD regions + timeslots)
- [ ] orders router (create, list, detail, update status)
- [ ] messages router (interaction)
- [ ] payment router (bank accounts CRUD)

## Phase 3: Frontend Core
- [ ] Memphis style CSS (peach bg, geometric shapes, bold fonts)
- [ ] Login page (staff login form)
- [ ] Customer query page (order lookup by order number)
- [ ] DashboardLayout with role-based nav
- [ ] Route setup in App.tsx

## Phase 4: Admin Dashboard
- [ ] Staff management page (CRUD)
- [ ] Flower management (folders + flowers)
- [ ] Region & timeslot capacity settings
- [ ] Bank account management

## Phase 5: Order System
- [ ] Create order page (full fields)
- [ ] Orders list page
- [ ] Order detail page
- [ ] Staff review/approval flow
- [ ] Capacity check (show "fully booked")

## Phase 6: Customer Interface
- [ ] Order query by unique order number
- [ ] View order status
- [ ] View staff messages and reply

## Phase 7: Calendar View
- [ ] Calendar with orders per day
- [ ] Timeslot capacity visualization

## Phase 8: Docker Deployment
- [ ] docker-compose.yml
- [ ] DB init script
- [ ] .env template
- [ ] Deployment guide (README)

## Bugs
- None yet
