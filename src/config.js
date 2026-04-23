// Central configuration file for the wedding website

const config = {
    // Couple Info
    couple: {
        name1: "adithi",
        name2: "Rajkiran",
        namesFormatted: "Adithi  & Rajkiran",
        namesFormattedStyle: {}
    },

    // Theme Settings
    theme: {
        primaryColor: "#810100",
        textColor: "#1B1717",
        headingFont: "Cormorant Infant",
        bodyFont: "Inter",
        accentFont: "Great Vibes",
        baseFontSize: "16px",
        customFonts: [],
        showParticles: true,
        traditionalMode: true
    },

    // Hero Section
    hero: {
        subtitle: "We are getting married",
        subtitleStyle: {},
        dateText: "May 10, 2026",
        dateStyle: {},
        timeText: "10:00 AM",
        timeStyle: {},
        locationText: "Bhavana Auditorium, Chempoor Venjarammoodu, Kerala",
        locationStyle: {},
        backgroundImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
        backgroundPosition: "center",
        overlayColor: "rgba(27, 23, 23, 0.6)"
    },

    // Details Section
    details: {
        ceremony: {
            dayOfWeek: "Sunday",
            dateFull: "May 10, 2026",
            calendarLink: "#", // Add your Google/Apple calendar link here
            timeStart: "10:00 AM",
            timeNotes: "Reception to follow"
        },
        venue: {
            name: "Bhavana Auditorium",
            address: "Chempoor Venjarammoodu, Kerala",
            mapUrl: "https://maps.app.goo.gl/CwHctxL7nTDSfiVcA"
        }
    },

    // Countdown Timer
    // Format: YYYY-MM-DDTHH:mm:ss
    countdownTarget: "2026-09-24T16:00:00",

    // Photo Gallery Features
    allowGuestUploads: true,
    apiUrl: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? '/api' : `http://${window.location.hostname}:3001/api`) : 'http://localhost:3001/api'),

    // Photo Gallery Images
    images: [
        // 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        // 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        // 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        // 'https://images.unsplash.com/photo-1544078751-58fee218a096?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        // 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        // 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    // RSVP Section
    rsvp: {
        deadline: "May 1st, 2026"
    },

    // Background Music
    music: {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    }
};

export default config;
