import { useState } from 'react';
import './RSVP.css';
import config from '../config';

const RSVP = () => {
    const [formData, setFormData] = useState({
        name: '',
        guests: '1',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Submitted:', formData);
        // Here you would normally send the data to a backend
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: '', guests: '1', message: '' });
        }, 3000);
    };

    return (
        <section className="rsvp-section section-container" id="rsvp">
            <div className="rsvp-container">
                <h2 className="section-title">Are you attending?</h2>
                <p className="rsvp-subtitle">We kindly ask you to RSVP by {config.rsvp.deadline}</p>

                {isSubmitted ? (
                    <div className="success-message">
                        <h3>Thank you!</h3>
                        <p>We've received your RSVP.</p>
                    </div>
                ) : (
                    <form className="rsvp-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="John & Jane Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="guests">Number of Guests</label>
                            <select
                                id="guests"
                                name="guests"
                                value={formData.guests}
                                onChange={handleChange}
                            >
                                <option value="1">1 Person</option>
                                <option value="2">2 People</option>
                                <option value="3">3 People</option>
                                <option value="4">4 People</option>
                                <option value="0">Regretfully decline</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message for the Couple</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="4"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Any dietary requirements or special messages?"
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">Send RSVP</button>
                    </form>
                )}
            </div>
        </section>
    );
};

export default RSVP;
