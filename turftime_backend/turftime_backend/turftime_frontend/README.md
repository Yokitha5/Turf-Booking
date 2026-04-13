# TurfTime - Sports Ground Booking System

A comprehensive platform for booking sports venues like turf grounds, badminton courts, and swimming pools. TurfTime connects facility owners with sports enthusiasts for seamless slot reservations.

## Features

### User Authentication
- JWT-Based Login System with stateless, secure access
- Role-Based Access Control (RBAC) for Player, Venue Owner, and Admin roles

### Player Features
- Search venues by sport (Cricket, Football, Tennis, Badminton) and location
- Filter by price, amenities, and rating
- Real-time slot booking with calendar view
- Peak vs Non-Peak hour pricing
- Team creation and management
- Matchmaking with other teams
- Venue reviews and ratings

### Venue Owner Features
- Dashboard with daily/weekly bookings overview
- Slot availability management
- Dynamic pricing rules and discounts
- Customer contact management
- Revenue tracking

### Admin Features
- Venue verification system
- User dispute management
- Platform analytics and reporting
- User and venue management

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns, react-datepicker
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Demo Accounts

For testing purposes, use these demo credentials:

- **Player Account**: 
  - Email: `player@demo.com`
  - Password: `demo123`

- **Venue Owner Account**:
  - Email: `owner@demo.com`
  - Password: `demo123`

- **Admin Account**:
  - Email: `admin@demo.com`
  - Password: `demo123`

## Project Structure

```
TURFTIME/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/         # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── VenuesPage.jsx
│   │   ├── VenueDetailPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── player/      # Player-specific pages
│   │   ├── owner/       # Owner-specific pages
│   │   └── admin/       # Admin-specific pages
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Implementation Status

✅ User Authentication (JWT mock implementation)  
✅ Role-Based Access Control  
✅ Venue Search and Filtering  
✅ Venue Details and Reviews  
✅ Slot Booking System  
✅ Payment Integration (Mock)  
✅ Player Dashboard  
✅ Owner Dashboard  
✅ Admin Dashboard  
✅ Responsive Design  
✅ Protected Routes  

## Future Enhancements

- Backend API integration with Spring Boot
- Real payment gateway integration
- Team and community features
- Chat functionality between users
- SMS/WhatsApp notifications
- PDF booking receipts
- Advanced analytics and reporting
- MongoDB integration for flexible data storage
- MySQL integration for structured data

## License

This project is part of a final year academic project.

## Support

For support, email support@turftime.com
