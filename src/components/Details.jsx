import './Details.css';
import config from '../config';

const Details = () => {
    return (
        <section className="details section-container" id="details">
            <h2 className="section-title">When & Where</h2>

            <div className="details-grid">
                <div className="detail-card">
                    <div className="icon">📅</div>
                    <h3>The Date</h3>
                    <p>{config.details.ceremony.dayOfWeek}</p>
                    <p className="highlight">{config.details.ceremony.dateFull}</p>
                    <a href={config.details.ceremony.calendarLink} className="calendar-link">Add to Calendar</a>
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
                    <a href={config.details.venue.mapUrl} target="https://maps.app.goo.gl/8eCL2YXpZkreyP5P8" rel="noopener noreferrer" className="map-btn">
                        View on Map
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Details;
