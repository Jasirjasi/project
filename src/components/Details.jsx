import './Details.css';
import { useConfig } from '../context/ConfigContext';

const Details = () => {
    const { config } = useConfig();
    const ceremony = config?.details?.ceremony || {};
    const venue = config?.details?.venue || {};
    const couple = config?.couple || {};

    const dateStr = ceremony.dateFull || "May 10, 2026";
    const month = (dateStr.split(' ')[0] || "MAY").substring(0, 3).toUpperCase();
    const dayMatch = dateStr.match(/\d+/);
    const day = dayMatch ? dayMatch[0] : "10";

    const muhurthamText = ceremony.muhurtham || ceremony.timeStart;
    const muhurthamLabel = ceremony.muhurthamLabel || (config?.theme?.traditionalMode ? 'Muhurtham' : 'Ceremony Time');

    const getCalendarUrl = () => {
        if (ceremony.calendarLink && ceremony.calendarLink !== '#') {
            return ceremony.calendarLink;
        }

        let startDateStr = '20260510T100000';
        let endDateStr = '20260510T140000';

        if (config.countdownTarget) {
            try {
                const d = new Date(config.countdownTarget);
                if (!isNaN(d.getTime())) {
                    const pad = (n) => String(n).padStart(2, '0');
                    const year = d.getFullYear();
                    const month = pad(d.getMonth() + 1);
                    const day = pad(d.getDate());
                    const hours = pad(d.getHours());
                    const minutes = pad(d.getMinutes());
                    
                    startDateStr = `${year}${month}${day}T${hours}${minutes}00`;
                    
                    const endD = new Date(d.getTime() + 4 * 60 * 60 * 1000);
                    endDateStr = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
                }
            } catch (e) {
                // fallback
            }
        }

        const title = `Wedding of ${couple.namesFormatted || 'Couple'}`;
        const details = `Wedding Ceremony of ${couple.namesFormatted || 'Couple'}`;
        const location = `${venue.name || ''}, ${venue.address || ''}`;

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDateStr}/${endDateStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    };

    return (
        <section className="details section-container" id="details">
            <h2 className="section-title">When & Where</h2>

            <div className="details-grid">
                <div className="detail-card">
                    <div className="icon">
                        <div className="calendar-date">
                            <span className="month">{month}</span>
                            <span className="day">{day}</span>
                        </div>
                    </div>
                    <h3>The Date</h3>
                    <p>{ceremony.dayOfWeek}</p>
                    <p className="highlight">{ceremony.dateFull}</p>
                    {muhurthamText && (
                        <p className="muhurtham">{muhurthamLabel}: {muhurthamText}</p>
                    )}
                    <a 
                        href={getCalendarUrl()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="calendar-link"
                    >
                        Add to Calendar
                    </a>
                </div>

                <div className="detail-card">
                    <div className="icon">⏰</div>
                    <h3>The Time</h3>
                    <p>Ceremony begins at</p>
                    <p className="highlight">{ceremony.timeStart}</p>
                    {ceremony.timeNotes && <p>{ceremony.timeNotes}</p>}
                </div>

                <div className="detail-card">
                    <div className="icon">📍</div>
                    <h3>The Venue</h3>
                    <p>{venue.name}</p>
                    <p className="highlight">{venue.address}</p>
                    {venue.mapUrl && (
                        <button 
                            onClick={() => window.open(venue.mapUrl, '_blank', 'noopener,noreferrer')}
                            className="map-btn"
                        >
                            View on Map
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Details;
