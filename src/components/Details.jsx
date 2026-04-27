import './Details.css';
import { useConfig } from '../context/ConfigContext';

const Details = () => {
    const { config } = useConfig();
    const dateStr = config.details.ceremony.dateFull || "May 10, 2026";
    const month = dateStr.split(' ')[0].substring(0, 3).toUpperCase();
    const day = dateStr.match(/\d+/)[0];

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
                    <p>{config.details.ceremony.dayOfWeek}</p>
                    <p className="highlight">{config.details.ceremony.dateFull}</p>
                    <p className="muhurtham">Muhurtham: {config.details.ceremony.muhurtham || config.details.ceremony.timeStart}</p>
                    <a 
                        href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Wedding of " + config.couple.namesFormatted)}&dates=20260510T100000/20260510T140000&details=${encodeURIComponent("Wedding Ceremony of " + config.couple.namesFormatted)}&location=${encodeURIComponent(config.details.venue.name + ", " + config.details.venue.address)}`} 
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
                    <p className="highlight">{config.details.ceremony.timeStart}</p>
                    <p>{config.details.ceremony.timeNotes}</p>
                </div>

                <div className="detail-card">
                    <div className="icon">📍</div>
                    <h3>The Venue</h3>
                    <p>{config.details.venue.name}</p>
                    <p className="highlight">{config.details.venue.address}</p>
                    <button 
                        onClick={() => window.open(config.details.venue.mapUrl, '_blank', 'noopener,noreferrer')}
                        className="map-btn"
                    >
                        View on Map
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Details;
