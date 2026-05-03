import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const contactMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', message: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all fields');
      return;
    }
    contactMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-green-50 text-zinc-900">

      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold">Contact Us</h1>
          <p className="text-zinc-500 mt-3">
            Get in touch with our team for integration or support
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">

        {/* INFO */}
        <div className="space-y-6">

          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-green-700" />
              <span className="font-medium">ammadwork123@gmail.com</span>
            </div>
          </div>


          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-700" />
              <span className="font-medium">Karachi, Pakistan</span>
            </div>
          </div>

        </div>

        {/* FORM */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">

          <h2 className="text-xl font-semibold mb-4">Send a message</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full border border-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-200"
            />

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full border border-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-200"
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your message"
              rows="5"
              className="w-full border border-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-200"
            />

            <button
              type="submit"
              disabled={contactMutation.isPending}
              className="w-full bg-green-700 text-white rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {contactMutation.isPending ? 'Sending...' : 'Send Message'}
            </button>

          </form>

        </div>

      </div>

      {/* FOOTER */}
      

    </div>
  );
};

export default Contact;
