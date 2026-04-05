import React, { useState, useEffect } from 'react';
import { Mail, Building2, User, Phone, Search, Loader2, CheckCircle2, MessageSquare, X, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reply Modal States
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/contact');
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'new' ? 'read' : 'replied';
      if (currentStatus === 'replied') return;

      const { data } = await api.put(`/contact/${id}/status`, { status: newStatus });
      if (data.success) {
        setMessages(messages.map(msg => msg._id === id ? data.data : msg));
        toast.success(`Message marked as ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openReplyModal = (msg) => {
    setSelectedMessage(msg);
    setReplyText('');
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const { data } = await api.post(`/contact/${selectedMessage._id}/reply`, {
        replyMessage: replyText
      });
      if (data.success) {
        toast.success('Reply sent successfully!');
        setMessages(messages.map(msg => msg._id === selectedMessage._id ? data.data : msg));
        setReplyModalOpen(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.role.toLowerCase().replace('_', ' ').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-display">Contact Messages</h2>
          <p className="text-sm text-gray-500">View and manage messages from the Sales page</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, facility or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No messages found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility & Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => (
                  <tr key={msg._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{msg.name}</span>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          <a href={`mailto:${msg.email}`} className="hover:text-brand-teal transition-colors">{msg.email}</a>
                        </div>
                        {msg.phone && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            <a href={`tel:${msg.phone}`} className="hover:text-brand-teal transition-colors">{msg.phone}</a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center text-gray-900 font-medium">
                          <Building2 className="h-4 w-4 mr-1 text-brand-teal" />
                          {msg.facility}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1 capitalize">
                          <User className="h-3.5 w-3.5 mr-1" />
                          {msg.role.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs break-words">
                            {msg.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        msg.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        msg.status === 'read' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {msg.status === 'new' && (
                          <button
                            onClick={() => handleStatusChange(msg._id, 'read')}
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Read
                          </button>
                        )}
                        {msg.status !== 'replied' && (
                          <button
                            onClick={() => openReplyModal(msg)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-dark transition-colors shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Reply
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {replyModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reply to {selectedMessage.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMessage.email}</p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-32 overflow-y-auto text-sm text-gray-600">
                <span className="font-semibold block mb-1 text-gray-700">Original Message:</span>
                {selectedMessage.message}
              </div>

              <form onSubmit={handleReplySubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Reply</label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                      rows={5}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-all resize-none text-gray-700 text-sm"
                      placeholder="Type your response here..."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReplyModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-teal text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {submittingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
