export interface Event {
  id: number;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  activity: string;
  facilitator: string;
  location: string;
  requirements: string;
  comments?: string;
  photo?: string;
  popular?: string;
  video?: string; // New field for video URL
}

export interface Speaker {
  id: number;
  name: string;
  role: string;
  bio?: string;
  activity: string;
  imageUrl: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  eventName?: string;
  eventDate?: string;
  presentation?: string;
}

export interface UserEvent {
  id: number;
  title: string;
  timeRange: string;
  timeLeft: string;
  day?: string;
}

export interface PopularEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  imageUrl: string;
}

export interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  photoUrl: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}