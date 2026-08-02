// Central configuration file for the wedding website

const config = {
    // Couple Info
    couple: {
        name1: "Adithi",
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
            muhurtham: "10:00 AM",
            calendarLink: "#",
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
    countdownTarget: "2026-05-10T10:00:00",

    // Photo Gallery Features
    allowGuestUploads: true,
    apiUrl: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? '/api' : `http://${window.location.hostname}:3001/api`) : 'http://localhost:3001/api'),

    // Photo Gallery Images
    images: [],
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
