// Central configuration file for the wedding website

const config = {
    // Couple Info
    couple: {
        name1: "name1",
        name2: "name2",
        namesFormatted: "name1  & name2"
    },

    // Hero Section
    hero: {
        subtitle: "We are getting married",
        dateText: "may 10, 2026",
        locationText: "The Grand Estate, Tuscany, Italy",
        backgroundImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
    },

    // Details Section
    details: {
        ceremony: {
            dayOfWeek: "Saturday",
            dateFull: "September 24, 2026",
            calendarLink: "#", // Add your Google/Apple calendar link here
            timeStart: "4:00 PM",
            timeNotes: "Reception to follow"
        },
        venue: {
            name: "The Grand Estate",
            address: "Villa di Belvedere, Tuscany",
            mapUrl: "https://www.google.com/maps/place/Tuscany,+Italy"
        }
    },

    // Countdown Timer
    // Format: YYYY-MM-DDTHH:mm:ss
    countdownTarget: "2026-09-24T16:00:00",

    // Photo Gallery Features
    allowGuestUploads: true,
    apiUrl: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:3001/api` : 'http://localhost:3001/api'),

    // Photo Gallery Images
    images: [
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544078751-58fee218a096?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],

    // RSVP Section
    rsvp: {
        deadline: "August 1st, 2026"
    },

    // Background Music
    music: {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    }
};

export default config;
