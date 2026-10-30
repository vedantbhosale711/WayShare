import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email skipped — not configured] To: ${to}, Subject: ${subject}`);
    return { skipped: true };
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `"WayShare" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
    return { error: err.message };
  }
};

export const bookingConfirmationEmail = (passenger, ride, driver, vehicle, booking) => ({
  subject: `🚗 WayShare — Booking Confirmed: ${ride.origin_address} → ${ride.destination_address}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#16a34a;">✅ Booking Confirmed!</h2>
      <p>Hi <strong>${passenger.full_name}</strong>, your WayShare booking is confirmed.</p>
      <hr/>
      <h3>Ride Details</h3>
      <p><strong>From:</strong> ${ride.origin_address}<br/>
      <strong>To:</strong> ${ride.destination_address}<br/>
      <strong>Date:</strong> ${new Date(ride.departure_datetime).toLocaleString('en-IN')}<br/>
      <strong>Seats:</strong> ${booking.seats_booked}<br/>
      <strong>Contribution:</strong> ₹${booking.total_amount}</p>
      <hr/>
      <h3>Driver Details</h3>
      <p><strong>Name:</strong> ${driver.full_name}<br/>
      <strong>Mobile:</strong> ${driver.mobile}</p>
      <h3>Vehicle</h3>
      <p><strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.color})<br/>
      Reg: ${vehicle.registration_number}</p>
      <hr/>
      <p style="color:#6b7280;font-size:12px;">WayShare is a carpool platform. Please verify travel details with your driver directly.</p>
    </div>
  `,
});

export const emergencyContactEmail = (contact, passenger, ride, driver, vehicle) => ({
  subject: `🚗 WayShare Safety Alert — ${passenger.full_name}'s Ride Details`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#2563eb;">🔒 WayShare Safety Notification</h2>
      <p>Hi <strong>${contact.contact_name}</strong>,</p>
      <p><strong>${passenger.full_name}</strong> has listed you as their emergency contact on WayShare and has booked a ride. Here are the trip details for your safety records:</p>
      <hr/>
      <h3>Trip Details</h3>
      <p><strong>From:</strong> ${ride.origin_address}<br/>
      <strong>To:</strong> ${ride.destination_address}<br/>
      <strong>Departure:</strong> ${new Date(ride.departure_datetime).toLocaleString('en-IN')}</p>
      <hr/>
      <h3>Driver Information</h3>
      <p><strong>Name:</strong> ${driver.full_name}<br/>
      <strong>Mobile:</strong> ${driver.mobile}</p>
      <h3>Vehicle</h3>
      <p><strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.color})<br/>
      Registration: <strong>${vehicle.registration_number}</strong></p>
      <hr/>
      <p style="color:#6b7280;font-size:12px;">This is an automated safety notification from WayShare. If you have concerns, please contact ${passenger.full_name} directly.</p>
    </div>
  `,
});
