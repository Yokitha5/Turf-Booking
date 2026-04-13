import { Search, Clock, Shield, Users } from 'lucide-react';
import badmintonImg from '../assets/images/BadmintonImage.jpg';
import basketballImg from '../assets/images/BasketballImage.jpg';
import cricketImg from '../assets/images/CricketImage.jpg';
import footballImg from '../assets/images/FootballImage.jpg';
import swimmingImg from '../assets/images/swimming.jpg';
import tennisImg from '../assets/images/tennis.jpg';
import tableTennisImg from '../assets/images/tableTennisImage.jpg';
import pickleballImg from '../assets/images/pickleball.jpg';

export const features = [
  {
    Icon: Search,
    title: 'Easy Search',
    description: 'Find the perfect venue by sport, location, and amenities',
  },
  {
    Icon: Clock,
    title: 'Instant Booking',
    description: 'Book your slots in seconds with real-time availability',
  },
  {
    Icon: Shield,
    title: 'Secure Payments',
    description: 'Safe and secure payment processing for peace of mind',
  },
  {
    Icon: Users,
    title: 'Community',
    description: 'Connect with teams and find opponents for your games',
  },
];

export const popularSports = [
  { name: 'Cricket', image: cricketImg, venues: 45, bgColor: 'bg-green-200', borderColor: 'border-green-200' },
  { name: 'Football', image: footballImg, venues: 38, bgColor: 'bg-orange-200', borderColor: 'border-orange-200' },
  { name: 'Badminton', image: badmintonImg, venues: 52, bgColor: 'bg-pink-200', borderColor: 'border-pink-200' },
  { name: 'Tennis', image: tennisImg, venues: 28, bgColor: 'bg-emerald-300', borderColor: 'border-emerald-300' },
  { name: 'Swimming', image: swimmingImg, venues: 32, bgColor: 'bg-cyan-300', borderColor: 'border-cyan-300' },
  { name: 'Basketball', image: basketballImg, venues: 35, bgColor: 'bg-purple-200', borderColor: 'border-purple-200' },
  { name: 'Pickleball', image: pickleballImg, venues: 24, bgColor: 'bg-amber-300', borderColor: 'border-amber-300' },
  { name: 'Table Tennis', image: tableTennisImg, venues: 29, bgColor: 'bg-indigo-300', borderColor: 'border-indigo-300' },
];

export const testimonials = [
  {
    name: 'Harini',
    role: 'Cricket Enthusiast',
    comment:
      'TurfTime made it so easy to book our weekly cricket matches. The platform is user-friendly and reliable!',
    rating: 5,
  },
  {
    name: 'Vishani',
    role: 'Badminton Player',
    comment:
      'Love the community features! Found a great group of players through the platform.',
    rating: 5,
  },
  {
    name: 'Sujitha',
    role: 'Venue Owner',
    comment:
      'As a venue owner, TurfTime helped me manage bookings efficiently and increased my business significantly.',
    rating: 5,
  },
];

