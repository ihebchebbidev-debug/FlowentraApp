/**
 * One-click endpoint templates.
 *
 * Each template fills the Create/Edit form with a working configuration:
 *   - allowed methods
 *   - allowed origins (left blank → user fills the client domain)
 *   - ExpectedSchema (required-keys JSON enforced server-side)
 *   - ResponseTemplate (returned to the caller after a successful POST)
 *   - description
 *
 * Add new templates by appending to ENDPOINT_TEMPLATES.
 */

export type EndpointTemplate = {
  id: string;
  /** Short label shown on the picker chip. */
  label: string;
  /** One-line summary under the label. */
  summary: string;
  /** Emoji/icon for the chip (kept as text to avoid a lucide import per template). */
  icon: string;
  /** Pre-fill payload merged into the form on click. */
  preset: {
    name: string;
    description: string;
    allowedMethods: string;
    allowedOrigins: string;
    /** JSON string. Server enforces required keys. */
    expectedSchema: string;
    /** JSON string returned to the caller on success. */
    responseTemplate: string;
  };
};

const json = (obj: unknown) => JSON.stringify(obj, null, 2);

export const ENDPOINT_TEMPLATES: EndpointTemplate[] = [
  {
    id: 'landing-vehicle-quote',
    label: 'Landing page — vehicle quote',
    summary:
      'Capture name, email, phone, vehicle, requested service, description and company from a client landing page form.',
    icon: '🚗',
    preset: {
      name: 'Landing page — Vehicle quote request',
      description:
        'Receives quote requests from a client landing page form (name, email, phone, vehicle, service, description, company).',
      allowedMethods: 'POST',
      allowedOrigins: '',
      expectedSchema: json({
        required: [
          'fullName',
          'email',
          'phone',
          'vehicle',
          'service',
          'description',
          'companyName',
        ],
      }),
      responseTemplate: json({
        success: true,
        message: 'Thank you, your request has been received.',
      }),
    },
  },
  {
    id: 'contact-form',
    label: 'Generic contact form',
    summary: 'Simple name + email + message capture for any website contact form.',
    icon: '✉️',
    preset: {
      name: 'Contact form',
      description: 'Receives messages from a website contact form.',
      allowedMethods: 'POST',
      allowedOrigins: '',
      expectedSchema: json({ required: ['name', 'email', 'message'] }),
      responseTemplate: json({ success: true, message: 'Message received.' }),
    },
  },
  {
    id: 'lead-capture',
    label: 'Lead capture',
    summary: 'B2B lead form with company, role, and interest.',
    icon: '🎯',
    preset: {
      name: 'Lead capture',
      description: 'Captures B2B leads from marketing landing pages.',
      allowedMethods: 'POST',
      allowedOrigins: '',
      expectedSchema: json({
        required: ['fullName', 'email', 'companyName', 'role', 'interest'],
      }),
      responseTemplate: json({
        success: true,
        message: 'Thanks — our team will reach out shortly.',
      }),
    },
  },
  {
    id: 'webhook-passthrough',
    label: 'Webhook passthrough',
    summary: 'Accept any payload (no schema). Useful for third-party webhooks.',
    icon: '🔁',
    preset: {
      name: 'Inbound webhook',
      description: 'Generic webhook receiver — no schema enforcement.',
      allowedMethods: 'POST,PUT',
      allowedOrigins: '*',
      expectedSchema: '',
      responseTemplate: json({ received: true }),
    },
  },
];
